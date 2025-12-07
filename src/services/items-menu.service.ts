/**
 * Servicio para gestión de items del menú
 */
import { apiGet, apiPost, apiPut, apiDelete, extractData, extractPaginatedData } from '../lib/api';
import type {
  ItemMenuConAdiciones,
  PaginatedResponse,
  CrearItemMenuDto,
  ActualizarItemMenuDto,
  QueryItemMenuDto,
} from '../types/api.types';

class ItemsMenuService {
  /**
   * Obtener todos los items del menú con paginación y filtros
   */
  async obtenerTodos(query?: QueryItemMenuDto): Promise<PaginatedResponse<ItemMenuConAdiciones>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.restauranteId) params.append('restauranteId', query.restauranteId);
    if (query?.categoriaId) params.append('categoriaId', query.categoriaId);
    if (query?.nombre) params.append('nombre', query.nombre);
    if (query?.disponible !== undefined) params.append('disponible', query.disponible.toString());
    if (query?.destacado !== undefined) params.append('destacado', query.destacado.toString());
    if (query?.esVegetariano !== undefined) params.append('esVegetariano', query.esVegetariano.toString());
    if (query?.esVegano !== undefined) params.append('esVegano', query.esVegano.toString());
    if (query?.sinGluten !== undefined) params.append('sinGluten', query.sinGluten.toString());
    if (query?.esPicante !== undefined) params.append('esPicante', query.esPicante.toString());
    if (query?.orden) params.append('orden', query.orden);
    
    const queryString = params.toString();
    const url = queryString ? `/items-menu?${queryString}` : '/items-menu';
    
    const response = await apiGet<PaginatedResponse<ItemMenuConAdiciones>>(url);
    return extractPaginatedData(response);
  }

  /**
   * Obtener un item del menú por ID
   */
  async obtenerPorId(id: string): Promise<ItemMenuConAdiciones> {
    const response = await apiGet<ItemMenuConAdiciones>(`/items-menu/${id}`);
    return extractData(response);
  }

  /**
   * Obtener todos los items del menú de un restaurante
   */
  async obtenerPorRestauranteId(restauranteId: string): Promise<ItemMenuConAdiciones[]> {
    const response = await apiGet<ItemMenuConAdiciones[]>(`/items-menu/restaurante/${restauranteId}`);
    return extractData(response);
  }

  /**
   * Obtener todos los items del menú de una categoría
   */
  async obtenerPorCategoriaId(categoriaId: string): Promise<ItemMenuConAdiciones[]> {
    const response = await apiGet<ItemMenuConAdiciones[]>(`/items-menu/categoria/${categoriaId}`);
    return extractData(response);
  }

  /**
   * Crear un nuevo item del menú
   */
  async crear(dto: CrearItemMenuDto): Promise<ItemMenuConAdiciones> {
    const response = await apiPost<ItemMenuConAdiciones>('/items-menu', dto);
    return extractData(response);
  }

  /**
   * Actualizar un item del menú
   */
  async actualizar(id: string, dto: ActualizarItemMenuDto): Promise<ItemMenuConAdiciones> {
    const response = await apiPut<ItemMenuConAdiciones>(`/items-menu/${id}`, dto);
    return extractData(response);
  }

  /**
   * Eliminar un item del menú
   */
  async eliminar(id: string): Promise<void> {
    await apiDelete(`/items-menu/${id}`);
  }
}

export const itemsMenuService = new ItemsMenuService();

