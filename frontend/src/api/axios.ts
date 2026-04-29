import axios from 'axios';

import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://localhost:8443/api';

export const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url as string | undefined;
      const isLogin = url?.includes('/auth/login');
      if (!isLogin) {
        try {
          localStorage.removeItem('usm-auth');
        } catch {
          /* ignore */
        }
        useAuthStore.getState().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
