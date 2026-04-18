import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import TacticsBoard from './components/TacticsBoard';
import AdminLayout from './components/admin/AdminLayout';
import LeaguesView from './components/admin/LeaguesView';
import TeamsView from './components/admin/TeamsView';
import TeamDetail from './components/admin/TeamDetail';
import PlayerDetail from './components/admin/PlayerDetail';
import AuthPage from './components/AuthPage';
import { useAuth } from './context/AuthContext';
import { TacticsProvider } from './context/TacticsContext';
import SettingsView from './components/studio/SettingsView';
import GalleryView from './components/studio/GalleryView';
import StudioPageLayout from './components/layout/StudioPageLayout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
        Loading...
      </div>
    );
  }

  return (
    <TacticsProvider>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              user 
                ? (user.role === 'ADMIN' ? <Navigate to="/admin" /> : <Navigate to="/studio" />) 
                : <AuthPage />
            } 
          />
          
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="leagues" />} />
            <Route path="leagues" element={<LeaguesView />} />
            <Route path="teams" element={<TeamsView />} />
            <Route path="teams/:id" element={<TeamDetail />} />
            <Route path="players/:id" element={<PlayerDetail />} />
          </Route>

          <Route 
            path="/studio" 
            element={user ? <TacticsBoard /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/studio/settings" 
            element={user ? <StudioPageLayout><SettingsView /></StudioPageLayout> : <Navigate to="/login" />} 
          />
          <Route 
            path="/studio/gallery" 
            element={user ? <StudioPageLayout><GalleryView /></StudioPageLayout> : <Navigate to="/login" />} 
          />
          
          <Route path="/" element={<Navigate to="/studio" />} />
          <Route path="*" element={<Navigate to="/studio" />} />
        </Routes>
      </Router>
    </TacticsProvider>
  );
}

export default App;
