import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Video, SquareSquare, MousePointer2, ArrowUpRight, Pencil, Eraser, MoveUpRight, Circle, Highlighter, Save, Trash2, Layout, Library, Settings as SettingsIcon, ShieldAlert, LogOut, User, LayoutDashboard, ChevronRight, Sun, Moon } from 'lucide-react';
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
    resetPitch
  } = useTactics();

  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const [newTeamName, setNewTeamName] = useState('');

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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Tools</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', alignItems: 'center', background: 'var(--bg-panel-muted)', padding: '4px', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
          {[
            { tool: 'pointer', icon: <MousePointer2 size={13} />, title: 'Move & Edit' },
            { tool: 'arrow', icon: <ArrowUpRight size={13} />, title: 'Pass Arrow' },
            { tool: 'dashed_arrow', icon: <MoveUpRight size={13} />, title: 'Run Arrow' },
            { tool: 'freehand', icon: <Pencil size={13} />, title: 'Freehand' },
            { tool: 'polygon', icon: <Highlighter size={13} />, title: 'Zone' },
            { tool: 'circle', icon: <Circle size={13} />, title: 'Circle' },
          ].map(({ tool, icon, title }) => (
            <button key={tool} onClick={() => setCurrentTool(tool)} title={title}
              style={{ padding: '5px', borderRadius: '5px', border: 'none', background: currentTool === tool ? 'var(--brand-primary)' : 'transparent', color: currentTool === tool ? '#fff' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              {icon}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <ColorPicker color={inkColor} onChange={setInkColor} />
            <button onClick={() => setDrawings([])} title="Clear All" style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
              <Eraser size={11} />
            </button>
          </div>
        </div>
      </div>

      {divider}

      {/* ── ROSTER SETUP ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Roster</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          <button className={clsx('action-btn', !isDualTeamMode && 'active')} onClick={() => setIsDualTeamMode(false)} style={{ fontSize: '11px', padding: '6px', borderRadius: '7px' }}>Single</button>
          <button className={clsx('action-btn', isDualTeamMode && 'active')} onClick={() => setIsDualTeamMode(true)} style={{ fontSize: '11px', padding: '6px', borderRadius: '7px' }}>Match</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: '700' }}>Substitute Bench</span>
          <input type="checkbox" checked={uiConfig.showSubsArea} onChange={(e) => updateUiConfig('showSubsArea', e.target.checked)} style={{ width: '13px', height: '13px', cursor: 'pointer' }} />
        </div>

        <select onChange={(e) => { if (e.target.value) onPickGlobalTeam(e.target.value); e.target.value = ''; }}
          style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}>
          <option value="">↑ Fetch Home Roster...</option>
          {globalTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        {isDualTeamMode && (
          <select onChange={(e) => { if (e.target.value) onPickGlobalTeamAway(e.target.value); e.target.value = ''; }}
            style={{ width: '100%', padding: '6px', fontSize: '11px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', outline: 'none', cursor: 'pointer' }}>
            <option value="">↓ Fetch Away Roster...</option>
            {globalTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>

      {divider}

      {/* ── FORMATIONS ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700' }}>{isDualTeamMode ? 'Home' : 'Squad'}</span>
          <ColorPicker color={teamColors.home} onChange={(c) => updateTeamColor('home', c)} />
        </div>
        <select value={homeFormation} onChange={(e) => setHomeFormation(e.target.value)}
          style={{ width: '100%', padding: '6px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '11px' }}>
          {formationKeys.map(f => <option key={`h-${f}`} value={f}>{f}</option>)}
        </select>

        {isDualTeamMode && (<>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: '700' }}>Away</span>
            <ColorPicker color={teamColors.away} onChange={(c) => updateTeamColor('away', c)} />
          </div>
          <select value={awayFormation} onChange={(e) => setAwayFormation(e.target.value)}
            style={{ width: '100%', padding: '6px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', fontSize: '11px' }}>
            {formationKeys.map(f => <option key={`a-${f}`} value={f}>{f}</option>)}
          </select>
        </>)}
      </div>

      {divider}

      {/* ── RECORD / CAPTURE ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Session</span>
        <button className="action-btn" onClick={onDownloadImage} disabled={isRecording}
          style={{ background: 'var(--bg-panel-muted)', border: '1px solid var(--border-color)', fontSize: '11px', padding: '7px' }}>
          <Camera size={13} /> Screenshot
        </button>
        <div style={{ display: 'flex', gap: '4px' }}>
          <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '700', padding: '6px', background: 'var(--bg-panel-muted)', borderRadius: '7px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            <input type="checkbox" checked={useMicrophone} onChange={(e) => setUseMicrophone(e.target.checked)} disabled={isRecording} style={{ width: '11px', height: '11px' }} /> Mic
          </label>
          <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '700', padding: '6px', background: 'var(--bg-panel-muted)', borderRadius: '7px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            <input type="checkbox" checked={useCamera} onChange={(e) => setUseCamera(e.target.checked)} disabled={isRecording} style={{ width: '11px', height: '11px' }} /> Cam
          </label>
        </div>
        <button className={clsx('action-btn', isRecording ? 'btn-danger' : 'btn-primary')} onClick={onToggleRecording} style={{ fontSize: '11px', padding: '8px' }}>
          {isRecording ? <SquareSquare size={13} /> : <Video size={13} />}
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      </div>

      {divider}

      {/* ── LIBRARY ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <span style={{ fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Library</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input type="text" placeholder="Save setup..." value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)}
            style={{ flex: 1, padding: '6px 8px', fontSize: '11px', borderRadius: '7px', border: '1px solid var(--border-color)', background: 'var(--bg-panel-muted)', color: 'var(--text-main)', outline: 'none' }} />
          <button onClick={() => { if (newTeamName) { onSaveTeam(newTeamName); setNewTeamName(''); } }}
            style={{ width: '32px', background: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Save size={13} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }}>
          {savedTeams?.map(team => (
            <div key={team.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--bg-panel-muted)', borderRadius: '7px', border: '1px solid var(--border-color)' }}>
              <div onClick={() => onLoadTeam(team)} style={{ cursor: 'pointer', flex: 1 }}>
                <div style={{ fontWeight: '700', fontSize: '11px' }}>{team.name}</div>
                <div style={{ fontSize: '10px', opacity: 0.45 }}>{team.home_formation}</div>
              </div>
              <button onClick={() => onDeleteTeam(team.id)} style={{ padding: '3px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
        <button className="action-btn" onClick={resetPitch} disabled={isRecording}
          style={{ width: '100%', marginTop: '2px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', fontSize: '11px', padding: '6px' }}>
          Reset Pitch
        </button>
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
