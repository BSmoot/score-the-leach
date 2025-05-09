"use client";

import React from 'react';
import { Team } from '../types';

interface TeamsSectionProps {
  teams: Team[];
  updateTeamScore: (teamId: number, newScore: number) => void;
  updateTeamName: (id: number, newName: string) => void;
  showTeamSetup: boolean;
  updateTeamLogo: (id: number, file: File) => void;
  colors: {
    yellow: string;
    black: string;
    bgLight: string;
  };
  editMode: boolean;
}

// TeamLogoImage component
const TeamLogoImage = ({ logo, name }: { logo: string; name: string }) => {
  // For default icons (starting with '/') use img tag
  if (logo.startsWith('/')) {
    return (
      <div className="relative w-full h-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={`${name} logo`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  
  // For uploaded images (data URLs) use img tag
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img 
      src={logo} 
      alt={`${name} logo`} 
      className="w-full h-full object-cover" 
    />
  );
};

const TeamsSection: React.FC<TeamsSectionProps> = ({
  teams,
  updateTeamScore,
  updateTeamName,
  showTeamSetup,
  updateTeamLogo,
  colors,
  editMode
}) => {
  return (
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
              <div className="flex flex-col" style={{ width: '200px' }}>
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => updateTeamName(team.id, e.target.value)}
                  className="bg-transparent border-b border-yellow-400 outline-none"
                  style={{
                    width: '100%',
                    color: colors.yellow
                  }}
                  disabled={!showTeamSetup}
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
              {editMode ? (
                <div className="flex items-center">
                  <input
                    type="number"
                    value={team.score}
                    onChange={(e) => {
                      const newScore = parseInt(e.target.value) || 0;
                      updateTeamScore(team.id, newScore);
                    }}
                    className="w-16 h-12 text-3xl font-bold text-center bg-transparent border-2 outline-none"
                    style={{ 
                      color: 'white',
                      borderColor: colors.yellow,
                      borderRadius: '4px',
                      zIndex: 60 // Ensure input is above any overlays
                    }}
                    min="0"
                    max="999"
                  />
                </div>
              ) : (
                <div 
                  className="text-4xl font-bold flex items-center justify-center"
                  style={{ 
                    color: 'white',
                    backgroundColor: colors.black,
                    border: `2px solid ${colors.yellow}`,
                    width: '64px',
                    height: '64px',
                    borderRadius: '4px',
                    flexShrink: 0,
                  }}
                >
                  {team.score}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsSection;
