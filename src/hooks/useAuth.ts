/**
 * Hook para manejar la autenticación
 */
import { useState, useEffect } from 'react';
import { authService, type LoginDto, type RegisterDto } from '../services/auth.service';
import type { AuthUser } from '../types/api.types';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuario del localStorage al montar
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (credentials: LoginDto) => {
    try {
      setLoading(true);
      setError(null);
      const authData = await authService.login(credentials);
      setUser(authData.user);
      return authData;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterDto) => {
    try {
      setLoading(true);
      setError(null);
      const authData = await authService.register(userData);
      setUser(authData.user);
      return authData;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al registrar usuario';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  // Calcular isAuthenticated basado en el estado actual
  const isAuthenticated = !!user && !!authService.getAccessToken();

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated,
  };
}

