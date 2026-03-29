import { create } from 'zustand';
import type  { User } from '../types/index';
import api from '../lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = res.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(
        error.response?.data?.message || 'Login failed'
      );
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { user, accessToken, refreshToken } = res.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false });
      throw new Error(
        error.response?.data?.message || 'Registration failed'
      );
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },

  fetchProfile: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
}));