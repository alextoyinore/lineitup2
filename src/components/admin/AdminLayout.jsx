import React from 'react';
import { NavLink, Outlet, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Trophy, Users, User, ArrowLeft, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import clsx from 'clsx';
import Navbar from '../layout/Navbar';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 1024);

  React.useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* MOBILE SIDEBAR TOGGLE */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ 
            position: 'fixed', 
            bottom: '24px', 
            left: '24px', 
            width: '48px', 
            height: '48px', 
            borderRadius: '24px', 
            background: 'var(--brand-primary)', 
            color: '#fff', 
            border: 'none', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 1100,
            display: isMobile ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="mobile-show"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* SIDEBAR */}
        {isMobileMenuOpen && isMobile && (
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1050 }} 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        <aside className={clsx("admin-sidebar", isMobileMenuOpen && "open")} style={{ width: '280px', background: 'var(--bg-panel)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '32px' }}>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
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
        <main className="admin-main" style={{ flex: 1, padding: '24px 32px', background: 'var(--bg-main)', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
