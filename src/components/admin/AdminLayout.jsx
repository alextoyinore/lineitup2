import React from 'react';
import { NavLink, Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Trophy, Users, User, ArrowLeft, LayoutDashboard, LogOut } from 'lucide-react';
import Navbar from '../layout/Navbar';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" />;
  }

  const navItems = [
    { path: '/admin/leagues', icon: Trophy, label: 'Leagues' },
    { path: '/admin/teams', icon: Users, label: 'Teams' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* SIDEBAR */}
        <aside style={{ width: '280px', background: 'var(--bg-panel)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '32px' }}>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                      background: isActive ? 'rgba(29, 158, 74, 0.08)' : 'transparent',
                      transition: 'all 0.2s'
                    })}
                  >
                    <Icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div style={{ marginTop: 'auto', padding: '32px', borderTop: '1px solid var(--border-color)' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', marginBottom: '20px' }}>
              <ArrowLeft size={18} /> Back to Studio
            </Link>
            <div 
              onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#ff4d4d', cursor: 'pointer', fontSize: '14px' }}
            >
              <LogOut size={18} /> Logout
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: '24px 32px', background: 'var(--bg-main)', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
