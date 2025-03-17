"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Plus, Minus, Play, Pause, RefreshCw, Undo2, Check } from 'lucide-react';

// Type definitions
interface Team {
  id: number;
  name: string;
  logo: string;
  score: number;
  onIce: boolean;
  isChallenger: boolean;
  isGoalie?: boolean;
}

interface HistoryState {
  teams: Team[];
  period: number;
}

// Save state to localStorage
const saveToLocalStorage = (key: string, value: any): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }
};

// Load state from localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Error loading from localStorage:', e);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Base64 encoded default icons
const DEFAULT_ICONS = {
  rats: "/rat-logo.png",
  ginkos: "/ginko.svg",
  sweetNLow: "/sweet-n-low.svg",
  goalies: "/goalie.png"};

const HockeyScoreboard: React.FC = () => {
  // Colors
  const colors = {
    yellow: '#FECB00', // Updated yellow color
    black: '#2A2A2A',  // Lighter rat black/gray-black
    bgLight: '#3A3A3A', // Even lighter background for certain elements
  };
  
  // Game state with localStorage persistence
  const [minutes, setMinutes] = useState<number>(() => loadFromLocalStorage<number>('hockey_minutes', 5));
  const [seconds, setSeconds] = useState<number>(() => loadFromLocalStorage<number>('hockey_seconds', 0));
  const [time, setTime] = useState<number>(() => loadFromLocalStorage<number>('hockey_time', 5 * 60));
  const [isRunning, setIsRunning] = useState<boolean>(false); // Don't load running state from storage
  const [period, setPeriod] = useState<number>(() => loadFromLocalStorage<number>('hockey_period', 1));
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadFromLocalStorage<boolean>('hockey_sound', true));
  
  // Define default teams with pre-set icons
  const defaultTeams: Team[] = [
    { id: 1, name: 'Rats', logo: DEFAULT_ICONS.rats, score: 0, onIce: true, isChallenger: true },
    { id: 2, name: 'Ginkos', logo: DEFAULT_ICONS.ginkos, score: 0, onIce: true, isChallenger: false },
    { id: 3, name: 'Sweet-N-Low', logo: DEFAULT_ICONS.sweetNLow, score: 0, onIce: false, isChallenger: false },
    { id: 4, name: 'Goalies', logo: DEFAULT_ICONS.goalies, score: 0, onIce: true, isChallenger: false, isGoalie: true }
  ];
  
  const [teams, setTeams] = useState<Team[]>(() => loadFromLocalStorage<Team[]>('hockey_teams', defaultTeams));
  
  // Add state for tracking score history (for undo functionality)
  const [scoreHistory, setScoreHistory] = useState<HistoryState[]>(() => loadFromLocalStorage<HistoryState[]>('hockey_score_history', []));
  
  // Add state for editing score
  const [editingScore, setEditingScore] = useState<number | null>(null);
  const [tempScore, setTempScore] = useState<number>(0);
  
  // Save state changes to localStorage
  useEffect(() => saveToLocalStorage('hockey_minutes', minutes), [minutes]);
  useEffect(() => saveToLocalStorage('hockey_seconds', seconds), [seconds]);
  useEffect(() => saveToLocalStorage('hockey_time', time), [time]);
  useEffect(() => saveToLocalStorage('hockey_period', period), [period]);
  useEffect(() => saveToLocalStorage('hockey_sound', soundEnabled), [soundEnabled]);
  useEffect(() => saveToLocalStorage('hockey_teams', teams), [teams]);
  useEffect(() => saveToLocalStorage('hockey_score_history', scoreHistory), [scoreHistory]);
  
  const buzzerRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize buzzer sound with better format handling
  useEffect(() => {
    const tryFormats = [
      '/buzzer.mp3',
      '/buzzer.ogg',
      'https://assets.mixkit.co/active_storage/sfx/1565/1565-preview.mp3'
    ];
    
    let audioLoaded = false;
    
    // Try loading each format until one works
    for (const format of tryFormats) {
      try {
        buzzerRef.current = new Audio(format);
        
        // Configure audio for optimal playback
        buzzerRef.current.preload = 'auto';
        buzzerRef.current.volume = 1.0;
        audioLoaded = true;
        console.log(`Loaded audio format: ${format}`);
        break;
      } catch (e) {
        console.warn(`Failed to load audio format: ${format}`, e);
      }
    }
    
    if (!audioLoaded) {
      console.error("Could not load any audio format");
    }
    
    return () => {
      if (buzzerRef.current) {
        buzzerRef.current.pause();
        buzzerRef.current = null;
      }
    };
  }, []);
  
  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime(prevTime => prevTime - 1);
      }, 1000);
    } else if (isRunning && time === 0) {
      setIsRunning(false);
      // Play buzzer when timer reaches zero - with better error handling
      if (soundEnabled && buzzerRef.current) {
        // Reset the audio to the beginning in case it was played before
        buzzerRef.current.currentTime = 0;
        
        // Play the sound with proper error handling
        const playPromise = buzzerRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Playback started successfully
              console.log("Buzzer playing successfully");
            })
            .catch(error => {
              console.error("Error playing buzzer:", error);
              // Try an alternative approach for mobile devices
              document.addEventListener('click', function playOnFirstClick() {
                if (buzzerRef.current) {
                  buzzerRef.current.play().catch(e => console.error("Still cannot play audio:", e));
                }
                document.removeEventListener('click', playOnFirstClick);
              }, { once: true });
            });
        }
      }
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, time, soundEnabled]);
  
  // Reset timer to 5 minutes
  const resetTimer = (): void => {
    setMinutes(5);
    setSeconds(0);
    setTime(5 * 60);
    setIsRunning(false);
  };
  
  // Update time when minutes or seconds change
  useEffect(() => {
    setTime(minutes * 60 + seconds);
  }, [minutes, seconds]);
  
  // Update minutes and seconds when time changes
  useEffect(() => {
    setMinutes(Math.floor(time / 60));
    setSeconds(time % 60);
  }, [time]);
  
  // Toggle timer pause/play
  const toggleTimer = (): void => {
    setIsRunning(!isRunning);
  };
  
  // Toggle sound
  const toggleSound = (): void => {
    setSoundEnabled(!soundEnabled);
  };
  
  // Increment period and reset timer
  const incrementPeriod = (): void => {
    setPeriod(prev => prev + 1);
    resetTimer();
  };
  
  // Decrement period
  const decrementPeriod = (): void => {
    setPeriod(prev => (prev > 1 ? prev - 1 : 1));
  };
  
  // Save current state to history before making changes (for undo functionality)
  const addToHistory = (): void => {
    // Limit history to last 15 actions
    setScoreHistory(prev => {
      const newHistory = [
        {
          teams: JSON.parse(JSON.stringify(teams)),
          period: period
        },
        ...prev
      ];
      
      // Keep only the last 15 entries
      if (newHistory.length > 15) {
        return newHistory.slice(0, 15);
      }
      
      return newHistory;
    });
  };
  
  // Undo last action
  const undoLastAction = (): void => {
    if (scoreHistory.length > 0) {
      const lastState = scoreHistory[0];
      
      // Restore teams and period
      setTeams(lastState.teams);
      setPeriod(lastState.period);
      
      // Remove this state from history
      setScoreHistory(prev => prev.slice(1));
    }
  };
  
  // Handle team scoring
  const handleTeamScore = (scoringTeamId: number): void => {
    // Save current state to history before making changes
    addToHistory();
    
    // Find the scoring team
    const scoringTeam = teams.find(team => team.id === scoringTeamId);
    
    if (!scoringTeam || !scoringTeam.onIce) return;
    
    const updatedTeams = teams.map(team => {
      // The scoring team gets 2 points and stays on ice
      if (team.id === scoringTeamId) {
        return { ...team, score: team.score + 2, onIce: true, isChallenger: false };
      } 
      // Goalies get 0 points in this case but stay on ice
      else if (team.isGoalie) {
        return { ...team, onIce: true };
      }
      // The team that was on ice but didn't score goes off ice
      else if (team.onIce && !team.isChallenger && team.id !== scoringTeamId) {
        return { ...team, onIce: false, isChallenger: false };
      }
      // The challenging team that was on ice but didn't score goes off ice
      else if (team.onIce && team.isChallenger && team.id !== scoringTeamId) {
        return { ...team, onIce: false, isChallenger: false };
      }
      // The waiting team becomes the new challenger
      else if (!team.onIce && !team.isGoalie) {
        return { ...team, onIce: true, isChallenger: true };
      }
      return team;
    });
    
    setTeams(updatedTeams);
    incrementPeriod();
  };
  
  // Handle timeout/tie (challenger wins, goalies get shutout points)
  const handleTimeout = (): void => {
    // Save current state to history before making changes
    addToHistory();
    
    const updatedTeams = teams.map(team => {
      // Challenger gets 1 point and stays on ice, but is no longer challenger
      if (team.onIce && team.isChallenger) {
        return { ...team, score: team.score + 1, onIce: true, isChallenger: false };
      }
      // Current non-challenger team goes off ice
      else if (team.onIce && !team.isChallenger && !team.isGoalie) {
        return { ...team, onIce: false, isChallenger: false };
      }
      // Goalies get 2 points for shutout and stay on ice
      else if (team.isGoalie) {
        return { ...team, score: team.score + 2, onIce: true };
      }
      // Waiting team becomes the new challenger
      else if (!team.onIce && !team.isGoalie) {
        return { ...team, onIce: true, isChallenger: true };
      }
      return team;
    });
    
    setTeams(updatedTeams);
    incrementPeriod();
  };
  
  // Save edited score
  const saveEditedScore = (teamId: number): void => {
    // Save current state to history before making changes
    addToHistory();
    
    setTeams(teams.map(team => 
      team.id === teamId ? { ...team, score: parseInt(tempScore.toString()) || 0 } : team
    ));
    setEditingScore(null);
  };
  
  // Update team name
  const updateTeamName = (id: number, newName: string): void => {
    setTeams(teams.map(team => 
      team.id === id ? { ...team, name: newName } : team
    ));
  };
  
  // Update team logo
  const updateTeamLogo = (id: number, logoFile: File): void => {
    if (!logoFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const target = e.target;
      if (target && typeof target.result === 'string') {
        setTeams(teams.map(team => 
          team.id === id ? { ...team, logo: target.result } : team
        ));
      }
    };
    reader.readAsDataURL(logoFile);
  };
  
  // Setup teams modal functionality
  const [showTeamSetup, setShowTeamSetup] = useState<boolean>(false);
  
  // Reorder teams
  const reorderTeams = (teamIds: number[]): void => {
    const reorderedTeams: Team[] = [];
    teamIds.forEach((id, index) => {
      const team = teams.find(t => t.id === id);
      if (team) {
        reorderedTeams.push({
          ...team,
          id: index + 1, // Reassign IDs based on new order
        });
      }
    });
    
    if (reorderedTeams.length === teams.length) {
      setTeams(reorderedTeams);
    }
  };
  
  // Reset entire game
  const resetGame = (): void => {
    if (window.confirm("Are you sure you want to reset the entire game? All scores and history will be lost.")) {
      setTeams(defaultTeams);
      setPeriod(1);
      setScoreHistory([]);
      resetTimer();
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: colors.black, color: colors.yellow }}>
      {/* Header */}
      <header className="text-center p-4 border-b border-yellow-400 flex items-center justify-center">
        <div className="w-10 h-10 mr-2">
          <img src="/leach.jpg" alt="Leach Hockey Logo" className="w-full h-full" />
        </div>
        <h1 className="text-2xl font-bold tracking-wider" style={{ color: colors.yellow }}>LEACH SCOREBOARD</h1>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-4">
        {/* Timer section - made larger and centered */}
        <div className="flex flex-col items-center justify-center mb-4">
          {/* Hockey-style clock */}
          <div 
            className="w-full max-w-md flex justify-center mb-4"
            style={{ 
              borderRadius: '4px',
              backgroundColor: colors.black,
              padding: '8px',
              border: `2px solid ${colors.yellow}`
            }}
          >
            <div className="flex items-center">
              {/* Minutes */}
              <div className="flex flex-col">
                <button 
                  className="px-2 text-xs"
                  style={{ backgroundColor: colors.yellow, color: colors.black }}
                  onClick={() => setMinutes(prev => Math.min(prev + 1, 99))}
                >
                  ▲
                </button>
                <input
                  type="text"
                  value={minutes.toString().padStart(2, '0')}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 99) {
                      setMinutes(val);
                    }
                  }}
                  className="w-36 text-7xl font-mono text-center bg-transparent border-none outline-none"
                  style={{ color: 'white', lineHeight: '1.2' }}
                />
                <button 
                  className="px-2 text-xs" 
                  style={{ backgroundColor: colors.yellow, color: colors.black }}
                  onClick={() => setMinutes(prev => Math.max(prev - 1, 0))}
                >
                  ▼
                </button>
              </div>
              
              <div className="text-7xl font-mono flex items-center px-1" style={{ color: 'white' }}>:</div>
              
              {/* Seconds */}
              <div className="flex flex-col">
                <button 
                  className="px-2 text-xs"
                  style={{ backgroundColor: colors.yellow, color: colors.black }}
                  onClick={() => setSeconds(prev => Math.min(prev + 10, 59))}
                >
                  ▲
                </button>
                <input
                  type="text"
                  value={seconds.toString().padStart(2, '0')}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 59) {
                      setSeconds(val);
                    }
                  }}
                  className="w-36 text-7xl font-mono text-center bg-transparent border-none outline-none"
                  style={{ color: 'white', lineHeight: '1.2' }}
                />
                <button 
                  className="px-2 text-xs"
                  style={{ backgroundColor: colors.yellow, color: colors.black }}
                  onClick={() => setSeconds(prev => Math.max(prev - 10, 0))}
                >
                  ▼
                </button>
              </div>
            </div>
          </div>
          
          {/* Play/Pause button centered below clock with reset and mute buttons on sides */}
          <div className="flex items-center justify-center w-full">
            <button 
              onClick={resetTimer}
              className="p-3 rounded-full mr-8"
              style={{ 
                backgroundColor: 'transparent', 
                color: colors.yellow, 
                border: `2px solid ${colors.yellow}`
              }}
            >
              <RefreshCw size={24} />
            </button>
            
            <button 
              onClick={toggleTimer}
              className="p-4 rounded-full"
              style={{ backgroundColor: colors.yellow, color: colors.black }}
            >
              {isRunning ? <Pause size={40} /> : <Play size={40} />}
            </button>
            
            <button 
              onClick={toggleSound}
              className="p-3 rounded-full ml-8"
              style={{ 
                backgroundColor: 'transparent', 
                color: colors.yellow, 
                border: `2px solid ${colors.yellow}`
              }}
            >
              {soundEnabled ? <Bell size={24} /> : <BellOff size={24} />}
            </button>
          </div>
        </div>
  
        {/* Teams scoreboard */}
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4">
            {teams.map((team) => (
              <div 
                key={team.id} 
                className={`p-4 rounded-lg flex items-center justify-between ${team.isGoalie ? 'mb-4' : ''}`}
                style={{ 
                  backgroundColor: team.onIce ? colors.bgLight : colors.black, 
                  borderTop: `1px solid ${colors.yellow}`,
                  borderRight: `1px solid ${colors.yellow}`,
                  borderBottom: `1px solid ${colors.yellow}`,
                  borderLeft: team.isChallenger ? `1px solid ${colors.yellow}` : `1px solid ${colors.yellow}`,
                }}
              >
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-full mr-3 flex items-center justify-center bg-gray-700 overflow-hidden"
                    style={{ cursor: showTeamSetup ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (!showTeamSetup) return; // Only allow logo updates in setup mode
                      
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement;
                        if (target && target.files && target.files.length > 0) {
                          updateTeamLogo(team.id, target.files[0]);
                        }
                      };
                      input.click();
                    }}
                  >
                    {team.logo ? 
                      <img src={team.logo} alt={`${team.name} logo`} className="w-full h-full object-cover" /> : 
                      <span className="text-xl">{showTeamSetup ? '+' : ''}</span>}
                  </div>
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => updateTeamName(team.id, e.target.value)}
                      className="bg-transparent border-b border-yellow-400 outline-none"
                      style={{ 
                        width: team.name.length + 3 + 'ch', 
                        minWidth: '80px',
                        color: colors.yellow
                      }}
                    />
                    <div className="text-sm font-medium mt-1 px-2 py-0 rounded-full inline-block"
                      style={{ 
                        backgroundColor: team.onIce ? colors.yellow : 'transparent',
                        color: team.onIce ? colors.black : colors.yellow,
                        border: !team.onIce ? `1px solid ${colors.yellow}` : 'none'
                      }}
                    >
                      {team.onIce ? (team.isChallenger ? 'Challenger' : (team.isGoalie ? '-' : 'Defending')) : 'Waiting'}
                    </div>
                  </div>
                </div>
                {/* Editable score box */}
                <div className="flex items-center">
                  {editingScore === team.id ? (
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={tempScore}
                        onChange={(e) => setTempScore(e.target.value)}
                        className="w-16 h-12 text-3xl font-bold text-center bg-transparent border-2 outline-none mr-2"
                        style={{ 
                          color: 'white',
                          borderColor: colors.yellow,
                          borderRadius: '4px'
                        }}
                        min="0"
                        max="999"
                      />
                      <button
                        onClick={() => saveEditedScore(team.id)}
                        className="p-2 rounded-full"
                        style={{ 
                          backgroundColor: colors.bgLight,
                          color: colors.yellow,
                          border: `2px solid ${colors.yellow}`
                        }}
                      >
                        <Check size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div 
                        className="text-4xl font-bold flex items-center justify-center"
                        style={{ 
                          color: 'white',
                          backgroundColor: colors.black,
                          border: `2px solid ${colors.yellow}`,
                          width: '80px', // Fixed width
                          height: '64px',
                          borderRadius: '4px',
                          flexShrink: 0, // Prevent shrinking when team name is long
                          cursor: 'pointer' // Add this to indicate it's clickable
                        }}
                        onClick={() => {
                          setEditingScore(team.id);
                          setTempScore(team.score);
                        }}
                      >
                        {team.score}
                        
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
  
        {/* Period counter and controls - MOVED BELOW TEAM SCORE CARDS */}
        <div className="flex justify-center items-center px-4 py-2 mb-6" style={{ backgroundColor: colors.bgLight }}>
          <div className="flex items-center">
            <button 
              onClick={decrementPeriod}
              className="p-2 rounded-l-lg"
              style={{ backgroundColor: colors.yellow, color: colors.black }}
            >
              <Minus size={20} />
            </button>
            <div className="px-4 py-2" style={{ 
              backgroundColor: colors.black, 
              color: 'white',
              border: `2px solid ${colors.yellow}`,
              minWidth: '120px',
              textAlign: 'center'
            }}>
              Period: <span className="font-bold">{period}</span>
            </div>
            <button 
              onClick={incrementPeriod}
              className="p-2 rounded-r-lg"
              style={{ backgroundColor: colors.yellow, color: colors.black }}
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
        
        {/* Score buttons */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-3 text-center">INPUT SCORES:</h2>
          <div className="grid grid-cols-2 gap-4">
            {teams.filter(team => team.onIce && !team.isGoalie).map((team) => (
              <button
                key={team.id}
                onClick={() => handleTeamScore(team.id)}
                className="p-4 rounded-lg text-center text-lg font-bold"
                style={{ 
                  backgroundColor: colors.yellow, 
                  color: colors.black
                }}
              >
                {team.name} Scores
              </button>
            ))}
            <button
              onClick={handleTimeout}
              className="p-4 rounded-lg text-center col-span-2 mt-2 text-lg font-bold"
              style={{ 
                backgroundColor: colors.bgLight, 
                color: colors.yellow, 
                border: `2px solid ${colors.yellow}`
              }}
            >
              No Score / Timeout
            </button>
            
            {/* Undo button */}
            <button
              onClick={undoLastAction}
              disabled={scoreHistory.length === 0}
              className="p-3 rounded-lg text-center col-span-2 mt-2 text-base font-bold flex items-center justify-center"
              style={{ 
                backgroundColor: scoreHistory.length === 0 ? '#555' : colors.bgLight,
                color: scoreHistory.length === 0 ? '#999' : colors.yellow,
                border: `1px solid ${scoreHistory.length === 0 ? '#555' : colors.yellow}`,
                opacity: scoreHistory.length === 0 ? 0.4 : 1,
                cursor: scoreHistory.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <Undo2 size={20} className="mr-2" />
              Undo Last Scoring Action
              {scoreHistory.length > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-sm" style={{ backgroundColor: colors.yellow, color: colors.black }}>
                  {scoreHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Team Setup link */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowTeamSetup(true)}
            className="text-base underline"
            style={{ color: colors.yellow }}
          >
            Setup Teams
          </button>
        </div>

        <div className="text-center mt-8 mb-4">
          <button
            onClick={resetGame}
            className="p-4 rounded-lg text-center text-base font-bold"
            style={{ 
              backgroundColor: 'transparent',
              color: colors.yellow, 
              border: `2px solid ${colors.yellow}`
            }}
          >
            Reset Entire Game
          </button>
        </div>
        
        {/* Team Setup Modal */}
        {showTeamSetup && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <div className="p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: colors.black, border: `2px solid ${colors.yellow}` }}
            >
              <h2 className="text-xl font-bold mb-4 text-center" style={{ color: colors.yellow }}>Team Setup</h2>
              
              <div className="mb-6">
                <p className="mb-2">Reorder teams by dragging names into position</p>
                <div className="space-y-2">
                  {teams.filter(team => !team.isGoalie).map((team, index) => (
                    <div 
                      key={team.id} 
                      className="p-3 rounded bg-gray-800 flex items-center"
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', team.id.toString())}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
                        const currentNonGoalieTeams = teams.filter(t => !t.isGoalie).map(t => t.id);
                        const draggedIndex = currentNonGoalieTeams.indexOf(draggedId);
                        const targetIndex = index;
                        
                        if (draggedIndex !== -1) {
                          const newOrder = [...currentNonGoalieTeams];
                          newOrder.splice(draggedIndex, 1);
                          newOrder.splice(targetIndex, 0, draggedId);
                          
                          // Add goalie team back
                          const goalieTeam = teams.find(t => t.isGoalie);
                          if (goalieTeam) {
                            newOrder.push(goalieTeam.id);
                          }
                          
                          reorderTeams(newOrder);
                        }
                      }}
                    >
                      <div className="cursor-move mr-2">≡</div>
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => updateTeamName(team.id, e.target.value)}
                        className="bg-transparent border-b border-yellow-400 flex-grow outline-none"
                        style={{ color: colors.yellow }}
                      />
                      <div 
                        className="w-10 h-10 rounded-full ml-2 flex items-center justify-center bg-gray-700 overflow-hidden cursor-pointer"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files && target.files.length > 0) {
                              updateTeamLogo(team.id, target.files[0]);
                            }
                          };
                          input.click();
                        }}
                      >
                        {team.logo ? 
                          <img src={team.logo} alt={`${team.name} logo`} className="w-full h-full object-cover" /> : 
                          <span>+</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Goalie Team</h3>
                <div className="p-3 rounded bg-gray-800 flex items-center">
                  {teams.filter(team => team.isGoalie).map(team => (
                    <React.Fragment key={team.id}>
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => updateTeamName(team.id, e.target.value)}
                        className="bg-transparent border-b border-yellow-400 flex-grow outline-none"
                        style={{ color: colors.yellow }}
                      />
                      <div 
                        className="w-10 h-10 rounded-full ml-2 flex items-center justify-center bg-gray-700 overflow-hidden cursor-pointer"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files && target.files.length > 0) {
                              updateTeamLogo(team.id, target.files[0]);
                            }
                          };
                          input.click();
                        }}
                      >
                        {team.logo ? 
                          <img src={team.logo} alt={`${team.name} logo`} className="w-full h-full object-cover" /> : 
                          <span>+</span>}
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              <button
                onClick={() => setShowTeamSetup(false)}
                className="w-full p-2 rounded-lg"
                style={{ backgroundColor: colors.yellow, color: colors.black }}
              >
                Save Teams
              </button>

                <div className="text-center mt-8 mb-4">
                <button
                  onClick={resetGame}
                  className="p-4 rounded-lg text-center text-base font-bold"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: colors.yellow, 
                    border: `2px solid ${colors.yellow}`
                  }}
                >
                  Reset Entire Game
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HockeyScoreboard;