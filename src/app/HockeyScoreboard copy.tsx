"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Bell, BellOff, Plus, Minus, Play, Pause, RefreshCw, Undo2, Check } from 'lucide-react';
import dynamic from 'next/dynamic';

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
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const saveToLocalStorage = <T extends {}>(key: string, value: T): void => {
  if (typeof window !== 'undefined') {
    try {
      const serialized = JSON.stringify(value);
      // Check size before attempting to save
      const size = new Blob([serialized]).size;
      if (size > 4000000) { // 4MB limit
        console.warn(`Data for ${key} too large (${size} bytes), attempting cleanup`);
        if (key === 'hockey_score_history') {
          // For score history, save only the last entry
          const lastEntry = Array.isArray(value) ? [value[0]] : value;
          localStorage.setItem(key, JSON.stringify(lastEntry));
        } else {
          localStorage.setItem(key, serialized);
        }
      } else {
        localStorage.setItem(key, serialized);
      }
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      if (e.name === 'QuotaExceededError') {
        // Clear old data and try again
        try {
          localStorage.clear();
          localStorage.setItem(key, JSON.stringify(value));
        } catch (retryError) {
          console.error('Failed to save even after clearing storage:', retryError);
        }
      }
    }
  }
};

// Load state from localStorage
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
const loadFromLocalStorage = <T extends {}>(key: string, defaultValue: T): T => {
  if (typeof window !== 'undefined') {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) as T : defaultValue;
    } catch (e) {
      console.error('Error loading from localStorage:', e);
      return defaultValue;
    }
  }
  return defaultValue;
};

// Default icons
const DEFAULT_ICONS = {
  rats: "/rats-jersey.png",
  ginkos: "/ginkos-jersey.png",
  sweetNLow: "/sweet-jersey.png",
  goalies: "/goalies-mask.png"
} as const;

