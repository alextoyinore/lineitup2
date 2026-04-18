import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ShieldAlert, Menu, X, Save, Trash2, FolderOpen, Video } from 'lucide-react';
import clsx from 'clsx';
import '../App.css';

import Pitch from './Pitch';
import ControlsPanel from './ControlsPanel';
import AuthPage from './AuthPage';
import { generatePlayers, formationKeys } from '../utils/formations';
import { fetchTeams, saveTeam, deleteTeam, uploadRecording, fetchRecordings, fetchGlobalTeams, fetchGlobalPlayers } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

import { useTactics } from '../context/TacticsContext';

function TacticsBoard() {
  const { user, loading: authLoading, logout } = useAuth();
  const {
    uiConfig, setUiConfig,
    homeFormation, setHomeFormation,
    awayFormation, setAwayFormation,
    isDualTeamMode, setIsDualTeamMode,
    teamColors, setTeamColors,
    players, setPlayers, updatePlayer,
    drawings, setDrawings,
    recordings, globalTeams,
    currentTool, setCurrentTool,
    inkColor, setInkColor,
    resetPitch, reloadData,
    currentTeamId, setCurrentTeamId
  } = useTactics();

  const pitchRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [useMicrophone, setUseMicrophone] = useState(false);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const mediaStreamRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      reloadData();
    }
  }, [user]);

  const handlePickGlobalTeam = async (teamId, forTeam = 'home') => {
    try {
      const globalPlayers = await fetchGlobalPlayers(teamId);
      
      let availablePlayers = [...globalPlayers];
      availablePlayers.sort((a, b) => (b.is_starting ? 1 : 0) - (a.is_starting ? 1 : 0));

      setPlayers(prev => {
        const targetPitchPlayers = prev.filter(p => p.team === forTeam && p.relativeY <= 90);
        const otherPlayers = prev.filter(p => p.team !== forTeam);

        const updatedPitch = targetPitchPlayers.map((p, i) => {
          let matchIndex = availablePlayers.findIndex(gp => gp.is_starting && (gp.position === p.positionStr || gp.position === p.name));
          if (matchIndex === -1) matchIndex = availablePlayers.findIndex(gp => gp.is_starting);
          if (matchIndex === -1) matchIndex = availablePlayers.findIndex(gp => gp.position === p.positionStr || gp.position === p.name);
          if (matchIndex === -1 && availablePlayers.length > 0) matchIndex = 0;

          if (matchIndex !== -1) {
            const match = availablePlayers.splice(matchIndex, 1)[0];
            return { ...p, name: match.name, number: match.number };
          }
          return p;
        });

        const updatedBench = availablePlayers.map((res, i) => {
          return {
            id: `${forTeam}-sub-${i}-${Date.now()}`,
            team: forTeam,
            name: res.name,
            number: res.number,
            positionStr: res.position,
            relativeX: 10 + (i % 8) * 10,
            relativeY: 94 + (forTeam === 'away' ? 5 : 0)
          };
        });

        return [...otherPlayers, ...updatedPitch, ...updatedBench];
      });

      if (!uiConfig.showSubsArea && availablePlayers.length > 0) {
        setUiConfig(prev => ({ ...prev, showSubsArea: true }));
      }
    } catch (err) {
      alert('Error loading official roster');
    }
  };

  const handleSaveTeam = async (name) => {
    const teamData = {
      id: currentTeamId,
      name,
      home_formation: homeFormation,
      away_formation: awayFormation,
      is_dual_team: isDualTeamMode,
      team_colors: teamColors,
      ui_config: uiConfig,
      players,
      drawings
    };

    try {
      const result = await saveTeam(teamData);
      setCurrentTeamId(result.id);
      reloadData();
      alert(`Team "${name}" saved successfully!`);
    } catch (err) {
      alert('Error saving team: ' + err.message);
    }
  };

  const handleLoadTeam = (team) => {
    setCurrentTeamId(team.id);
    setHomeFormation(team.home_formation);
    setAwayFormation(team.away_formation);
    setIsDualTeamMode(team.is_dual_team);
    setTeamColors(team.team_colors);
    setUiConfig(team.ui_config);
    setPlayers(team.players);
    setDrawings(team.drawings);
    setIsSidebarOpen(false);
  };

  const handleDeleteTeam = async (id) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    try {
      await deleteTeam(id);
      if (currentTeamId === id) setCurrentTeamId(null);
      reloadData();
    } catch (err) {
      alert('Error deleting team: ' + err.message);
    }
  };

  const handleDownloadImage = () => {
    if (!pitchRef.current) return;
    try {
      const stage = pitchRef.current.getStage();
      const dataURL = stage.toDataURL({ pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = 'tactical_analysis.png';
      a.click();
    } catch (e) {
      console.error('Export failed', e);
      alert('Could not export image.');
    }
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      
      // Cleanup streams
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      setCameraStream(null);
      setIsRecording(false);
    } else {
      if (!pitchRef.current) return;
      const canvas = pitchRef.current.getCanvas();
      if (!canvas) return;

      try {
        let userStream = null;
        if (useCamera || useMicrophone) {
          userStream = await navigator.mediaDevices.getUserMedia({
            video: useCamera,
            audio: useMicrophone
          });
          mediaStreamRef.current = userStream;
          if (useCamera) setCameraStream(userStream);
        }

        const canvasStream = canvas.captureStream(30);
        
        // Mix audio if microphone is used
        if (useMicrophone && userStream) {
          const audioTrack = userStream.getAudioTracks()[0];
          if (audioTrack) {
            canvasStream.addTrack(audioTrack);
          }
        }

        const mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType: 'video/webm; codecs=vp9'
        });

        mediaRecorder.ondataavailable = function(e) {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          recordedChunksRef.current = [];
          const url = URL.createObjectURL(blob);
          
          const title = prompt('Name your tactical recording:', `Tactics Session - ${new Date().toLocaleTimeString()}`);
          if (title !== null) {
            try {
              await uploadRecording(blob, title, 0);
              loadRecordings();
              alert('Video saved to your library!');
            } catch (err) {
              console.error('Upload failed:', err);
              alert('Cloud save failed, but you can still download the file.');
            }
          }

          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = `${title || 'tactics-session'}.webm`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          
          // Stop all tracks
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
            setCameraStream(null);
          }
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (e) {
        console.error('Recording initialization failed', e);
        alert('Could not start recording. Please check permissions for camera/microphone.');
        
        // Cleanup if something failed mid-initialization
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
          mediaStreamRef.current = null;
        }
        setCameraStream(null);
      }
    }
  };

  if (authLoading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff', fontSize: '18px' }}>Loading...</div>;
  if (!user) return <AuthPage />;

  return (
    <div className="app-container">
      <main className="main-content" style={{ height: '100vh' }}>
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
        )}
        <div className={clsx('sidebar-wrapper', isSidebarOpen && 'open')}>
          <ControlsPanel 
            onDownloadImage={handleDownloadImage}
            onToggleRecording={handleToggleRecording}
            isRecording={isRecording}
            useMicrophone={useMicrophone}
            setUseMicrophone={setUseMicrophone}
            useCamera={useCamera}
            setUseCamera={setUseCamera}
            onSaveTeam={handleSaveTeam}
            onLoadTeam={handleLoadTeam}
            onDeleteTeam={handleDeleteTeam}
            onPickGlobalTeam={(id) => handlePickGlobalTeam(id, 'home')}
            onPickGlobalTeamAway={(id) => handlePickGlobalTeam(id, 'away')}
          />
        </div>
        
        <div className="pitch-container-wrapper" style={{ background: '#eef2f5' }}>
          <Pitch 
            ref={pitchRef} 
            players={players} 
            updatePlayer={updatePlayer}
            isRecording={isRecording}
            teamColors={teamColors}
            ui={uiConfig}
            currentTool={currentTool}
            inkColor={inkColor}
            drawings={drawings}
            setDrawings={setDrawings}
            cameraStream={cameraStream}
          />
        </div>
      </main>
    </div>
  );
}

export default TacticsBoard;
