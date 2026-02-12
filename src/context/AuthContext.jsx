import React, { createContext, useContext, useState, useEffect } from 'react';
import { dataService } from '../utils/dataService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Check local storage on load (mock persistence)
  useEffect(() => {
    const storedUser = localStorage.getItem('mw_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email, password) => {
    console.log('AuthContext: login called for', email); // Trace Auth
    try {
        const user = await dataService.validateUser(email, password);
        console.log('AuthContext: validateUser returned', user); // Trace Auth Result
        if (user) {
          setUser(user);
          localStorage.setItem('mw_user', JSON.stringify(user));
          return user; 
        }
    } catch (e) {
        console.error("Login failed", e);
    }
    return null;
  };

  const updateUserPassword = async (newPassword) => {
    if (user) {
        try {
            const success = await dataService.updatePassword(user.id, newPassword);
            if (success) {
                const updatedUser = { ...user, isFirstLogin: false };
                setUser(updatedUser);
                localStorage.setItem('mw_user', JSON.stringify(updatedUser)); // Update session
                return true;
            }
        } catch (e) {
            console.error("Password update failed", e);
        }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mw_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUserPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
