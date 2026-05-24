import React, { useState } from 'react';
import { login } from '../db/localDb';
import { ApplicationUser } from '../db/schema';
import { LogIn, Key, Mail, ShieldAlert, Award, Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: ApplicationUser) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Пожалуйста, заполните все поля!');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const user = login(email, password);
      setLoading(false);
      
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Неверный Email или пароль. Попробуйте еще раз или используйте пресеты ниже.');
      }
    }, 600); // realistic delay for mobile animations
  };

  const handlePresetLogin = (emailPreset: string, passwordPreset: string) => {
    setError('');
    setEmail(emailPreset);
    setPassword(passwordPreset);
    
    setLoading(true);
    setTimeout(() => {
      const user = login(emailPreset, passwordPreset);
      setLoading(false);
      if (user) {
        onLoginSuccess(user);
      }
    }, 400);
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', paddingBottom: '30px' }}>
      {/* Brand Logo and Title */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'var(--primary-gradient)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '0 auto 12px auto',
          boxShadow: '0 8px 24px var(--primary-glow)'
        }}>
          <Award size={32} color="#080a10" strokeWidth={2.5} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.5px' }}>
          EDU Portal
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
          Академическая система успеваемости
        </p>
      </div>

      {/* Main Login Card */}
      <form onSubmit={handleSubmit} className="glass-card" style={{ marginBottom: '20px', background: 'rgba(28, 33, 53, 0.85)' }}>
        <h3 className="glass-card-title">Авторизация</h3>

        {error && (
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            background: 'var(--danger-bg)',
            border: '1px solid rgba(255, 82, 82, 0.2)',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '0.8rem',
            color: 'var(--danger)',
            marginBottom: '14px'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <label className="input-label">Email</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }}>
              <Mail size={16} />
            </span>
            <input
              type="email"
              className="input-glass"
              style={{ paddingLeft: '42px' }}
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="input-label">Пароль</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }}>
              <Key size={16} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-glass"
              style={{ paddingLeft: '42px', paddingRight: '42px' }}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', height: '48px' }}
          disabled={loading}
        >
          {loading ? (
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(8, 10, 16, 0.3)',
              borderTopColor: '#080a10',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}></div>
          ) : (
            <>
              <span>Войти</span>
              <LogIn size={18} />
            </>
          )}
        </button>
      </form>

      {/* Demo presets picker */}
      <div className="glass-card" style={{ padding: '14px 16px' }}>
        <h4 style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          Быстрый Вход (Демо-аккаунты)
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            className="btn-glass"
            style={{ fontSize: '0.8rem', padding: '10px', justifyContent: 'flex-start' }}
            onClick={() => handlePresetLogin('student@example.com', 'Student123!')}
            disabled={loading}
          >
            <span className="role-badge student" style={{ marginRight: '6px' }}>Студент</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>Петр Петров</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student123!</span>
          </button>

          <button
            type="button"
            className="btn-glass"
            style={{ fontSize: '0.8rem', padding: '10px', justifyContent: 'flex-start' }}
            onClick={() => handlePresetLogin('teacher@example.com', 'Teacher123!')}
            disabled={loading}
          >
            <span className="role-badge teacher" style={{ marginRight: '6px' }}>Учитель</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>Иван Иванов</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Teacher123!</span>
          </button>

          <button
            type="button"
            className="btn-glass"
            style={{ fontSize: '0.8rem', padding: '10px', justifyContent: 'flex-start' }}
            onClick={() => handlePresetLogin('admin@example.com', 'Admin123!')}
            disabled={loading}
          >
            <span className="role-badge admin" style={{ marginRight: '6px' }}>Админ</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', flex: 1, textAlign: 'left' }}>System Admin</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin123!</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
