import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Camera, Video, SquareSquare, MousePointer2, ArrowUpRight, Pencil, Eraser, MoveUpRight, Circle, Highlighter, Save, Trash2, Layout, Library, Settings as SettingsIcon, ShieldAlert, LogOut, User, LayoutDashboard, ChevronRight, ChevronDown, Sun, Moon } from 'lucide-react';
import { formationKeys } from '../utils/formations';
import clsx from 'clsx';
import ColorPicker from './ColorPicker';
import { useTactics } from '../context/TacticsContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ControlsPanel = ({
  onDownloadImage,
  onToggleRecording,
  isRecording,
  useMicrophone,
  setUseMicrophone,
  useCamera,
  setUseCamera,
  onSaveTeam,
  onLoadTeam,
  onDeleteTeam,
  onPickGlobalTeam,
  onPickGlobalTeamAway
}) => {
  const {
    isDualTeamMode, setIsDualTeamMode,
    homeFormation, setHomeFormation,
    awayFormation, setAwayFormation,
    teamColors, updateTeamColor,
    uiConfig, updateUiConfig,
    currentTool, setCurrentTool,
    inkColor, setInkColor,
    setDrawings,
    savedTeams,
    globalTeams,
    resetPitch,
    homeTeamId, setHomeTeamId,
    awayTeamId, setAwayTeamId,
    matchHalf, setMatchHalf,
    movePlayers, selectedPlayerIds, players, clearSelection
  } = useTactics();

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isOnBoard = location.pathname === '/studio' || location.pathname === '/';

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    tools: false,
    roster: false,
    formations: false,
    session: false,
    movement: false,
    library: false
  });

  const handleSelectTeam = (team) => {
    if (!isOnBoard) {
      navigate('/studio');
      // Give the navigation a moment to complete before loading the data
      setTimeout(() => onLoadTeam(team), 50);
    } else {
      onLoadTeam(team);
    }
  };

  const handleScroll = () => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 1000);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const navLinkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 8px',
    borderRadius: '6px',
    background: location.pathname === path || (path === '/studio' && location.pathname === '/') ? 'rgba(29, 158, 74, 0.12)' : 'transparent',
    color: location.pathname === path || (path === '/studio' && location.pathname === '/') ? 'var(--brand-primary)' : 'var(--text-muted)',
    textDecoration: 'none',
    fontSize: '11px',
    fontWeight: '700',
    transition: 'all 0.15s',
  });

  const divider = <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '6px 0', opacity: 0.18 }} />;

  const MovementPad = ({ onMove, title, subtitle, isActive = true }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', opacity: isActive ? 1 : 0.4, pointerEvents: isActive ? 'all' : 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: '800' }}>{title}</span>
        {subtitle && <span style={{ fontSize: '9px', fontWeight: '600', opacity: 0.5 }}>{subtitle}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', maxWidth: '120px', margin: '0 auto' }}>
        <div />
        <button className="movement-btn" onClick={() => onMove(0, -2)}><ChevronDown style={{ transform: 'rotate(180deg)' }} size={16} /></button>
        <div />
        <button className="movement-btn" onClick={() => onMove(-2, 0)}><ChevronDown style={{ transform: 'rotate(90deg)' }} size={16} /></button>
        <div style={{ background: 'var(--bg-panel)', borderRadius: '4px' }} />
        <button className="movement-btn" onClick={() => onMove(2, 0)}><ChevronDown style={{ transform: 'rotate(-90deg)' }} size={16} /></button>
        <div />
        <button className="movement-btn" onClick={() => onMove(0, 2)}><ChevronDown size={16} /></button>
        <div />
      </div>
    </div>
  );

  return (
    <aside
      className={clsx('controls-sidebar', isScrolling && 'is-scrolling')}
      onScroll={handleScroll}
      style={{ borderRight: '1px solid var(--border-color)', background: 'var(--bg-panel)', padding: '10px 12px' }}
    >
      {/* ── BRAND + NAV ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '26px', height: '26px', background: 'var(--brand-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(29,158,74,0.3)' }}>
              <ShieldAlert size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: '900', fontSize: '13px', letterSpacing: '-0.3px' }}>LINEITUP</span>
          </div>
          <button onClick={toggleTheme} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>

        {/* Nav tabs */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <Link to="/studio" style={navLinkStyle('/studio')}><Layout size={12} /> Board</Link>
          <Link to="/studio/gallery" style={navLinkStyle('/studio/gallery')}><Library size={12} /> Library</Link>
          <Link to="/studio/settings" style={navLinkStyle('/studio/settings')}><SettingsIcon size={12} /> Settings</Link>
        </div>

        {/* Admin toggle */}
        {user?.role === 'ADMIN' && (
          <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 8px', borderRadius: '6px', background: 'rgba(29,158,74,0.06)', border: '1px solid rgba(29,158,74,0.15)', color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <LayoutDashboard size={11} /> Admin Console <ChevronRight size={10} />
          </Link>
        )}
      </div>

      {divider}

      {/* ── TACTICAL TOOLS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => setExpandedSections(prev => ({ ...prev, tools: !prev.tools }))}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer', width: '100%' 
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Tactical Tools</span>
          {expandedSections.tools ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
        </button>

        {expandedSections.tools && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: 'var(--bg-panel-muted)', padding: '8px', borderRadius: '12px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease-out' }}>
            {[
              { tool: 'pointer', icon: <MousePointer2 size={18} />, title: 'Move' },
              { tool: 'arrow', icon: <ArrowUpRight size={18} />, title: 'Pass' },
              { tool: 'dashed_arrow', icon: <MoveUpRight size={18} />, title: 'Run' },
              { tool: 'freehand', icon: <Pencil size={18} />, title: 'Draw' },
              { tool: 'polygon', icon: <Highlighter size={18} />, title: 'Zone' },
              { tool: 'circle', icon: <Circle size={18} />, title: 'Circle' },
            ].map(({ tool, icon, title }) => (
              <button 
                key={tool} 
                onClick={() => setCurrentTool(tool)} 
                title={title}
                style={{ 
                  height: '42px',
                  borderRadius: '10px', 
                  border: '1px solid',
                  borderColor: currentTool === tool ? 'var(--brand-primary)' : 'var(--border-color)',
                  background: currentTool === tool ? 'var(--brand-primary)' : 'var(--bg-panel)', 
                  color: currentTool === tool ? '#fff' : 'var(--text-muted)', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s'
                }}
              >
                {icon}
                <span style={{ fontSize: '8px', fontWeight: '800', textTransform: 'uppercase' }}>{title}</span>
              </button>
            ))}
            
            <div style={{ gridColumn: '1 / -1', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)' }}>Ink:</span>
                <ColorPicker color={inkColor} onChange={setInkColor} />
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => updateUiConfig('showBall', !uiConfig.showBall)} 
                  style={{ 
                    height: '28px', padding: '0 10px', borderRadius: '8px', border: '1px solid',
                    borderColor: uiConfig.showBall ? 'var(--brand-primary)' : 'var(--border-color)',
                    background: uiConfig.showBall ? 'rgba(29,158,74,0.1)' : 'transparent',
                    color: uiConfig.showBall ? 'var(--brand-primary)' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '9px', fontWeight: '800'
                  }}
                >
                  BALL
                </button>
                <button 
                  onClick={() => updateUiConfig('is3D', !uiConfig.is3D)} 
                  title={uiConfig.is3D ? 'Switch to 2D View' : 'Switch to 3D View'}
                  style={{ 
                    height: '28px', padding: '0 10px', borderRadius: '8px', border: '1px solid',
                    borderColor: uiConfig.is3D ? '#7c3aed' : 'var(--border-color)',
                    background: uiConfig.is3D ? 'rgba(124,58,237,0.12)' : 'transparent',
                    color: uiConfig.is3D ? '#a78bfa' : 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '9px', fontWeight: '800',
                    display: 'flex', alignItems: 'center', gap: '3px'
                  }}
                >
                  {uiConfig.is3D ? '2D' : '3D'}
                </button>
                <button 
                  onClick={() => setDrawings([])} 
                  title="Clear All" 
                  style={{ 
                    height: '28px', padding: '0 10px', borderRadius: '8px', border: '1px solid #ef444422', 
                    background: '#ef444411', color: '#ef4444', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: '800' 
                  }}
                >
                  <Eraser size={12} /> CLEAR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {divider}

      {/* ── SQUAD MOVEMENT ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => setExpandedSections(prev => ({ ...prev, movement: !prev.movement }))}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer', width: '100%' 
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Squad Movement</span>
          {expandedSections.movement ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
        </button>

        {expandedSections.movement && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-panel-muted)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)', animation: 'fadeIn 0.2s ease-out' }}>
            
            <MovementPad 
              title="Home Team" 
              onMove={(dx, dy) => movePlayers(players.filter(p => p.team === 'home' && p.relativeY <= 90).map(p => p.id), dx, dy)} 
            />

            {isDualTeamMode && (
              <>
                <div style={{ height: '1px', background: 'var(--border-color)', opacity: 0.1 }} />
                <MovementPad 
                  title="Away Team" 
                  onMove={(dx, dy) => movePlayers(players.filter(p => p.team === 'away' && p.relativeY <= 90).map(p => p.id), dx, dy)} 
                />
              </>
            )}

            <div style={{ height: '1px', background: 'var(--border-color)', opacity: 0.1 }} />
            
            <MovementPad 
              title="Selection" 
              subtitle={`${selectedPlayerIds.length} selected`}
              isActive={selectedPlayerIds.length > 0}
              onMove={(dx, dy) => movePlayers(selectedPlayerIds, dx, dy)} 
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
              <button 
                className="action-btn" 
                onClick={() => clearSelection()}
                disabled={selectedPlayerIds.length === 0}
                style={{ fontSize: '9px', padding: '6px', opacity: selectedPlayerIds.length > 0 ? 1 : 0.5 }}
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {divider}

      {/* ── ROSTER SETUP ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => setExpandedSections(prev => ({ ...prev, roster: !prev.roster }))}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer', width: '100%' 
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Roster Setup</span>
          {expandedSections.roster ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
        </button>

        {expandedSections.roster && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <button className={clsx('action-btn', !isDualTeamMode && 'active')} onClick={() => setIsDualTeamMode(false)} style={{ fontSize: '11px', padding: '6px', borderRadius: '7px' }}>Single</button>
              <button className={clsx('action-btn', isDualTeamMode && 'active')} onClick={() => setIsDualTeamMode(true)} style={{ fontSize: '11px', padding: '6px', borderRadius: '7px' }}>Match</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700' }}>Substitute Bench</span>
              <input type="checkbox" checked={uiConfig.showSubsArea} onChange={(e) => updateUiConfig('showSubsArea', e.target.checked)} style={{ width: '13px', height: '13px', cursor: 'pointer' }} />
            </div>

            <select 
              value={homeTeamId || ''} 
              onChange={(e) => { 
                if (e.target.value) {
                  onPickGlobalTeam(e.target.value); 
                  setHomeTeamId(e.target.value);
                }
              }}
              style={{ width: '100%', padding: '8px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}>
              <option value="">{homeTeamId ? globalTeams.find(t => t.id === homeTeamId)?.name : '↑ Fetch Home Roster...'}</option>
              {globalTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
      
            {isDualTeamMode && (
              <select 
                value={awayTeamId || ''} 
                onChange={(e) => { 
                  if (e.target.value) {
                    onPickGlobalTeamAway(e.target.value); 
                    setAwayTeamId(e.target.value);
                  }
                }}
                style={{ width: '100%', padding: '8px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}>
                <option value="">{awayTeamId ? globalTeams.find(t => t.id === awayTeamId)?.name : '↓ Fetch Away Roster...'}</option>
                {globalTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            )}
          </div>
        )}
      </div>

      {divider}

      {/* ── FORMATIONS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => setExpandedSections(prev => ({ ...prev, formations: !prev.formations }))}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer', width: '100%' 
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Formations</span>
          {expandedSections.formations ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
        </button>

        {expandedSections.formations && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '700' }}>{isDualTeamMode ? 'Home' : 'Squad'}</span>
              <ColorPicker color={teamColors.home} onChange={(c) => updateTeamColor('home', c)} />
            </div>
            <select value={homeFormation} onChange={(e) => setHomeFormation(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '11px' }}>
              {formationKeys.map(f => <option key={`h-${f}`} value={f}>{f}</option>)}
            </select>

            {isDualTeamMode && (<>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700' }}>Away</span>
                <ColorPicker color={teamColors.away} onChange={(c) => updateTeamColor('away', c)} />
              </div>
              <select value={awayFormation} onChange={(e) => setAwayFormation(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '11px' }}>
                {formationKeys.map(f => <option key={`a-${f}`} value={f}>{f}</option>)}
              </select>
            </>)}
          </div>
        )}
      </div>

      {divider}

      {/* ── RECORD / CAPTURE ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => setExpandedSections(prev => ({ ...prev, session: !prev.session }))}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer', width: '100%' 
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Session</span>
          {expandedSections.session ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
        </button>

        {expandedSections.session && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s ease-out' }}>
            <button className="action-btn" onClick={onDownloadImage} disabled={isRecording}
              style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', fontSize: '11px', padding: '8px' }}>
              <Camera size={14} /> Screenshot
            </button>
            <div style={{ display: 'flex', gap: '4px' }}>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '700', padding: '6px', background: 'var(--bg-panel-muted)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                <input type="checkbox" checked={useMicrophone} onChange={(e) => setUseMicrophone(e.target.checked)} disabled={isRecording} style={{ width: '11px', height: '11px' }} /> Mic
              </label>
              <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '700', padding: '6px', background: 'var(--bg-panel-muted)', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                <input type="checkbox" checked={useCamera} onChange={(e) => setUseCamera(e.target.checked)} disabled={isRecording} style={{ width: '11px', height: '11px' }} /> Cam
              </label>
            </div>
            <button className={clsx('action-btn', isRecording ? 'btn-danger' : 'btn-primary')} onClick={onToggleRecording} style={{ fontSize: '11px', padding: '10px' }}>
              {isRecording ? <SquareSquare size={14} /> : <Video size={14} />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>

            {/* Match Half Toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-panel-muted)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-color)', marginTop: '4px' }}>
              {[1, 2].map(h => (
                <button 
                  key={h}
                  onClick={() => setMatchHalf(h)}
                  style={{ 
                    flex: 1, padding: '6px 0', border: 'none', borderRadius: '7px', cursor: 'pointer',
                    fontSize: '9px', fontWeight: '800', transition: 'all 0.15s',
                    background: matchHalf === h ? 'var(--brand-primary)' : 'transparent',
                    color: matchHalf === h ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  {h === 1 ? '1ST HALF' : '2ND HALF'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {divider}

      {/* ── SQUAD MOVEMENT ── */}

      {divider}

      {/* ── LIBRARY ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          onClick={() => setExpandedSections(prev => ({ ...prev, library: !prev.library }))}
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: 'transparent', border: 'none', padding: '4px 0', cursor: 'pointer', width: '100%' 
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Board Library</span>
          {expandedSections.library ? <ChevronDown size={14} color="var(--text-muted)" /> : <ChevronRight size={14} color="var(--text-muted)" />}
        </button>

        {expandedSections.library && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="text" placeholder="Board name..." value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)}
                style={{ flex: 1, padding: '8px 10px', fontSize: '11px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', outline: 'none' }} />
              <button onClick={() => { if (newTeamName) { onSaveTeam(newTeamName); setNewTeamName(''); } }}
                style={{ width: '36px', background: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Save size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '180px', overflowY: 'auto' }}>
              {savedTeams?.map(team => (
                <div key={team.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--bg-panel-muted)', borderRadius: '9px', border: '1px solid var(--border-color)', transition: 'all 0.15s' }}>
                  <div onClick={() => handleSelectTeam(team)} style={{ cursor: 'pointer', flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '11px' }}>{team.name}</div>
                    <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: '700' }}>{team.home_formation}</div>
                  </div>
                  <button onClick={() => onDeleteTeam(team.id)} style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button className="action-btn" onClick={resetPitch} disabled={isRecording}
              style={{ width: '100%', marginTop: '4px', background: '#ef444411', border: '1px solid #ef444422', color: '#ef4444', fontSize: '10px', fontWeight: '800', padding: '8px' }}>
              RESET PITCH
            </button>
          </div>
        )}
      </div>

      {divider}

      {/* ── PROFILE / LOGOUT ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', overflow: 'hidden' }}>
            {user?.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={14} />}
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', lineHeight: 1.2 }}>{user?.username}</div>
            <div style={{ fontSize: '9px', opacity: 0.45, fontWeight: '700', textTransform: 'uppercase', color: 'var(--brand-primary)' }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} title="Logout"
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <LogOut size={14} />
        </button>
      </div>

    </aside>
  );
};

export default ControlsPanel;
