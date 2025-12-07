/**
 * Cliente HTTP para comunicarse con el backend API
 */
import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types/api.types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5290/api';

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos
});

// Interceptor para agregar token de autenticación a las peticiones
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtener token del localStorage
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Si es FormData, no establecer Content-Type (el navegador lo hace automáticamente con boundary)
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
apiClient.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, devolver los datos directamente
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si el error es 401 (no autorizado)
    if (error.response?.status === 401) {
      // Si el error es "Token inválido" o "Token expirado", no intentar refrescar
      const errorMessage = error.response.data?.message || error.response.data?.error || '';
      const isInvalidToken = errorMessage.includes('Token inválido') || 
                            errorMessage.includes('Token expirado') ||
                            errorMessage.includes('Token de autenticación no proporcionado');

      // Si es un token inválido o no hay refresh token, limpiar y redirigir inmediatamente
      const refreshToken = localStorage.getItem('refreshToken');
      if (isInvalidToken || !refreshToken || originalRequest._retry) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Solo redirigir si no estamos ya en la página de login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Intentar refrescar el token solo si no hemos intentado antes
      if (!originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Llamar al endpoint de refresh
          const response = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string; expiresIn: number }>>(
            `${API_URL}/auth/refresh`,
            { refreshToken }
          );

          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            
            // Guardar los nuevos tokens
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            // Reintentar la petición original con el nuevo token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Si el refresh falla, limpiar todo y redirigir al login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
    }

    // Para otros errores, devolver el error formateado
    return Promise.reject(error);
  }
);

export default apiClient;

