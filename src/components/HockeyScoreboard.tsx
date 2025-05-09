"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { Check, X } from 'lucide-react';
import { Team, HistoryState, DEFAULT_ICONS } from '../types';
import { saveToLocalStorage } from '../utils/storage';
import { requestWakeLock, releaseWakeLock, isWakeLockSupported } from '../utils/wakeLock';
import { initializeTimer, updateTimerState, syncTimerOnVisibilityChange } from '../utils/timerSync';
import TimerSection from './TimerSection';
import TeamsSection from './TeamsSection';
import ControlsSection from './ControlsSection';
import TeamSetupModal from './TeamSetupModal';

// The Hockey Scoreboard component
const HockeyScoreboard: React.FC = () => {
  // Hydration state management
  const [isClient, setIsClient] = useState<boolean>(false);
  
  // Edit mode state
  const [editMode, setEditMode] = useState<boolean>(false);
  
  // Wake lock state
  const [wakeLockSupported, setWakeLockSupported] = useState<boolean>(false);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  // Stable references with useMemo
  const colors = useMemo(() => ({
    yellow: '#FECB00', // Updated yellow color
    black: '#2A2A2A',  // Lighter rat black/gray-black
    bgLight: '#3A3A3A', // Even lighter background for certain elements
  }), []);

  // Define default teams with pre-set icons using useMemo
  const defaultTeams: Team[] = useMemo(() => [
    { id: 1, name: 'Rats', logo: DEFAULT_ICONS.rats, score: 0, onIce: true, isChallenger: true },
    { id: 2, name: 'Ginkos', logo: DEFAULT_ICONS.ginkos, score: 0, onIce: true, isChallenger: false },
    { id: 3, name: 'Sweet-N-Low', logo: DEFAULT_ICONS.sweetNLow, score: 0, onIce: false, isChallenger: false },
    { id: 4, name: 'Goalies', logo: DEFAULT_ICONS.goalies, score: 0, onIce: true, isChallenger: false, isGoalie: true }
  ], []);

  // Hydration-safe state initialization
  const [minutes, setMinutes] = useState<number>(5);
  const [seconds, setSeconds] = useState<number>(0);
  const [time, setTime] = useState<number>(5 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [period, setPeriod] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [teams, setTeams] = useState<Team[]>(defaultTeams);
  const [scoreHistory, setScoreHistory] = useState<HistoryState[]>([]);
  // Removed unused editingScore state
  const [showTeamSetup, setShowTeamSetup] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  
  // Store original values for canceling edits
  const [originalTeams, setOriginalTeams] = useState<Team[]>([]);
  const [originalPeriod, setOriginalPeriod] = useState<number>(1);

  // Refs
  const buzzerRef = useRef<HTMLAudioElement | null>(null);
  // Flag to prevent circular updates between time and minutes/seconds
  const isUpdatingFromTick = useRef<boolean>(false);
  // Flag to track if timer has been initialized
  const timerInitialized = useRef<boolean>(false);

  // Client-side effect for initialization and hydration
  useEffect(() => {
    setIsClient(true);

    // Hydrate from localStorage only on client
    const hydrateFromStorage = () => {
      try {
        const storedMinutes = localStorage.getItem('hockey_minutes');
        const storedSeconds = localStorage.getItem('hockey_seconds');
        const storedTime = localStorage.getItem('hockey_time');
        const storedPeriod = localStorage.getItem('hockey_period');
        const storedSoundEnabled = localStorage.getItem('hockey_sound');
        const storedTeams = localStorage.getItem('hockey_teams');
        const storedScoreHistory = localStorage.getItem('hockey_score_history');

        // Update state with localStorage values
        if (storedMinutes) setMinutes(parseInt(storedMinutes));
        if (storedSeconds) setSeconds(parseInt(storedSeconds));
        if (storedTime) setTime(parseInt(storedTime));
        if (storedPeriod) setPeriod(parseInt(storedPeriod));
        if (storedSoundEnabled) setSoundEnabled(storedSoundEnabled === 'true');
        if (storedTeams) setTeams(JSON.parse(storedTeams));
        if (storedScoreHistory) setScoreHistory(JSON.parse(storedScoreHistory));
      } catch (error) {
        console.error('Error hydrating from localStorage', error);
      }
    };

    // Mobile check
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    // Check if Wake Lock API is supported
    const checkWakeLockSupport = () => {
      const supported = isWakeLockSupported();
      setWakeLockSupported(supported);
      console.log('Wake Lock API supported:', supported);
    };

    // Run initialization functions
    hydrateFromStorage();
    checkMobile();
    checkWakeLockSupport();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Initialize timer on component mount
  useEffect(() => {
    if (!isClient) return;
    
    // Initialize timer once on mount
    if (!timerInitialized.current) {
      console.log('Initializing timer on mount');
      initializeTimer(time, isRunning);
      timerInitialized.current = true;
    }
  }, [isClient]);
  
  // Effect for handling page visibility changes
  useEffect(() => {
    if (!isClient) return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible');
        
        // Initialize timer if not already initialized
        if (!timerInitialized.current) {
          console.log('Initializing timer');
          initializeTimer(time, isRunning);
          timerInitialized.current = true;
        } else if (isRunning) {
          // Sync the timer when the page becomes visible again
          console.log('Syncing timer');
          const syncedTime = syncTimerOnVisibilityChange();
          if (syncedTime !== null) {
            console.log('Syncing timer to:', syncedTime);
            
            // Use isUpdatingFromTick to prevent circular updates
            isUpdatingFromTick.current = true;
            setTime(syncedTime);
            
            // Reset the flag after a short delay
            setTimeout(() => {
              isUpdatingFromTick.current = false;
            }, 50);
          }
        }
        
        // Re-acquire wake lock if it was active before
        if (wakeLockActive) {
          requestWakeLock().then(success => {
            setWakeLockActive(success);
          });
        }
      } else {
        console.log('Page hidden');
        // Update timer state before the page is hidden
        updateTimerState(time, isRunning);
      }
    };
    
    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient, time, isRunning, wakeLockActive]);
  
  // Effect for managing wake lock based on timer state
  useEffect(() => {
    if (!isClient || !wakeLockSupported) return;
    
    const manageWakeLock = async () => {
      if (isRunning) {
        // Request wake lock when timer is running
        const success = await requestWakeLock();
        setWakeLockActive(success);
      } else if (wakeLockActive) {
        // Release wake lock when timer is stopped
        await releaseWakeLock();
        setWakeLockActive(false);
      }
    };
    
    manageWakeLock();
  }, [isClient, isRunning, wakeLockSupported, wakeLockActive]);

  // Save state changes to localStorage
  useEffect(() => {
    if (isClient) {
      saveToLocalStorage('hockey_minutes', minutes);
    }
  }, [minutes, isClient]);
  
  useEffect(() => {
    if (isClient) {
      saveToLocalStorage('hockey_seconds', seconds);
    }
  }, [seconds, isClient]);
  
  useEffect(() => {
    if (isClient) {
      saveToLocalStorage('hockey_time', time);
    }
  }, [time, isClient]);
  
  useEffect(() => {
    if (isClient) {
      saveToLocalStorage('hockey_period', period);
    }
  }, [period, isClient]);
  
  useEffect(() => {
    if (isClient) {
      saveToLocalStorage('hockey_sound', soundEnabled);
    }
  }, [soundEnabled, isClient]);
  
  useEffect(() => {
    if (isClient) {
      saveToLocalStorage('hockey_teams', teams);
    }
  }, [teams, isClient]);
  
  useEffect(() => {
    if (isClient) {
      saveToLocalStorage('hockey_score_history', scoreHistory);
    }
  }, [scoreHistory, isClient]);

  // Initialize buzzer sound with better format handling
  useEffect(() => {
    if (!isClient) return;

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
  }, [isClient]);
  
  // Timer logic
  useEffect(() => {
    if (!isClient) return;
    
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
  }, [isRunning, time, soundEnabled, isClient]);
  
  // Reset timer to 5 minutes
  const resetTimer = (): void => {
    setMinutes(5);
    setSeconds(0);
    setTime(5 * 60);
    setIsRunning(false);
  };
  
  // Update time when minutes or seconds change (only if not from a tick)
  useEffect(() => {
    if (!isClient) return;
    if (!isUpdatingFromTick.current) {
      setTime(minutes * 60 + seconds);
    }
  }, [minutes, seconds, isClient]);
  
  // Update minutes and seconds when time changes (mark as from tick)
  useEffect(() => {
    if (!isClient || isUpdatingFromTick.current) return;
    
    // Set the flag before updating to prevent circular updates
    isUpdatingFromTick.current = true;
    
    // Update minutes and seconds based on time
    setMinutes(Math.floor(time / 60));
    setSeconds(time % 60);
    
    // Reset the flag after a short delay
    const timeoutId = setTimeout(() => {
      isUpdatingFromTick.current = false;
    }, 50);
    
    return () => clearTimeout(timeoutId);
  }, [time, isClient]);
  
  // Toggle timer pause/play
  const toggleTimer = (): void => {
    setIsRunning(!isRunning);
  };
  
  // Toggle sound
  const toggleSound = (): void => {
    setSoundEnabled(!soundEnabled);
  };
  
  // Functions to enable/disable edit mode
  const enableEditMode = (): void => {
    if (window.confirm("Are you sure you want to directly edit the scoreboard?")) {
      // Store original values for cancellation
      setOriginalTeams(JSON.parse(JSON.stringify(teams)));
      setOriginalPeriod(period);
      setEditMode(true);
    }
  };
  
  const confirmEdits = (): void => {
    setEditMode(false);
  };
  
  const cancelEdits = (): void => {
    // Restore original values
    setTeams(originalTeams);
    setPeriod(originalPeriod);
    setEditMode(false);
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
          if (isClient) {
            localStorage.setItem('hockey_score_history', JSON.stringify(newHistory));
          }
        } catch (storageError) {
          console.warn('Storage error, reducing history size:', storageError);
          const reducedHistory = [currentState, ...(prev.slice(0, 2))]; // Keep only 3 entries
          if (isClient) {
            localStorage.setItem('hockey_score_history', JSON.stringify(reducedHistory));
          }
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
  
  // Update team score
  const updateTeamScore = (teamId: number, newScore: number): void => {
    setTeams(teams.map(team => 
      team.id === teamId ? { ...team, score: newScore } : team
    ));
  };
  
  // Update team name
  const updateTeamName = (id: number, newName: string): void => {
    setTeams(teams.map(team => 
      team.id === id ? { ...team, name: newName } : team
    ));
  };
  
  // Update team logo with proper type handling
  const updateTeamLogo = (id: number, logoFile: File): void => {
    if (!logoFile) return;
    
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
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
  
  // Reset entire game
  const resetGame = (): void => {
    if (typeof window !== 'undefined' && window.confirm("Are you sure you want to reset the entire game? All scores and history will be lost.")) {
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

  // If not client-side, return null to prevent hydration issues
  if (!isClient) {
    return null;
  }

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
        {/* Timer section */}
        <TimerSection 
          minutes={minutes}
          seconds={seconds}
          setMinutes={setMinutes}
          setSeconds={setSeconds}
          isRunning={isRunning}
          toggleTimer={toggleTimer}
          resetTimer={resetTimer}
          soundEnabled={soundEnabled}
          toggleSound={toggleSound}
          colors={colors}
          editMode={editMode}
        />
        
        {/* Teams scoreboard */}
        <TeamsSection 
          teams={teams}
          updateTeamScore={updateTeamScore}
          updateTeamName={updateTeamName}
          showTeamSetup={showTeamSetup}
          updateTeamLogo={updateTeamLogo}
          colors={colors}
          editMode={editMode}
        />
        
        {/* Controls section */}
        <ControlsSection 
          period={period}
          incrementPeriod={incrementPeriod}
          decrementPeriod={decrementPeriod}
          handleTeamScore={handleTeamScore}
          handleTimeout={handleTimeout}
          undoLastAction={undoLastAction}
          scoreHistory={scoreHistory}
          setShowTeamSetup={setShowTeamSetup}
          enableEditMode={enableEditMode}
          resetGame={resetGame}
          teams={teams}
          colors={colors}
          editMode={editMode}
        />
        
        {/* Team Setup Modal */}
        <TeamSetupModal 
          showTeamSetup={showTeamSetup}
          setShowTeamSetup={setShowTeamSetup}
          teams={teams}
          setTeams={setTeams}
          setPeriod={setPeriod}
          resetTimer={resetTimer}
          setScoreHistory={setScoreHistory}
          defaultTeams={defaultTeams}
          isMobile={isMobile}
          colors={colors}
          updateTeamName={updateTeamName}
          updateTeamLogo={updateTeamLogo}
        />
        
        {/* Edit mode confirmation/cancel buttons - positioned at the bottom to not block interaction */}
        {editMode && (
          <div 
            className="fixed bottom-4 left-0 right-0 flex items-center justify-center" 
            style={{ zIndex: 50 }}
          >
            <div className="flex space-x-4 p-3 rounded-lg" style={{ backgroundColor: 'rgba(42, 42, 42, 0.9)' }}>
              <button
                onClick={confirmEdits}
                className="flex items-center justify-center p-3 rounded-full"
                style={{ backgroundColor: colors.yellow, color: colors.black }}
              >
                <Check size={24} className="mr-2" />
                Confirm Edits
              </button>
              <button
                onClick={cancelEdits}
                className="flex items-center justify-center p-3 rounded-full"
                style={{ 
                  backgroundColor: 'transparent', 
                  color: colors.yellow,
                  border: `2px solid ${colors.yellow}`
                }}
              >
                <X size={24} className="mr-2" />
                Cancel Edits
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default HockeyScoreboard;
