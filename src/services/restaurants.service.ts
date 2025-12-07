/**
 * Servicio para gestión de restaurantes
 */
import { apiGet, apiPost, apiPut, apiDelete, extractData, extractPaginatedData } from '../lib/api';
import type {
  Restaurante,
  PaginatedResponse,
  CrearRestauranteDto,
  ActualizarRestauranteDto,
  QueryRestauranteDto,
} from '../types/api.types';

class RestaurantsService {
  /**
   * Obtener todos los restaurantes con paginación y filtros
   */
  async obtenerTodos(query?: QueryRestauranteDto): Promise<PaginatedResponse<Restaurante>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.nombre) params.append('nombre', query.nombre);
    if (query?.slug) params.append('slug', query.slug);
    if (query?.activo !== undefined) params.append('activo', query.activo.toString());
    if (query?.estadoSuscripcion) params.append('estadoSuscripcion', query.estadoSuscripcion);
    if (query?.ciudad) params.append('ciudad', query.ciudad);
    if (query?.pais) params.append('pais', query.pais);
    
    const queryString = params.toString();
    const url = queryString ? `/restaurants?${queryString}` : '/restaurants';
    
    const response = await apiGet<PaginatedResponse<Restaurante>>(url);
    return extractPaginatedData(response);
  }

  /**
   * Obtener un restaurante por ID
   */
  async obtenerPorId(id: string): Promise<Restaurante> {
    const response = await apiGet<Restaurante>(`/restaurants/${id}`);
    return extractData(response);
  }

  /**
   * Obtener un restaurante por slug (público)
   */
  async obtenerPorSlug(slug: string): Promise<Restaurante> {
    const response = await apiGet<Restaurante>(`/restaurants/public/${slug}`);
    return extractData(response);
  }

  /**
   * Crear un nuevo restaurante
   */
  async crear(dto: CrearRestauranteDto): Promise<Restaurante> {
    const response = await apiPost<Restaurante>('/restaurants', dto);
    return extractData(response);
  }

  /**
   * Actualizar un restaurante
   */
  async actualizar(id: string, dto: ActualizarRestauranteDto): Promise<Restaurante> {
    const response = await apiPut<Restaurante>(`/restaurants/${id}`, dto);
    return extractData(response);
  }

  /**
   * Eliminar un restaurante (soft delete)
   */
  async eliminar(id: string): Promise<void> {
    await apiDelete(`/restaurants/${id}`);
  }
}

export const restaurantsService = new RestaurantsService();

