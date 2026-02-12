import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Palette, Lock, User } from 'lucide-react';
import '../styles/global.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // [NEW]
  const { login, updateUserPassword } = useAuth();
  const navigate = useNavigate();

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
      
      // Handle first login or password change requirement
      if (user.isFirstLogin === true || String(user.isFirstLogin).toUpperCase() === 'TRUE') {
          setIsResetting(true);
          return;
      }

      const role = (user.role || '').toLowerCase().trim();
      
      if (role === 'designer') {
          navigate('/designer');
      } else if (role === 'client') {
          navigate('/client');
      } else {
          // If role is missing, maybe default to designer? Or show error.
          // For now, let's be strict but helpful.
          setError(`Login successful, but account role is invalid: "${user.role}". Please contact admin.`);
          // alert(`Your account role is "${user.role}". Expected "designer" or "client".`);
      }
    } else {
      setError('Invalid credentials');
    }
  };

  const handlePasswordReset = async () => {
      setLoading(true);
      if (await updateUserPassword(newPassword)) {
           navigate('/designer'); // Default redirect
      } else {
          setError('Failed to update password');
      }
      setLoading(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'var(--bg-gradient-brand)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            width: 48, height: 48, 
            background: 'var(--primary)', 
            color: 'white', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <Palette size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)' }}>Enter your credentials to access the workspace</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ 
              padding: '0.75rem', 
              background: 'var(--bg-error-subtle)', 
              color: 'var(--text-error)', 
              borderRadius: 'var(--radius)', 
              fontSize: '0.875rem' 
            }}>
              {error}
            </div>
          )}
          
          {!isResetting ? (
            <>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email / Username</label>
                    <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: 12, top: 10, color: '#9CA3AF' }} />
                    <input 
                        type="text" 
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)} 
                        placeholder="e.g. alex@design.com" 
                        style={{ width: '100%', paddingLeft: '38px' }}
                    />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
                    <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: 12, top: 10, color: '#9CA3AF' }} />
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••" 
                        style={{ width: '100%', paddingLeft: '38px' }}
                    />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </>
          ) : (
             <>
                <div style={{ background: 'var(--bg-info-subtle)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-info-header)' }}>Set New Password</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-info-body)' }}>Please set a new password for your account to continue.</p>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>New Password</label>
                    <div style={{ position: 'relative' }}>
                    <Lock size={18} style={{ position: 'absolute', left: 12, top: 10, color: '#9CA3AF' }} />
                    <input 
                        type="password" 
                        value={newPassword} 
                        onChange={(e) => setNewPassword(e.target.value)} 
                        placeholder="New Password" 
                        style={{ width: '100%', paddingLeft: '38px' }}
                        autoFocus
                    />
                    </div>
                </div>
                <button 
                    type="button" 
                    onClick={handlePasswordReset}
                    className="btn btn-primary" 
                    style={{ marginTop: '1rem', width: '100%' }}
                    disabled={!newPassword}
                >
                    Update Password & Login
                </button>
             </>
          )}
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          <p>Demo Credentials:</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.25rem' }}>
            <span>Designer / 123</span>
            <span>Client / 123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
