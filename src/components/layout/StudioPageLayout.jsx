import React, { useState } from 'react';
import Navbar from './Navbar';
import ControlsPanel from '../ControlsPanel';
import clsx from 'clsx';
import { useTactics } from '../../context/TacticsContext';

/**
 * Wraps studio sub-pages (Settings, Gallery) with the top Navbar and Tactical Sidebar.
 */
const StudioPageLayout = ({ children }) => {
  const { loadTeam, deleteSavedTeam } = useTactics();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Empty handlers for board-specific actions that aren't available on sub-pages
  const noop = () => {};

  return (
    <div className="main-content" style={{ height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', overflow: 'hidden' }}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar Wrapper */}
      <div className={clsx('sidebar-wrapper', isSidebarOpen && 'open')}>
        <ControlsPanel 
          onDownloadImage={noop}
          onToggleRecording={noop}
          isRecording={false}
          useMicrophone={false}
          setUseMicrophone={noop}
          useCamera={false}
          setUseCamera={noop}
          onSaveTeam={noop}
          onLoadTeam={(team) => { loadTeam(team); setIsSidebarOpen(false); }}
          onDeleteTeam={deleteSavedTeam}
          onPickGlobalTeam={noop}
          onPickGlobalTeamAway={noop}
        />
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default StudioPageLayout;
