import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeToggler from '../ThemeToggler';
import { ShieldAlert, LayoutDashboard, LogOut, User, Layout, Library, Settings as SettingsIcon, ChevronRight } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith('/admin');
  const isStudioPath = location.pathname.startsWith('/studio') || location.pathname === '/';

  if (!user) return null;

  const NavLink = ({ to, icon: Icon, label, active }) => (
    <Link to={to} style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      padding: '8px 12px', 
      borderRadius: '8px', 
      background: active ? 'rgba(29, 158, 74, 0.1)' : 'transparent', 
      color: active ? 'var(--brand-primary)' : 'var(--text-muted)', 
      textDecoration: 'none',
      fontSize: '13px',
      fontWeight: '700',
      transition: 'all 0.2s'
    }}>
      <Icon size={16} />
      {label}
    </Link>
  );

  return (
    <nav className="navbar-container" style={{ 
      height: '64px',
      background: 'var(--bg-panel)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'var(--text-main)' }}>
          <div style={{ width: '32px', height: '32px', background: 'var(--brand-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(29, 158, 74, 0.3)' }}>
            <ShieldAlert size={18} color="#fff" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontWeight: '800', letterSpacing: '-0.5px', fontSize: '18px', lineHeight: 1 }}>LINEITUP</span>
            {isAdminPath && <span style={{ fontSize: '9px', fontWeight: '800', opacity: 0.7, letterSpacing: '0.5px', marginTop: '3px', color: 'var(--brand-primary)' }}>ADMIN CONSOLE</span>}
          </div>
        </Link>

        <div className="mobile-hide" style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

        {/* STUDIO NAV */}
        <div className="nav-links-desktop">
          <NavLink to="/" icon={Layout} label="Tactics Board" active={location.pathname === '/' || location.pathname === '/studio'} />
          <NavLink to="/studio/gallery" icon={Library} label="Library" active={location.pathname === '/studio/gallery'} />
          <NavLink to="/studio/settings" icon={SettingsIcon} label="Settings" active={location.pathname === '/studio/settings'} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        {user.role === 'ADMIN' && (
          <Link 
            to={isAdminPath ? "/" : "/admin"} 
            className={clsx(isAdminPath && "mobile-hide")}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              borderRadius: '10px', 
              background: isAdminPath ? 'var(--bg-panel-muted)' : 'var(--brand-primary)', 
              color: isAdminPath ? 'var(--text-main)' : '#fff', 
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              transition: 'all 0.2s',
              boxShadow: isAdminPath ? 'none' : '0 4px 12px rgba(21, 128, 61, 0.2)'
            }}
          >
            {isAdminPath ? (
              <><span className="mobile-hide">Return to Studio</span> <ChevronRight size={14} /></>
            ) : (
              <><LayoutDashboard size={14} /> <span className="mobile-hide">Admin Panel</span></>
            )}
          </Link>
        )}

        <ThemeToggler />
        
        <div className="mobile-hide" style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="nav-user-info" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: '800' }}>{user.username}</div>
            <div style={{ fontSize: '10px', fontWeight: '700', opacity: 0.5, textTransform: 'uppercase', color: 'var(--brand-primary)' }}>{user.role}</div>
          </div>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            background: 'var(--bg-panel-muted)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid var(--border-color)',
            color: 'var(--brand-primary)',
            overflow: 'hidden'
          }}>
            {user.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={20} />}
          </div>
          <button 
            onClick={logout}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
