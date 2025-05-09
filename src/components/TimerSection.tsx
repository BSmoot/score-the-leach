"use client";

import React from 'react';
import { Bell, BellOff, Play, Pause, RefreshCw } from 'lucide-react';

interface TimerSectionProps {
  minutes: number;
  seconds: number;
  setMinutes: React.Dispatch<React.SetStateAction<number>>;
  setSeconds: React.Dispatch<React.SetStateAction<number>>;
  isRunning: boolean;
  toggleTimer: () => void;
  resetTimer: () => void;
  soundEnabled: boolean;
  toggleSound: () => void;
  colors: {
    yellow: string;
    black: string;
    bgLight: string;
  };
  editMode: boolean;
}

const TimerSection: React.FC<TimerSectionProps> = ({
  minutes,
  seconds,
  setMinutes,
  setSeconds,
  isRunning,
  toggleTimer,
  resetTimer,
  soundEnabled,
  toggleSound,
  colors
  // editMode is used in the parent component to control the overlay
}) => {
  return (
    <div className="flex flex-col items-center justify-center mb-4 relative">
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
      
      {/* Instruction text */}
      <p className="text-xs text-center mt-2 mb-4 max-w-md" style={{ color: colors.yellow }}>
        After each match, use the buttons below the scoreboard to input the result. Scores, match count, and clock will auto-update.
      </p>
      
      {/* We've removed the edit mode overlay that was blocking interaction */}
    </div>
  );
};

export default TimerSection;
