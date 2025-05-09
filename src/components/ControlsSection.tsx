"use client";

import React from 'react';
import { Plus, Minus, Undo2 } from 'lucide-react';
import { Team } from '../types';

interface ControlsSectionProps {
  period: number;
  incrementPeriod: () => void;
  decrementPeriod: () => void;
  handleTeamScore: (scoringTeamId: number) => void;
  handleTimeout: () => void;
  undoLastAction: () => void;
  scoreHistory: any[];
  setShowTeamSetup: (show: boolean) => void;
  enableEditMode: () => void;
  resetGame: () => void;
  teams: Team[];
  colors: {
    yellow: string;
    black: string;
    bgLight: string;
  };
  editMode: boolean;
}

const ControlsSection: React.FC<ControlsSectionProps> = ({
  period,
  incrementPeriod,
  decrementPeriod,
  handleTeamScore,
  handleTimeout,
  undoLastAction,
  scoreHistory,
  setShowTeamSetup,
  enableEditMode,
  resetGame,
  teams,
  colors,
  editMode
}) => {
  return (
    <>
      {/* Period counter and controls - Changed from "Period" to "Match" */}
      <div className="flex justify-center items-center px-4 py-2 mb-6" style={{ backgroundColor: colors.bgLight }}>
        <div className="flex items-center">
          <button 
            onClick={decrementPeriod}
            className="p-2 rounded-l-lg"
            style={{ 
              backgroundColor: editMode ? colors.yellow : colors.black, 
              color: editMode ? colors.black : colors.yellow,
              border: !editMode ? `2px solid ${colors.yellow}` : 'none',
              cursor: editMode ? 'pointer' : 'not-allowed',
              opacity: editMode ? 1 : 0.5,
              pointerEvents: editMode ? 'auto' : 'none' // Ensure clicks work in edit mode
            }}
            disabled={!editMode}
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
            Match: <span className="font-bold">{period}</span>
          </div>
          <button 
            onClick={incrementPeriod}
            className="p-2 rounded-r-lg"
            style={{ 
              backgroundColor: editMode ? colors.yellow : colors.black, 
              color: editMode ? colors.black : colors.yellow,
              border: !editMode ? `2px solid ${colors.yellow}` : 'none',
              cursor: editMode ? 'pointer' : 'not-allowed',
              opacity: editMode ? 1 : 0.5,
              pointerEvents: editMode ? 'auto' : 'none' // Ensure clicks work in edit mode
            }}
            disabled={!editMode}
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
      
      {/* Score buttons */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-center">MATCH RESULT:</h2>
        
        {/* Instruction text */}
        <p className="text-xs text-center mb-3" style={{ color: colors.yellow }}>
          Indicate the winner below and reset the clock for the next match:
        </p>
        
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
              disabled={editMode}
            >
              {team.name} Goal
            </button>
          ))}
          <button
            onClick={handleTimeout}
            className="p-4 rounded-lg text-center col-span-2 mt-2 text-lg font-bold"
            style={{ 
              backgroundColor: colors.bgLight, 
              color: colors.yellow, 
              border: `2px solid ${colors.yellow}`,
              opacity: editMode ? 0.5 : 1,
              cursor: editMode ? 'not-allowed' : 'pointer'
            }}
            disabled={editMode}
          >
            No Goals
          </button>
          
          {/* Undo button */}
          <button
            onClick={undoLastAction}
            disabled={scoreHistory.length === 0 || editMode}
            className={`p-3 rounded-lg text-center col-span-2 mt-2 text-base font-bold flex items-center justify-center ${
              scoreHistory.length === 0 || editMode ? 'opacity-40' : 'opacity-100'
            }`}
            style={{
              backgroundColor: colors.bgLight,
              color: scoreHistory.length === 0 || editMode ? '#999' : colors.yellow,
              border: `1px solid ${scoreHistory.length === 0 || editMode ? '#555' : colors.yellow}`,
              cursor: scoreHistory.length === 0 || editMode ? 'not-allowed' : 'pointer'
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
      
      {/* Team Setup and Edit Scores links */}
      <div className="text-center mb-3">
        <button
          onClick={() => setShowTeamSetup(true)}
          className="text-base underline"
          style={{ color: colors.yellow }}
          disabled={editMode}
        >
          Set Initial Team Status
        </button>
      </div>
      
      {/* Edit Scores button */}
      <div className="text-center mb-6">
        <button
          onClick={enableEditMode}
          className="text-base underline"
          style={{ 
            color: colors.yellow,
            opacity: editMode ? 0.5 : 1,
            cursor: editMode ? 'not-allowed' : 'pointer'
          }}
          disabled={editMode}
        >
          Edit Scores & Match Count
        </button>
      </div>

      {/* Reset Game button */}
      <div className="text-center mt-8 mb-4">
        <button
          onClick={resetGame}
          className="p-4 rounded-lg text-center text-base font-bold"
          style={{ 
            backgroundColor: 'transparent',
            color: colors.yellow, 
            border: `2px solid ${colors.yellow}`,
            opacity: editMode ? 0.5 : 1,
            cursor: editMode ? 'not-allowed' : 'pointer'
          }}
          disabled={editMode}
        >
          Reset Entire Game
        </button>
      </div>
    </>
  );
};

export default ControlsSection;
