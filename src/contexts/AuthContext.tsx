import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/types';
import { users } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAuthenticated: boolean;
  isMaster: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('waba_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((username: string, password: string): boolean => {
    // Check for master login
    if (username === 'paulo' && password === 'master123') {
      const masterUser = users.find(u => u.role === 'master');
      if (masterUser) {
        setUser(masterUser);
        localStorage.setItem('waba_user', JSON.stringify(masterUser));
        return true;
      }
    }

    // Check for regular user login
    if (username === 'usuario' && password === 'usuario123') {
      const regularUser = users.find(u => u.role === 'user' && u.status === 'active');
      if (regularUser) {
        setUser(regularUser);
        localStorage.setItem('waba_user', JSON.stringify(regularUser));
        return true;
      }
    }

    // Check by email
    const foundUser = users.find(
      u => (u.email === username || u.name.toLowerCase().includes(username.toLowerCase())) && 
           u.password === password && 
           u.status === 'active'
    );

    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('waba_user', JSON.stringify(foundUser));
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('waba_user');
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem('waba_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateUser,
      isAuthenticated: !!user,
      isMaster: user?.role === 'master'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
