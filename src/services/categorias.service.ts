/**
 * Servicio para gestión de categorías de menú
 */
import { apiGet, apiPost, apiPut, apiDelete, extractData, extractPaginatedData } from '../lib/api';
import type {
  Categoria,
  PaginatedResponse,
  CrearCategoriaDto,
  ActualizarCategoriaDto,
  QueryCategoriaDto,
} from '../types/api.types';

class CategoriasService {
  /**
   * Obtener todas las categorías con paginación y filtros
   */
  async obtenerTodos(query?: QueryCategoriaDto): Promise<PaginatedResponse<Categoria>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.restauranteId) params.append('restauranteId', query.restauranteId);
    if (query?.nombre) params.append('nombre', query.nombre);
    if (query?.activa !== undefined) params.append('activa', query.activa.toString());
    if (query?.orden) params.append('orden', query.orden);
    
    const queryString = params.toString();
    const url = queryString ? `/categorias?${queryString}` : '/categorias';
    
    const response = await apiGet<PaginatedResponse<Categoria>>(url);
    return extractPaginatedData(response);
  }

  /**
   * Obtener una categoría por ID
   */
  async obtenerPorId(id: string): Promise<Categoria> {
    const response = await apiGet<Categoria>(`/categorias/${id}`);
    return extractData(response);
  }

  /**
   * Obtener todas las categorías de un restaurante
   */
  async obtenerPorRestauranteId(restauranteId: string): Promise<Categoria[]> {
    const response = await apiGet<Categoria[]>(`/categorias/restaurante/${restauranteId}`);
    return extractData(response);
  }

  /**
   * Crear una nueva categoría
   */
  async crear(dto: CrearCategoriaDto): Promise<Categoria> {
    const response = await apiPost<Categoria>('/categorias', dto);
    return extractData(response);
  }

  /**
   * Actualizar una categoría
   */
  async actualizar(id: string, dto: ActualizarCategoriaDto): Promise<Categoria> {
    const response = await apiPut<Categoria>(`/categorias/${id}`, dto);
    return extractData(response);
  }

  /**
   * Eliminar una categoría
   */
  async eliminar(id: string): Promise<void> {
    await apiDelete(`/categorias/${id}`);
  }
}

export const categoriasService = new CategoriasService();

