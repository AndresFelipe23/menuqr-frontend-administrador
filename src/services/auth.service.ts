/**
 * Servicio de autenticación
 */
import { apiPost, extractData } from '../lib/api';
import type { ApiResponse, AuthResponse, AuthUser } from '../types/api.types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nombre: string;
  // Campos para crear restaurante (si es registro público)
  nombreRestaurante?: string;
  slugRestaurante?: string;
  // Campos para crear usuario en restaurante existente (si es admin creando usuarios)
  restauranteId?: string;
  rolId?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

class AuthService {
  /**
   * Iniciar sesión
   */
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await apiPost<AuthResponse>('/auth/login', credentials);
    const authData = extractData(response);
    
    // Guardar tokens en localStorage
    localStorage.setItem('accessToken', authData.tokens.accessToken);
    localStorage.setItem('refreshToken', authData.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(authData.user));
    
    return authData;
  }

  /**
   * Registrar nuevo usuario
   */
  async register(userData: RegisterDto): Promise<AuthResponse> {
    const response = await apiPost<AuthResponse>('/auth/register', userData);
    const authData = extractData(response);
    
    // Guardar tokens en localStorage
    localStorage.setItem('accessToken', authData.tokens.accessToken);
    localStorage.setItem('refreshToken', authData.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(authData.user));
    
    return authData;
  }

  /**
   * Refrescar token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const response = await apiPost<{ accessToken: string; refreshToken: string; expiresIn: number }>(
      '/auth/refresh',
      { refreshToken }
    );
    const tokenData = extractData(response);
    
    // Actualizar tokens en localStorage
    localStorage.setItem('accessToken', tokenData.accessToken);
    localStorage.setItem('refreshToken', tokenData.refreshToken);
    
    return tokenData;
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  /**
   * Obtener usuario actual del localStorage
   */
  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Verificar si hay un usuario autenticado
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    const user = this.getCurrentUser();
    return !!token && !!user;
  }

  /**
   * Obtener token de acceso
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}

export const authService = new AuthService();

