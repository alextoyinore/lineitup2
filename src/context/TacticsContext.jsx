import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { formationKeys, generatePlayers } from '../utils/formations';
import { fetchTeams, fetchRecordings, fetchGlobalTeams } from '../services/apiService';

const TacticsContext = createContext();

export const TacticsProvider = ({ children }) => {
  // --- Pitch Configuration ---
  const [uiConfig, setUiConfig] = useState({
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
    positionIdOpacity: 0.8,
    textHasShadow: true,
    showSubsArea: false,
    zoneHasFill: true
  });

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
  const [currentTeamId, setCurrentTeamId] = useState(null);

  // --- Tools State ---
  const [currentTool, setCurrentTool] = useState('pointer');
  const [inkColor, setInkColor] = useState('#FFFF00');

  // --- Methods ---
  const resetPitch = useCallback(() => {
    let pHome = generatePlayers(homeFormation, true, uiConfig.showSubsArea);
    let pAway = isDualTeamMode ? generatePlayers(awayFormation, false, uiConfig.showSubsArea) : [];
    setPlayers([...pHome, ...pAway]);
    setDrawings([]);
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

  // React to substitute bench toggle — add/remove bench subs without wiping positions
  useEffect(() => {
    setPlayers(prev => {
      const onPitch = prev.filter(p => p.relativeY <= 90);
      if (uiConfig.showSubsArea) {
        const homeSubs = generatePlayers(homeFormation, true, true).filter(p => p.relativeY > 90);
        const awaySubs = isDualTeamMode
          ? generatePlayers(awayFormation, false, true).filter(p => p.relativeY > 90)
          : [];
        return [...onPitch, ...homeSubs, ...awaySubs];
      } else {
        return onPitch;
      }
    });
  }, [uiConfig.showSubsArea]); // eslint-disable-line

  const updatePlayer = useCallback((id, updates) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
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
    currentTeamId, setCurrentTeamId,
    currentTool, setCurrentTool,
    inkColor, setInkColor,
    resetPitch,
    reloadData
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
