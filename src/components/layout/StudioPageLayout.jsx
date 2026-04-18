import React from 'react';
import Navbar from './Navbar';

/**
 * Wraps studio sub-pages (Settings, Gallery) with the top Navbar.
 * The tactics board (/studio) does NOT use this — it has its own sidebar nav.
 */
const StudioPageLayout = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)', overflow: 'hidden' }}>
    <Navbar />
    <div style={{ flex: 1, overflowY: 'auto' }}>
      {children}
    </div>
  </div>
);

export default StudioPageLayout;
