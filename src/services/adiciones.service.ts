/**
 * Servicio para gestión de adiciones
 */
import { apiGet, apiPost, apiPut, apiDelete, extractData, extractPaginatedData } from '../lib/api';
import type {
  Adicion,
  PaginatedResponse,
  CrearAdicionDto,
  ActualizarAdicionDto,
  QueryAdicionDto,
} from '../types/api.types';

class AdicionesService {
  /**
   * Obtener todas las adiciones con paginación y filtros
   */
  async obtenerTodos(query?: QueryAdicionDto): Promise<PaginatedResponse<Adicion>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.restauranteId) params.append('restauranteId', query.restauranteId);
    if (query?.nombre) params.append('nombre', query.nombre);
    if (query?.activa !== undefined) params.append('activa', query.activa.toString());
    if (query?.orden) params.append('orden', query.orden);
    
    const queryString = params.toString();
    const url = queryString ? `/adiciones?${queryString}` : '/adiciones';
    
    const response = await apiGet<PaginatedResponse<Adicion>>(url);
    return extractPaginatedData(response);
  }

  /**
   * Obtener una adición por ID
   */
  async obtenerPorId(id: string): Promise<Adicion> {
    const response = await apiGet<Adicion>(`/adiciones/${id}`);
    return extractData(response);
  }

  /**
   * Obtener todas las adiciones de un restaurante
   */
  async obtenerPorRestauranteId(restauranteId: string): Promise<Adicion[]> {
    const response = await apiGet<Adicion[]>(`/adiciones/restaurante/${restauranteId}`);
    return extractData(response);
  }

  /**
   * Crear una nueva adición
   */
  async crear(dto: CrearAdicionDto): Promise<Adicion> {
    const response = await apiPost<Adicion>('/adiciones', dto);
    return extractData(response);
  }

  /**
   * Actualizar una adición
   */
  async actualizar(id: string, dto: ActualizarAdicionDto): Promise<Adicion> {
    const response = await apiPut<Adicion>(`/adiciones/${id}`, dto);
    return extractData(response);
  }

  /**
   * Eliminar una adición
   */
  async eliminar(id: string): Promise<void> {
    await apiDelete(`/adiciones/${id}`);
  }
}

export const adicionesService = new AdicionesService();

