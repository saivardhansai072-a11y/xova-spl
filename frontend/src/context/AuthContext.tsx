import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/theme';

type User = {
  user_id: string;
  email: string;
  name: string;
  picture: string;
  plan: string;
  mentor_personality: string;
  mentor_voice: string;
  mentor_style: string;
  streak: number;
  total_questions_answered: number;
  total_correct: number;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: (sessionToken: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null, loading: true, token: null,
  login: async () => {}, logout: async () => {}, refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem('session_token');
      if (!storedToken) { setLoading(false); return; }
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${storedToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setToken(storedToken);
      } else {
        await AsyncStorage.removeItem('session_token');
      }
    } catch (e) {
      console.log('Auth check failed:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (sessionToken: string, userData: User) => {
    await AsyncStorage.setItem('session_token', sessionToken);
    setToken(sessionToken);
    setUser(userData);
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }
    } catch (e) {}
    await AsyncStorage.removeItem('session_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setUser(await res.json());
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
