import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Palette, Lock, User, Check, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import '../styles/global.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [changeAfterLogin, setChangeAfterLogin] = useState(false);
  const { user, login, logout, updateUserPassword } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user && !isResetting && !showSuccess) {
      const role = (user.role || '').toLowerCase().trim();
      if (role === 'designer') navigate('/designer');
      else if (role === 'client') navigate('/client');
    }
  }, [user, isResetting, showSuccess, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');
    
    // Attempt login
    const user = await login(username, password);
    
    setLoading(false);
    if (user) {
      console.log('Login successful:', user);
      
      // Handle first login or deliberate password change requirement
      const mustReset = user.isFirstLogin === true || String(user.isFirstLogin).toUpperCase() === 'TRUE';
      
      if (mustReset || changeAfterLogin) {
          setIsResetting(true);
          return;
      }

      const role = (user.role || '').toLowerCase().trim();
      
      if (role === 'designer') {
          navigate('/designer');
      } else if (role === 'client') {
          navigate('/client');
      } else {
          setError(`Login successful, but account role is invalid: "${user.role}". Please contact admin.`);
      }
    } else {
      setError('Invalid credentials');
    }
  };

  const handlePasswordReset = async () => {
      setLoading(true);
      if (await updateUserPassword(newPassword)) {
           setShowSuccess(true);
           setIsResetting(false);
           logout(); 
      } else {
          setError('Failed to update password');
      }
      setLoading(false);
  };

  const handleReturnToLogin = () => {
      setShowSuccess(false);
      setUsername('');
      setPassword('');
      setNewPassword('');
      setChangeAfterLogin(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-gradient-brand)',
      padding: '1rem'
    }}>
      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '440px', 
        padding: '2.5rem',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div>
             <img 
              src="/logo-light.png"
              alt="ScalePods Logo" 
              style={{ 
                width: '100%', 
                maxWidth: '220px', 
                height: 'auto', 
                margin: '0 auto', 
                display: 'block',
                filter: 'invert(1)'
              }}
             />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.025em', color: '#1E293B', marginTop: '-10px' }}>
            {isResetting ? 'Secure Account' : (showSuccess ? 'Victory!' : 'Welcome Back')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {isResetting ? 'Choose a strong password to protect your workspace' : (showSuccess ? 'Your access has been secured successfully' : 'Enter your credentials to access the workspace')}
          </p>
        </div>

        {showSuccess ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
                padding: '1.5rem', 
                background: 'var(--bg-success-subtle)', 
                borderRadius: '16px', 
                marginBottom: '2rem',
                border: '1px solid rgba(39, 174, 96, 0.2)'
            }}>
                <p style={{ color: 'var(--text-success)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px' }}>Security Updated</p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Your new credentials are now active. Please use them for all future sessions.
                </div>
            </div>
            
            <button 
              onClick={handleReturnToLogin} 
              className="btn btn-primary" 
              style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  fontWeight: 700, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)'
              }}
            >
              Sign In with New Password <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div style={{ 
                padding: '1rem', 
                background: 'var(--bg-error-subtle)', 
                color: '#E11D48', 
                borderRadius: '12px', 
                fontSize: '0.875rem',
                fontWeight: 600,
                border: '1px solid rgba(225, 29, 72, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span> {error}
              </div>
            )}
            
            {!isResetting ? (
              <>
                  <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Email or Username</label>
                      <div style={{ position: 'relative' }}>
                        <User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            placeholder="alex@design.com" 
                            style={{ 
                                width: '100%', 
                                padding: '0.8rem 0.8rem 0.8rem 42px', 
                                height: 'auto',
                                borderRadius: '12px',
                                border: '1.5px solid #E2E8F0',
                                fontSize: '0.95rem',
                                transition: 'all 0.2s ease'
                            }}
                        />
                      </div>
                  </div>

                  <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>Password</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder="••••••••" 
                            style={{ 
                                width: '100%', 
                                padding: '0.8rem 0.8rem 0.8rem 42px',
                                height: 'auto',
                                borderRadius: '12px',
                                border: '1.5px solid #E2E8F0',
                                fontSize: '0.95rem'
                            }}
                        />
                      </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', cursor: 'pointer' }} onClick={() => setChangeAfterLogin(!changeAfterLogin)}>
                      <input 
                          type="checkbox" 
                          id="updatePass" 
                          checked={changeAfterLogin} 
                          onChange={(e) => setChangeAfterLogin(e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                      />
                      <label htmlFor="updatePass" style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500, cursor: 'pointer', userSelect: 'none' }}>
                          Update Password after login
                      </label>
                  </div>

                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ 
                      marginTop: '0.5rem', 
                      width: '100%', 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      fontWeight: 700,
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                  }}>
                      {loading ? 'Authenticating...' : 'Enter Workspace'} <ArrowRight size={18} />
                  </button>
              </>
            ) : (
               <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                  <div style={{ 
                      background: 'linear-gradient(to right, #EFF6FF, #F0FDFA)', 
                      padding: '1.25rem', 
                      borderRadius: '16px', 
                      marginBottom: '1.75rem', 
                      border: '1px solid rgba(59, 130, 246, 0.1)' 
                  }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px', color: '#1E40AF' }}>Security Enforcement</h3>
                      <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5 }}>Our policy requires a password refresh for your account. Please set a new one to continue.</p>
                  </div>
                  
                  <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.9rem', fontWeight: 600, color: '#475569' }}>New Workspace Password</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                        <input 
                            type="password" 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)} 
                            placeholder="Create safe password" 
                            style={{ 
                                width: '100%', 
                                padding: '0.8rem 0.8rem 0.8rem 42px',
                                height: 'auto',
                                borderRadius: '12px',
                                border: '1.5px solid var(--primary)',
                                fontSize: '0.95rem',
                                outline: 'none',
                                boxShadow: '0 0 0 3px rgba(52, 152, 219, 0.1)'
                            }}
                            autoFocus
                        />
                      </div>
                  </div>
                  
                  <button 
                      type="button" 
                      onClick={handlePasswordReset}
                      className="btn btn-primary" 
                      style={{ 
                          width: '100%', 
                          padding: '1rem', 
                          borderRadius: '12px', 
                          fontWeight: 700,
                          fontSize: '1rem',
                          boxShadow: '0 8px 20px -5px rgba(52, 152, 219, 0.5)'
                      }}
                      disabled={!newPassword || loading}
                  >
                      {loading ? 'Securing Account...' : 'Confirm & Re-login'}
                  </button>
                  
                  <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Password update will be logged for security audit.
                  </p>
               </div>
            )}
          </form>
        )}

        <div style={{ 
            marginTop: '2.5rem', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid #F1F5F9', 
            fontSize: '0.8rem', 
            color: '#94A3B8', 
            textAlign: 'center' 
        }}>
          <p style={{ marginBottom: '0.75rem', fontWeight: 500 }}>Global Access Points</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem' }}>
            <span style={{ padding: '4px 10px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>Designer Access</span>
            <span style={{ padding: '4px 10px', background: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>Client Portal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
