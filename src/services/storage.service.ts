/**
 * Servicio para gestión de almacenamiento de imágenes
 */
import apiClient from '../lib/api-client';
import { extractData } from '../lib/api';
import type { ApiResponse } from '../types/api.types';

export interface UploadImageResponse {
  url: string;
  fileName: string;
  bucket: string;
}

class StorageService {
  /**
   * Subir una imagen a Firebase Storage
   * @param file Archivo a subir
   * @param subfolder Subcarpeta dentro de MenuQR/{restaurante_id}/ (ej: 'items', 'categorias', 'perfil', 'portada')
   */
  async uploadImage(file: File, subfolder: string = 'imagenes'): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('image', file);
    
    const url = `/storage/upload?subfolder=${encodeURIComponent(subfolder)}`;
    
    const response = await apiClient.post<ApiResponse<UploadImageResponse>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return extractData(response.data);
  }

  /**
   * Eliminar una imagen de Firebase Storage
   * @param storagePath Ruta completa del archivo o componentes
   */
  async deleteImage(storagePath: string): Promise<void>;
  async deleteImage(restauranteId: string, subfolder: string, fileName: string): Promise<void>;
  async deleteImage(
    storagePathOrRestauranteId: string,
    subfolder?: string,
    fileName?: string
  ): Promise<void> {
    let body: any;
    
    if (subfolder && fileName) {
      // Usar componentes
      body = {
        restauranteId: storagePathOrRestauranteId,
        subfolder,
        fileName,
      };
    } else {
      // Usar storagePath completo
      body = {
        storagePath: storagePathOrRestauranteId,
      };
    }
    
    await apiClient.delete('/storage', { data: body });
  }
}

export const storageService = new StorageService();

