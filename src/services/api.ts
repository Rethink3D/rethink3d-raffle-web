import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useStandStore } from '../store/standStore';

const STAND_ROUTE = '/estande';

const isStandRoute = () => window.location.pathname.startsWith(STAND_ROUTE);

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
    const { token, role } = useAuthStore.getState();

    if (isStandRoute() && !(token && role === 'admin')) {
      const standToken = useStandStore.getState().token;
      if (standToken) {
        config.headers.Authorization = `Bearer ${standToken}`;
      }
      return config;
    }

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
      if (isStandRoute()) {
        useStandStore.getState().clear();
        return Promise.reject(error);
      }

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
