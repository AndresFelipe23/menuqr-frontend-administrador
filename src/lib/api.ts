/**
 * Funciones helper para hacer peticiones al API con manejo de errores
 */
import apiClient from './api-client';
import type { ApiResponse, PaginatedResponse } from '../types/api.types';

/**
 * Realiza una petición GET
 */
export async function apiGet<T>(url: string, config?: any): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

/**
 * Realiza una petición POST
 */
export async function apiPost<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

/**
 * Realiza una petición PUT
 */
export async function apiPut<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

/**
 * Realiza una petición PATCH
 */
export async function apiPatch<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

/**
 * Realiza una petición DELETE
 */
export async function apiDelete<T>(url: string, config?: any): Promise<ApiResponse<T>> {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  } catch (error: any) {
    throw handleApiError(error);
  }
}

/**
 * Maneja errores del API y devuelve un error formateado
 */
function handleApiError(error: any): Error {
  if (error.response) {
    // El servidor respondió con un código de estado fuera del rango 2xx
    const apiResponse: ApiResponse = error.response.data;
    const message = apiResponse.message || apiResponse.error || 'Error en la petición';
    const apiError = new Error(message) as any;
    apiError.status = error.response.status;
    apiError.data = apiResponse.data;
    apiError.errors = apiResponse.errors;
    return apiError;
  } else if (error.request) {
    // La petición fue hecha pero no se recibió respuesta
    return new Error('No se pudo conectar con el servidor. Verifica tu conexión.');
  } else {
    // Algo pasó al configurar la petición
    return new Error(error.message || 'Error desconocido');
  }
}

/**
 * Extrae los datos de una respuesta del API
 */
export function extractData<T>(response: ApiResponse<T>): T {
  if (!response.success || !response.data) {
    throw new Error(response.message || response.error || 'Error al obtener los datos');
  }
  return response.data;
}

/**
 * Extrae los datos paginados de una respuesta del API
 */
export function extractPaginatedData<T>(response: ApiResponse<PaginatedResponse<T>>): PaginatedResponse<T> {
  if (!response.success || !response.data) {
    throw new Error(response.message || response.error || 'Error al obtener los datos');
  }
  return response.data;
}

