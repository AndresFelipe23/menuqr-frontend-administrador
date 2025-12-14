/**
 * Servicio para gestión de comentarios, quejas y solicitudes
 */
import { apiGet, apiPost, apiPut, apiDelete, extractData } from '../lib/api';
import type {
  Comentario,
  PaginatedResponse,
  CrearComentarioDto,
  ActualizarComentarioDto,
  QueryComentarioDto,
} from '../types/api.types';

class ComentariosService {
  /**
   * Obtener todos los comentarios con paginación y filtros
   */
  async obtenerTodos(query?: QueryComentarioDto): Promise<PaginatedResponse<Comentario>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.restauranteId) params.append('restauranteId', query.restauranteId);
    if (query?.usuarioId) params.append('usuarioId', query.usuarioId);
    if (query?.tipo) params.append('tipo', query.tipo);
    if (query?.estado) params.append('estado', query.estado);
    if (query?.prioridad) params.append('prioridad', query.prioridad);
    if (query?.asunto) params.append('asunto', query.asunto);
    if (query?.orden) params.append('orden', query.orden);
    
    const queryString = params.toString();
    const url = queryString ? `/comentarios?${queryString}` : '/comentarios';
    
    const response = await apiGet<Comentario[]>(url);
    
    // El backend devuelve los items en data y la paginación en metadata
    if (!response.success || !response.data) {
      throw new Error(response.message || response.error || 'Error al obtener los comentarios');
    }
    
    // Convertir la respuesta del backend al formato esperado por el frontend
    return {
      items: Array.isArray(response.data) ? response.data : [],
      pagination: {
        total: response.metadata?.total || 0,
        page: response.metadata?.page || query?.page || 1,
        limit: response.metadata?.limit || query?.limit || 10,
        totalPages: response.metadata?.totalPages || 0,
        hasNext: response.metadata?.hasNext || false,
        hasPrev: response.metadata?.hasPrev || false,
      },
    };
  }

  /**
   * Obtener un comentario por ID
   */
  async obtenerPorId(id: string): Promise<Comentario> {
    const response = await apiGet<Comentario>(`/comentarios/${id}`);
    return extractData(response);
  }

  /**
   * Crear un nuevo comentario
   */
  async crear(dto: CrearComentarioDto): Promise<Comentario> {
    const response = await apiPost<Comentario>('/comentarios', dto);
    return extractData(response);
  }

  /**
   * Actualizar un comentario
   */
  async actualizar(id: string, dto: ActualizarComentarioDto): Promise<Comentario> {
    const response = await apiPut<Comentario>(`/comentarios/${id}`, dto);
    return extractData(response);
  }

  /**
   * Responder a un comentario
   */
  async responder(id: string, respuesta: string): Promise<Comentario> {
    const response = await apiPost<Comentario>(`/comentarios/${id}/responder`, { respuesta });
    return extractData(response);
  }

  /**
   * Eliminar un comentario
   */
  async eliminar(id: string): Promise<void> {
    await apiDelete(`/comentarios/${id}`);
  }
}

export const comentariosService = new ComentariosService();

