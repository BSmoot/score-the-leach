"use client";

import React from 'react';
import { Team, HistoryState } from '../types';

interface TeamSetupModalProps {
  showTeamSetup: boolean;
  setShowTeamSetup: (show: boolean) => void;
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  setPeriod: (period: number) => void;
  resetTimer: () => void;
  setScoreHistory: (history: HistoryState[]) => void;
  defaultTeams: Team[];
  isMobile: boolean;
  colors: {
    yellow: string;
    black: string;
    bgLight: string;
  };
  updateTeamName: (id: number, name: string) => void;
  updateTeamLogo: (id: number, file: File) => void;
}

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

// Dynamic image handling with proper types
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

const TeamSetupModal: React.FC<TeamSetupModalProps> = ({
  showTeamSetup,
  setShowTeamSetup,
  teams,
  setTeams,
  setPeriod,
  resetTimer,
  setScoreHistory,
  defaultTeams,
  isMobile,
  colors,
  updateTeamName,
  updateTeamLogo
}) => {
  if (!showTeamSetup) {
    return null;
  }

  return (
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
  );
};

export default TeamSetupModal;