const UploadedImage = dynamic(() => Promise.resolve(({ src, alt, className }: { src: string; alt: string; className: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt={alt} className={className} />
)), { ssr: false });

const TeamLogoImage: React.FC<{ logo: string; name: string }> = ({ logo, name }) => {
  // For default icons (starting with '/') use Next Image
  if (logo.startsWith('/')) {
    return (
      <div className="relative w-full h-full">
        <Image
          src={logo}
          alt={`${name} logo`}
          fill
          sizes="48px"
          style={{objectFit: 'cover'}}
        />
      </div>
    );
  }
  
  // For uploaded images (data URLs) use client-side only rendering
  return (
    <UploadedImage 
      src={logo} 
      alt={`${name} logo`} 
      className="w-full h-full object-cover" 
    />
  );
};

interface TeamLogoProps {
  team: Team;
  updateTeamLogo: (id: number, file: File) => void;
}

const TeamLogo: React.FC<TeamLogoProps> = ({ team, updateTeamLogo }) => {
  return (
    <div
      className="w-10 h-10 rounded-full ml-2 flex items-center justify-center overflow-hidden cursor-pointer"
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
      {team.logo ? (
        <TeamLogoImage logo={team.logo} name={team.name} />
      ) : (
        <span>+</span>
      )}
    </div>
  );
};

// The Hockey Scoreboard component
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
  
  const isMobileOrTablet = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 1024; // Consider tablets as mobile
  };

  const [isMobile, setIsMobile] = useState(false);

  // Add useEffect to update mobile status
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileOrTablet());
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    try {
      const currentState = {
        teams: JSON.parse(JSON.stringify(teams)),
        period: period
      };
  
      setScoreHistory(prev => {
        // Only add if it's different from the last entry
        if (prev.length > 0 && 
            JSON.stringify(prev[0].teams) === JSON.stringify(currentState.teams) && 
            prev[0].period === currentState.period) {
          return prev;
        }
  
        const newHistory = [currentState, ...prev].slice(0, 5); // Keep only last 5 entries
        
        try {
          localStorage.setItem('hockey_score_history', JSON.stringify(newHistory));
        } catch (storageError) {
          console.warn('Storage error, reducing history size:', storageError);
          const reducedHistory = [currentState, ...(prev.slice(0, 2))]; // Keep only 3 entries
          localStorage.setItem('hockey_score_history', JSON.stringify(reducedHistory));
          return reducedHistory;
        }
  
        return newHistory;
      });
    } catch (error) {
      console.error('Error adding to history:', error);
      // Fallback to just storing current state
      setScoreHistory([{
        teams: JSON.parse(JSON.stringify(teams)),
        period: period
      }]);
    }
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
  
  // Update team logo - FIXED: Added proper type handling
  const updateTeamLogo = (id: number, logoFile: File): void => {
    if (!logoFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const target = e.target;
      if (target && target.result) {
        // Ensure we're using a string value for the logo
        const logoData = typeof target.result === 'string' 
          ? target.result 
          : ''; // If it's not a string (ArrayBuffer), use empty string as fallback
        
        setTeams(teams.map(team => 
          team.id === id ? { ...team, logo: logoData } : team
        ));
      }
    };
    reader.readAsDataURL(logoFile); // This will generate a string
  };
  
  // Setup teams modal functionality
  const [showTeamSetup, setShowTeamSetup] = useState<boolean>(false);
  
  // Reset entire game
  const resetGame = (): void => {
    if (window.confirm("Are you sure you want to reset the entire game? All scores and history will be lost.")) {
      // Clear all localStorage
      localStorage.clear();
      
      // Reset all state
      setTeams(defaultTeams);
      setPeriod(1);
      setScoreHistory([]);
      resetTimer();
      setIsRunning(false);
      setSoundEnabled(true);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: colors.black, color: colors.yellow }}>
      {/* Header */}
      <header className="text-center p-4 border-b border-yellow-400 flex items-center justify-center">
        <div className="w-10 h-10 mr-2 relative">
          <Image 
            src="/leach-logo.png" 
            alt="Leach Hockey Logo" 
            fill
            sizes="(max-width: 768px) 40px, 40px"
            style={{objectFit: 'cover'}}
            priority
          />
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
                    className="w-12 h-12 rounded-full mr-3 flex items-center justify-center overflow-hidden"
                    style={{ cursor: showTeamSetup ? 'pointer' : 'default', background: 'transparent' }}
                    onClick={() => {
                      if (!showTeamSetup) return;
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
                    {team.logo ? (
                      <TeamLogoImage logo={team.logo} name={team.name} />
                    ) : (
                      <span className="text-xl">{showTeamSetup ? '+' : ''}</span>
                    )}
                  </div>
                  <div className="flex flex-col" style={{ width: '200px' }}> {/* Add fixed width here */}
                    <input
                      type="text"
                      value={team.name}
                      onChange={(e) => updateTeamName(team.id, e.target.value)}
                      className="bg-transparent border-b border-yellow-400 outline-none"
                      style={{
                        width: '100%',  // Changed from dynamic to 100%
                        color: colors.yellow
                      }}
                    />
                    <div 
                      className="text-sm font-medium mt-1 px-2 py-0 rounded-full inline-flex items-center justify-center"
                      style={{
                        backgroundColor: team.onIce ? colors.yellow : 'transparent',
                        color: team.onIce ? colors.black : colors.yellow,
                        border: !team.onIce ? `1px solid ${colors.yellow}` : 'none',
                        width: '100px'
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
                        onChange={(e) => setTempScore(parseInt(e.target.value) || 0)}
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
                          width: '64px', // Fixed width
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
              minWidth: '160px',
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
              className={`p-3 rounded-lg text-center col-span-2 mt-2 text-base font-bold flex items-center justify-center ${
                scoreHistory.length === 0 ? 'opacity-40' : 'opacity-100'
              }`}
              style={{
                backgroundColor: colors.bgLight,
                color: scoreHistory.length === 0 ? '#999' : colors.yellow,
                border: `1px solid ${scoreHistory.length === 0 ? '#555' : colors.yellow}`,
                cursor: scoreHistory.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              <Undo2 size={20} className="mr-2" />
              Undo Last Scoring Action
              {scoreHistory.length > 0 && (
                <span 
                  className="ml-2 px-2 py-0.5 rounded-full text-sm" 
                  style={{ backgroundColor: colors.yellow, color: colors.black }}
                >
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
            Set Initial Team Status
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
              <h2 className="text-xl font-bold mb-4 text-center" style={{ color: colors.yellow }}>
                Team Setup (Initial Game Order)
              </h2>

              {/* All Teams List (except goalies) */}
              <div className="mb-6">
                <div className="space-y-2">
                  {[...teams]
                    .filter((team): team is Team => !team.isGoalie)
                    .sort((a, b) => {
                      if (a.onIce && !b.onIce) return -1;
                      if (!a.onIce && b.onIce) return 1;
                      if (a.onIce && b.onIce) {
                        if (a.isChallenger && !b.isChallenger) return 1;
                        if (!a.isChallenger && b.isChallenger) return -1;
                      }
                      return 0;
                    })
                    .map((team, index) => (
                      <div key={team.id}>
                        <div
                          className="p-3 rounded bg-gray-800 flex items-center"
                          draggable={true}
                          onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                            e.dataTransfer.setData('text/plain', team.id.toString());
                          }}
                          onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                            e.preventDefault();
                          }}
                          onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                            e.preventDefault();
                            const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
                            const currentNonGoalieTeams = teams
                              .filter(t => !t.isGoalie)
                              .sort((a, b) => {
                                if (a.onIce && !b.onIce) return -1;
                                if (!a.onIce && b.onIce) return 1;
                                if (a.onIce && b.onIce) {
                                  if (a.isChallenger && !b.isChallenger) return 1;
                                  if (!a.isChallenger && b.isChallenger) return -1;
                                }
                                return 0;
                              })
                              .map(t => t.id);
                            const draggedIndex = currentNonGoalieTeams.indexOf(draggedId);
                            if (draggedIndex !== -1) {
                              const newOrder = [...currentNonGoalieTeams];
                              newOrder.splice(draggedIndex, 1);
                              newOrder.splice(index, 0, draggedId);
                              const updatedTeams = teams.map(t => {
                                if (t.isGoalie) return t;
                                const newIndex = newOrder.indexOf(t.id);
                                return {
                                  ...t,
                                  onIce: newIndex < 2,
                                  isChallenger: newIndex === 1,
                                };
                              });
                              setTeams(updatedTeams);
                            }
                          }}
                        >
                          <div className="cursor-move mr-2">≡</div>
                          <div 
                            className="text-sm font-medium px-2 py-0 rounded-full mr-2"
                            style={{
                              backgroundColor: index === 0 ? colors.yellow : index === 1 ? colors.bgLight : 'transparent',
                              color: index === 0 ? colors.black : colors.yellow,
                              border: `1px solid ${colors.yellow}`,
                              minWidth: '90px',
                              textAlign: 'center'
                            }}
                          >
                            {index === 0 ? 'Defending' : index === 1 ? 'Challenger' : 'Waiting'}
                          </div>
                          <input
                            type="text"
                            value={team.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateTeamName(team.id, e.target.value)}
                            className="bg-transparent mr-4 border-b border-yellow-400 flex-grow outline-none"
                            style={{
                              color: colors.yellow,
                              minWidth: '130px'
                            }}
                          />
                          <TeamLogo team={team} updateTeamLogo={updateTeamLogo} />
                        </div>

                        {/* Add the up/down buttons here, right after the main team row div */}
                        {isMobile && (
                          <div className="flex justify-left ml-7 mt-2 space-x-1 text-xs">
                            <button
                              onClick={() => {
                                const currentNonGoalieTeams = teams
                                  .filter(t => !t.isGoalie)
                                  .sort((a, b) => {
                                    if (a.onIce && !b.onIce) return -1;
                                    if (!a.onIce && b.onIce) return 1;
                                    if (a.onIce && b.onIce) {
                                      if (a.isChallenger && !b.isChallenger) return 1;
                                      if (!a.isChallenger && b.isChallenger) return -1;
                                    }
                                    return 0;
                                  })
                                  .map(t => t.id);
                                
                                const currentIndex = currentNonGoalieTeams.indexOf(team.id);
                                if (currentIndex > 0) {
                                  const newOrder = [...currentNonGoalieTeams];
                                  [newOrder[currentIndex], newOrder[currentIndex - 1]] = 
                                  [newOrder[currentIndex - 1], newOrder[currentIndex]];
                                  
                                  const updatedTeams = teams.map(t => {
                                    if (t.isGoalie) return t;
                                    const newIndex = newOrder.indexOf(t.id);
                                    return {
                                      ...t,
                                      onIce: newIndex < 2,
                                      isChallenger: newIndex === 1,
                                    };
                                  });
                                  setTeams(updatedTeams);
                                }
                              }}
                              className="p-2 rounded"
                              style={{
                                backgroundColor: colors.bgLight, // Using the existing bgLight color
                                color: colors.yellow,
                                border: `2px solid ${colors.yellow}`,
                                opacity: index === 0 ? 0.5 : 1,
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                minWidth: '50px', // Added to make buttons same width
                              }}
                              disabled={index === 0}
                            >
                              ↑ Up
                            </button>
                            <button
                              onClick={() => {
                                const currentNonGoalieTeams = teams
                                  .filter(t => !t.isGoalie)
                                  .sort((a, b) => {
                                    if (a.onIce && !b.onIce) return -1;
                                    if (!a.onIce && b.onIce) return 1;
                                    if (a.onIce && b.onIce) {
                                      if (a.isChallenger && !b.isChallenger) return 1;
                                      if (!a.isChallenger && b.isChallenger) return -1;
                                    }
                                    return 0;
                                  })
                                  .map(t => t.id);
                                
                                const currentIndex = currentNonGoalieTeams.indexOf(team.id);
                                if (currentIndex < currentNonGoalieTeams.length - 1) {
                                  const newOrder = [...currentNonGoalieTeams];
                                  [newOrder[currentIndex], newOrder[currentIndex + 1]] = 
                                  [newOrder[currentIndex + 1], newOrder[currentIndex]];
                                  
                                  const updatedTeams = teams.map(t => {
                                    if (t.isGoalie) return t;
                                    const newIndex = newOrder.indexOf(t.id);
                                    return {
                                      ...t,
                                      onIce: newIndex < 2,
                                      isChallenger: newIndex === 1,
                                    };
                                  });
                                  setTeams(updatedTeams);
                                }
                              }}
                              className="p-2 rounded ml-4"
                              style={{
                                backgroundColor: colors.bgLight,
                                color: colors.yellow,
                                border: `2px solid ${colors.yellow}`,
                                opacity: index === teams.filter(t => !t.isGoalie).length - 1 ? 0.5 : 1,
                                cursor: index === teams.filter(t => !t.isGoalie).length - 1 ? 'not-allowed' : 'pointer',
                                minWidth: '50px', // Added to make buttons same width
                              }}
                              disabled={index === teams.filter(t => !t.isGoalie).length - 1}
                            >
                              ↓ Dn
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Goalie Team */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Goalie Team</h3>
                <div className="p-3 rounded bg-gray-800 flex items-center">
                  {teams.filter(team => team.isGoalie).map(team => (
                    <React.Fragment key={team.id}>
                      <input
                        type="text"
                        value={team.name}
                        onChange={(e) => updateTeamName(team.id, e.target.value)}
                        className="bg-transparent mr-4 border-b border-yellow-400 flex-grow outline-none"
                        style={{ 
                          color: colors.yellow,
                          minWidth: '150px'
                         }}
                      />
                      <TeamLogo team={team} updateTeamLogo={updateTeamLogo} />
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {/* Main buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowTeamSetup(false)}
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: 'transparent',
                      color: colors.yellow,
                      border: `2px solid ${colors.yellow}`
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const updatedTeams = teams.map(team => ({
                        ...team,
                        score: 0
                      }));
                      setTeams(updatedTeams);
                      setPeriod(1);
                      setScoreHistory([]);
                      resetTimer();
                      setShowTeamSetup(false);
                    }}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: colors.yellow, color: colors.black }}
                  >
                    Start New Game
                  </button>
                </div>

                {/* Reset link - centered */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      if (window.confirm("Reset team names and logos to defaults?")) {
                        setTeams(teams.map(team => {
                          const defaultTeam = defaultTeams.find(d => d.id === team.id);
                          return {
                            ...team,
                            name: defaultTeam?.name || team.name,
                            logo: defaultTeam?.logo || team.logo
                          };
                        }));
                      }
                    }}
                    className="text-sm underline"
                    style={{ color: colors.yellow }}
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HockeyScoreboard;