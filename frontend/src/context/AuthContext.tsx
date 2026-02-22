import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { authAPI, getToken, API_URL } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      console.log(`🔗 API URL: ${API_URL}`);
      const token = await getToken();
      if (token) {
        const data = await authAPI.getMe();
        setUser(data.user);
      }
    } catch {
      await authAPI.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    const data = await authAPI.signUp(email, password, {
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      phone: userData.phone,
      username: userData.username,
      default_currency: userData.default_currency || 'USD',
    });
    setUser(data.user);
  };

  const signIn = async (email: string, password: string) => {
    const data = await authAPI.signIn(email, password);
    setUser(data.user);
  };

  const signOut = async () => {
    await authAPI.signOut();
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    await authAPI.forgotPassword(email);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const data = await authAPI.updateProfile(updates);
    setUser(data.user);
  };

  const refreshUser = async () => {
    const data = await authAPI.getMe();
    setUser(data.user);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signUp, signIn, signOut, resetPassword, updateProfile, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
