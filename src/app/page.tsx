"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellOff, Plus, Minus, Play, Pause, RefreshCw } from 'lucide-react';

const HockeyScoreboard = () => {
  // Colors
  const colors = {
    yellow: '#FECB00', // Updated yellow color
    black: '#2A2A2A',  // Lighter rat black/gray-black
    bgLight: '#3A3A3A', // Even lighter background for certain elements
  };
  
  // Game state
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [time, setTime] = useState(5 * 60); // 5 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [period, setPeriod] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [teams, setTeams] = useState([
    { id: 1, name: 'Rats', logo: null, score: 0, onIce: true, isChallenger: true },
    { id: 2, name: 'Ginkos', logo: null, score: 0, onIce: true, isChallenger: false },
    { id: 3, name: 'Sweet-N-Low', logo: null, score: 0, onIce: false, isChallenger: false },
    { id: 4, name: 'Goalies', logo: null, score: 0, onIce: true, isChallenger: false, isGoalie: true }
  ]);
  
  const buzzerRef = useRef(null);
  
  // Initialize buzzer sound - with alternative options and better sound handling
  useEffect(() => {
    // Primary buzzer sound (air horn - more typical for sports)
    buzzerRef.current = new Audio('/buzzer.mp3'); // Local file in public folder
    
    // Configure audio for optimal playback
    buzzerRef.current.preload = 'auto';
    buzzerRef.current.volume = 1.0;
    
    // Add event listeners to handle loading issues
    buzzerRef.current.addEventListener('error', () => {
      console.error("Error loading primary buzzer sound, falling back to alternative");
      // Fallback to a different sound if the primary one fails
      buzzerRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1565/1565-preview.mp3');
      buzzerRef.current.preload = 'auto';
      buzzerRef.current.volume = 1.0;
    });
    
    return () => {
      if (buzzerRef.current) {
        buzzerRef.current.pause();
        buzzerRef.current = null;
      }
    };
  }, []);
  
  // Timer logic
  useEffect(() => {
    let interval = null;
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
                buzzerRef.current.play().catch(e => console.error("Still cannot play audio:", e));
                document.removeEventListener('click', playOnFirstClick);
              }, { once: true });
            });
        }
      }
    }
    
    return () => clearInterval(interval);
  }, [isRunning, time, soundEnabled]);
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Reset timer to 5 minutes
  const resetTimer = () => {
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
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };
  
  // Toggle sound
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };
  
  // Increment period and reset timer
  const incrementPeriod = () => {
    setPeriod(prev => prev + 1);
    resetTimer();
  };
  
  // Decrement period
  const decrementPeriod = () => {
    setPeriod(prev => (prev > 1 ? prev - 1 : 1));
  };
  
  // Handle team scoring
  const handleTeamScore = (scoringTeamId) => {
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
  const handleTimeout = () => {
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
  
  // Update team name
  const updateTeamName = (id, newName) => {
    setTeams(teams.map(team => 
      team.id === id ? { ...team, name: newName } : team
    ));
  };
  
  // Update team logo
  const updateTeamLogo = (id, logoFile) => {
    if (!logoFile) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setTeams(teams.map(team => 
        team.id === id ? { ...team, logo: e.target.result } : team
      ));
    };
    reader.readAsDataURL(logoFile);
  };
  
  // Setup teams modal functionality
  const [showTeamSetup, setShowTeamSetup] = useState(false);
  
  // Reorder teams
  const reorderTeams = (teamIds) => {
    const reorderedTeams = [];
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
  
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: colors.black, color: colors.yellow }}>
      {/* Header */}
      <header className="text-center p-4 border-b border-yellow-400">
        <h1 className="text-5xl font-bold tracking-wider" style={{ color: colors.yellow }}>THE LEACH</h1>
      </header>
      
      {/* Period counter and controls */}
      <div className="flex justify-center items-center px-4 py-2 mb-4" style={{ backgroundColor: colors.bgLight }}>
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
      
      {/* Main content */}
      <main className="flex-1 p-4">
        {/* Timer section - made larger and centered */}
        <div className="flex flex-col items-center justify-center mb-8">
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
                  className="w-24 text-7xl font-mono text-center bg-transparent border-none outline-none"
                  style={{ color: 'white', lineHeight: 1.2 }}
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
                  className="w-24 text-7xl font-mono text-center bg-transparent border-none outline-none"
                  style={{ color: 'white', lineHeight: 1.2 }}
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
          <h2 className="text-2xl font-semibold mb-3 text-center">SCOREBOARD</h2>
          <div className="grid grid-cols-1 gap-4">
            {teams.map((team) => (
              <div 
                key={team.id} 
                className={`p-4 rounded-lg flex items-center justify-between ${team.isGoalie ? 'mb-4' : ''}`}
                style={{ 
                  backgroundColor: team.onIce ? colors.bgLight : colors.black, 
                  borderLeft: team.isChallenger ? `8px solid ${colors.yellow}` : 'none',
                  border: `1px solid ${colors.yellow}`,
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
                        if (e.target.files.length > 0) {
                          updateTeamLogo(team.id, e.target.files[0]);
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
                      {team.onIce ? (team.isChallenger ? 'Challenger' : (team.isGoalie ? 'Goalies' : 'Defending')) : 'Waiting'}
                    </div>
                  </div>
                </div>
                {/* Fixed width score box */}
                <div 
                  className="text-4xl font-bold flex items-center justify-center"
                  style={{ 
                    color: 'white',
                    backgroundColor: colors.black,
                    border: `2px solid ${colors.yellow}`,
                    width: '80px', // Fixed width
                    height: '64px',
                    borderRadius: '4px',
                    flexShrink: 0 // Prevent shrinking when team name is long
                  }}
                >
                  {team.score}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Score buttons */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-3 text-center">SCORE</h2>
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
          </div>
        </div>
        
        {/* Team Setup link (moved below scoreboard) */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowTeamSetup(true)}
            className="text-base underline"
            style={{ color: colors.yellow }}
          >
            Setup Teams
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
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', team.id)}
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
                            if (e.target.files.length > 0) {
                              updateTeamLogo(team.id, e.target.files[0]);
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
                            if (e.target.files.length > 0) {
                              updateTeamLogo(team.id, e.target.files[0]);
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
            </div>
          </div>
        )}
        
        {/* Removing duplicate Team Setup Modal that was in the original code */}
      </main>
    </div>
  );
};

export default HockeyScoreboard;