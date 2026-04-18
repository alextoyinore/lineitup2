import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, User, Lock, ArrowRight } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container" style={{ 
      display: 'flex', 
      height: '100vh', 
      background: '#f1f5f9', // Sleek Light backdrop
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'var(--font-body)'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '400px', 
        padding: '24px' 
      }}>
        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '56px', 
            height: '56px', 
            background: 'var(--brand-primary)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 10px 15px -3px rgba(29, 158, 74, 0.4)'
          }}>
            <ShieldAlert size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
            LineItUp <span style={{ color: 'var(--brand-primary)' }}>Tactics</span>
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>Studio-grade tactical builder</p>
        </div>

        {/* Auth Card */}
        <div style={{ 
          background: '#ffffff', 
          padding: '32px', 
          borderRadius: '24px', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
          border: '1px solid #f1f5f9'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' }}>
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', fontSize: '14px', color: '#1e293b' }}
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', fontSize: '14px', color: '#1e293b' }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && <div style={{ padding: '10px', background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '12px', fontWeight: '500', border: '1px solid #fee2e2' }}>{error}</div>}

            <button 
              type="submit" 
              style={{ width: '100%', padding: '14px', background: 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 6px -1px rgba(29, 158, 74, 0.2)' }}
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"} {' '}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', fontWeight: '600', cursor: 'pointer' }}
            >
              {isLogin ? 'Get started' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
