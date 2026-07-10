import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const VITE_API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

export const api = axios.create({
  baseURL: VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    // Sem isso, o ngrok free tier intercepta a 1ª requisição de cada origem
    // com uma página HTML de aviso (sem headers de CORS) em vez de deixar
    // passar pro backend — quebra tanto o axios quanto o socket.io.
    'ngrok-skip-browser-warning': 'true',
  },
});

// Request Interceptor: Attach Bearer token if available
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const role = useAuthStore.getState().role;
      useAuthStore.getState().logout();

      const path = window.location.pathname;
      if (path !== '/login' && path !== '/admin/login') {
        if (role === 'admin') {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
