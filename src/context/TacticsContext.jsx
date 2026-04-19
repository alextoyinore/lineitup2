import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { formationKeys, generatePlayers } from '../utils/formations';
import { fetchTeams, fetchRecordings, fetchGlobalTeams, deleteTeam } from '../services/apiService';

const TacticsContext = createContext();

export const TacticsProvider = ({ children }) => {
  // --- Pitch Configuration ---
  const [uiConfig, setUiConfig] = useState(() => {
    const saved = localStorage.getItem('lineitup_ui_config');
    const defaults = {
      pitchColor1: '#28803d',
      pitchColor2: '#2c8a42',
      pitchLineColor: '#FFFFFF',
      lineThickness: 2,
      jerseyScaleMult: 1,
      jerseyHasBorder: true,
      jerseyNumberColor: '#FFFFFF',
      jerseyNumberOpacity: 1,
      jerseyNumberFontSize: 14,
      playerNameFontSize: 7,
      showOvrBadge: true,
      ovrBadgeOpacity: 1,
      showPositionBadge: true,
      positionBadgeOpacity: 0.8,
      textHasShadow: true,
      showSubsArea: false,
      zoneHasFill: true
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
  });

  useEffect(() => {
    localStorage.setItem('lineitup_ui_config', JSON.stringify(uiConfig));
  }, [uiConfig]);

  // --- Team State ---
  const [homeFormation, setHomeFormation] = useState(formationKeys[0]);
  const [awayFormation, setAwayFormation] = useState(formationKeys[1]);
  const [isDualTeamMode, setIsDualTeamMode] = useState(false);
  const [teamColors, setTeamColors] = useState({
    home: '#E63946', 
    away: '#1D3557'  
  });

  // --- Tactical Data ---
  const [players, setPlayers] = useState(() => generatePlayers(formationKeys[0], true, false));
  const [drawings, setDrawings] = useState([]);
  const [savedTeams, setSavedTeams] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [globalTeams, setGlobalTeams] = useState([]);
  const [homeTeamId, setHomeTeamId] = useState(null);
  const [awayTeamId, setAwayTeamId] = useState(null);
  const [currentTeamId, setCurrentTeamId] = useState(null);

  // --- Selection State ---
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);

  // --- Tools State ---
  const [currentTool, setCurrentTool] = useState('pointer');
  const [inkColor, setInkColor] = useState('#FFFF00');

  // --- Methods ---
  const resetPitch = useCallback(() => {
    let pHome = generatePlayers(homeFormation, true, uiConfig.showSubsArea);
    let pAway = isDualTeamMode ? generatePlayers(awayFormation, false, uiConfig.showSubsArea) : [];
    setPlayers([...pHome, ...pAway]);
    setDrawings([]);
    setHomeTeamId(null);
    setAwayTeamId(null);
  }, [homeFormation, awayFormation, isDualTeamMode, uiConfig.showSubsArea]);

  // React to dual team mode toggle
  useEffect(() => {
    setPlayers(prev => {
      // Keep all home players as-is
      const homePlayers = prev.filter(p => p.team === 'home');
      if (isDualTeamMode) {
        // Add away players at their default formation positions
        const awayPlayers = generatePlayers(awayFormation, false, uiConfig.showSubsArea);
        return [...homePlayers, ...awayPlayers];
      } else {
        // Strip away players
        return homePlayers;
      }
    });
  }, [isDualTeamMode]); // eslint-disable-line

  // React to substitute bench toggle — just filter existing bench players out if hidden
  // We no longer re-generate them here because it overwrites custom rosters.
  useEffect(() => {
    if (!uiConfig.showSubsArea) {
      setPlayers(prev => prev.filter(p => p.relativeY <= 90));
    } else {
      // If we are showing them, but they are missing, we can add generic ones as a fallback
      setPlayers(prev => {
        const hasHomeSubs = prev.some(p => p.team === 'home' && p.relativeY > 90);
        if (!hasHomeSubs) {
          const homeSubs = generatePlayers(homeFormation, true, true).filter(p => p.relativeY > 90);
          const awaySubs = isDualTeamMode 
            ? generatePlayers(awayFormation, false, true).filter(p => p.relativeY > 90)
            : [];
          return [...prev, ...homeSubs, ...awaySubs];
        }
        return prev;
      });
    }
  }, [uiConfig.showSubsArea]); // eslint-disable-line
  
  // React to home formation change
  useEffect(() => {
    setPlayers(prev => {
      const homePitchPlayers = prev.filter(p => p.team === 'home' && p.relativeY <= 90);
      const otherPlayers = prev.filter(p => !(p.team === 'home' && p.relativeY <= 90));
      const newFormationPos = generatePlayers(homeFormation, true, false);
      
      const updatedHome = homePitchPlayers.map((p, i) => {
        if (newFormationPos[i]) {
          return { ...p, relativeX: newFormationPos[i].relativeX, relativeY: newFormationPos[i].relativeY };
        }
        return p;
      });
      return [...otherPlayers, ...updatedHome];
    });
  }, [homeFormation]); // eslint-disable-line

  // React to away formation change
  useEffect(() => {
    if (!isDualTeamMode) return;
    setPlayers(prev => {
      const awayPitchPlayers = prev.filter(p => p.team === 'away' && p.relativeY <= 90);
      const otherPlayers = prev.filter(p => !(p.team === 'away' && p.relativeY <= 90));
      const newFormationPos = generatePlayers(awayFormation, false, false);
      
      const updatedAway = awayPitchPlayers.map((p, i) => {
        if (newFormationPos[i]) {
          return { ...p, relativeX: newFormationPos[i].relativeX, relativeY: newFormationPos[i].relativeY };
        }
        return p;
      });
      return [...otherPlayers, ...updatedAway];
    });
  }, [awayFormation, isDualTeamMode]); // eslint-disable-line

  const updatePlayer = useCallback((id, updates) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const movePlayers = useCallback((ids, dx, dy) => {
    setPlayers(prev => prev.map(p => {
      if (ids.includes(p.id)) {
        return {
          ...p,
          relativeX: Math.max(0, Math.min(100, p.relativeX + dx)),
          relativeY: Math.max(0, Math.min(100, p.relativeY + dy))
        };
      }
      return p;
    }));
  }, []);

  const togglePlayerSelection = useCallback((id, multiSelect = false) => {
    setSelectedPlayerIds(prev => {
      if (multiSelect) {
        if (prev.includes(id)) {
          return prev.filter(pId => pId !== id);
        } else {
          return [...prev, id];
        }
      } else {
        return prev.includes(id) && prev.length === 1 ? [] : [id];
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedPlayerIds([]);
  }, []);

  const updateUiConfig = (key, value) => {
    setUiConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateTeamColor = (teamKey, newColor) => {
    setTeamColors(prev => ({ ...prev, [teamKey]: newColor }));
  };

  // --- Persistent Loads ---
  const reloadData = async () => {
    try {
      const [teams, recs, globals] = await Promise.all([
        fetchTeams(),
        fetchRecordings(),
        fetchGlobalTeams()
      ]);
      setSavedTeams(teams);
      setRecordings(recs);
      setGlobalTeams(globals);
    } catch (err) {
      console.error('Failed to reload tactics data:', err);
    }
  };

  const loadTeam = useCallback((team) => {
    setCurrentTeamId(team.id);
    setHomeFormation(team.home_formation);
    setAwayFormation(team.away_formation);
    setIsDualTeamMode(team.is_dual_team);
    setTeamColors(team.team_colors);
    setUiConfig(team.ui_config);
    setPlayers(team.players);
    setDrawings(team.drawings);
  }, []);

  const deleteSavedTeam = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await deleteTeam(id);
      if (currentTeamId === id) setCurrentTeamId(null);
      reloadData();
    } catch (err) {
      alert('Error deleting team: ' + err.message);
    }
  }, [currentTeamId, reloadData]);

  const value = {
    uiConfig, setUiConfig, updateUiConfig,
    homeFormation, setHomeFormation,
    awayFormation, setAwayFormation,
    isDualTeamMode, setIsDualTeamMode,
    teamColors, setTeamColors, updateTeamColor,
    players, setPlayers, updatePlayer,
    drawings, setDrawings,
    savedTeams, setSavedTeams,
    recordings, setRecordings,
    globalTeams, setGlobalTeams,
    homeTeamId, setHomeTeamId,
    awayTeamId, setAwayTeamId,
    currentTool, setCurrentTool,
    inkColor, setInkColor,
    resetPitch,
    reloadData,
    loadTeam,
    deleteSavedTeam,
    currentTeamId, setCurrentTeamId,
    selectedPlayerIds, setSelectedPlayerIds,
    movePlayers, togglePlayerSelection, clearSelection
  };

  return (
    <TacticsContext.Provider value={value}>
      {children}
    </TacticsContext.Provider>
  );
};

export const useTactics = () => {
  const context = useContext(TacticsContext);
  if (!context) throw new Error('useTactics must be used within a TacticsProvider');
  return context;
};
