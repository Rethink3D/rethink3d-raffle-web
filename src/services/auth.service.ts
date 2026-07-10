import api from './api';
import type { User, Admin } from '../types';

export interface RegisterDto {
  name: string;
  phone: string;
  pin: string;
  email?: string;
  instagram?: string;
}

export interface LoginDto {
  phone: string;
  pin: string;
}

export interface AdminLoginDto {
  email: string;
  password?: string; // or pin/pass, let's call it password as requested: { email, password }
}

export interface AuthResponse {
  token: string;
  user: User | Admin;
  role: 'participant' | 'admin';
}

export const authService = {
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await api.post<{ access_token: string }>('/auth/register', data);
    
    // Como a API de registro do backend só retorna { access_token }, nós pegamos o token
    // e fazemos uma chamada subsequente para buscar os dados do usuário atual em /auth/me
    const token = response.data.access_token;
    
    // Temporariamente setamos o token nas requisições do axios para buscar o usuário logado
    const originalAuthorization = api.defaults.headers.common['Authorization'];
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    try {
      const userResponse = await api.get<User>('/auth/me');
      return {
        token,
        user: userResponse.data,
        role: 'participant',
      };
    } finally {
      // Restauramos o header original (será sobrescrito pelo store depois)
      if (originalAuthorization) {
        api.defaults.headers.common['Authorization'] = originalAuthorization;
      } else {
        delete api.defaults.headers.common['Authorization'];
      }
    }
  },

  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await api.post<{ access_token: string; user: User }>('/auth/login', data);
    return {
      token: response.data.access_token,
      user: response.data.user,
      role: 'participant',
    };
  },

  async adminLogin(data: AdminLoginDto): Promise<AuthResponse> {
    const response = await api.post<{ access_token: string; admin: Admin }>('/auth/admin/login', data);
    return {
      token: response.data.access_token,
      user: response.data.admin,
      role: 'admin',
    };
  },

  async getMe(): Promise<User | Admin> {
    const response = await api.get<User | Admin>('/auth/me');
    return response.data;
  },

  async changePin(data: { currentPin: string; newPin: string }): Promise<void> {
    await api.post('/auth/change-pin', data);
  },
};
