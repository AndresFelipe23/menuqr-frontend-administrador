/**
 * Servicio para gestión de enlaces de restaurantes
 */
import { apiGet, apiPost, apiPut, apiDelete, extractData, extractPaginatedData } from '../lib/api';
import type {
  EnlaceRestaurante,
  PaginatedResponse,
  CrearEnlaceDto,
  ActualizarEnlaceDto,
  QueryEnlaceDto,
} from '../types/api.types';

class EnlacesService {
  /**
   * Obtener todos los enlaces con paginación y filtros
   */
  async obtenerTodos(query?: QueryEnlaceDto): Promise<PaginatedResponse<EnlaceRestaurante>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.restauranteId) params.append('restauranteId', query.restauranteId);
    if (query?.titulo) params.append('titulo', query.titulo);
    if (query?.tipoIcono) params.append('tipoIcono', query.tipoIcono);
    if (query?.activo !== undefined) params.append('activo', query.activo.toString());
    if (query?.orden) params.append('orden', query.orden);
    
    const queryString = params.toString();
    const url = queryString ? `/enlaces?${queryString}` : '/enlaces';
    
    const response = await apiGet<PaginatedResponse<EnlaceRestaurante>>(url);
    return extractPaginatedData(response);
  }

  /**
   * Obtener un enlace por ID
   */
  async obtenerPorId(id: string): Promise<EnlaceRestaurante> {
    const response = await apiGet<EnlaceRestaurante>(`/enlaces/${id}`);
    return extractData(response);
  }

  /**
   * Obtener todos los enlaces de un restaurante
   */
  async obtenerPorRestauranteId(restauranteId: string): Promise<EnlaceRestaurante[]> {
    const response = await apiGet<EnlaceRestaurante[]>(`/enlaces/restaurante/${restauranteId}`);
    return extractData(response);
  }

  /**
   * Crear un nuevo enlace
   */
  async crear(dto: CrearEnlaceDto): Promise<EnlaceRestaurante> {
    const response = await apiPost<EnlaceRestaurante>('/enlaces', dto);
    return extractData(response);
  }

  /**
   * Actualizar un enlace
   */
  async actualizar(id: string, dto: ActualizarEnlaceDto): Promise<EnlaceRestaurante> {
    const response = await apiPut<EnlaceRestaurante>(`/enlaces/${id}`, dto);
    return extractData(response);
  }

  /**
   * Incrementar contador de clics
   */
  async incrementarClics(id: string): Promise<void> {
    await apiPost(`/enlaces/${id}/clic`);
  }

  /**
   * Eliminar un enlace
   */
  async eliminar(id: string): Promise<void> {
    await apiDelete(`/enlaces/${id}`);
  }
}

export const enlacesService = new EnlacesService();

