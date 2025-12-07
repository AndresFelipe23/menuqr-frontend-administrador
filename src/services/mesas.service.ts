/**
 * Servicio para gestión de mesas del restaurante
 */
import { apiGet, apiPost, apiPut, apiDelete, extractData, extractPaginatedData } from '../lib/api';
import type {
  MesaConMesero,
  PaginatedResponse,
  CrearMesaDto,
  ActualizarMesaDto,
  QueryMesaDto,
} from '../types/api.types';

class MesasService {
  /**
   * Obtener todas las mesas con paginación y filtros
   */
  async obtenerTodos(query?: QueryMesaDto): Promise<PaginatedResponse<MesaConMesero>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.restauranteId) params.append('restauranteId', query.restauranteId);
    if (query?.numero) params.append('numero', query.numero);
    if (query?.seccion) params.append('seccion', query.seccion);
    if (query?.activa !== undefined) params.append('activa', query.activa.toString());
    if (query?.ocupada !== undefined) params.append('ocupada', query.ocupada.toString());
    if (query?.meseroAsignadoId) params.append('meseroAsignadoId', query.meseroAsignadoId);
    if (query?.orden) params.append('orden', query.orden);
    
    const queryString = params.toString();
    const url = queryString ? `/mesas?${queryString}` : '/mesas';
    
    const response = await apiGet<PaginatedResponse<MesaConMesero>>(url);
    return extractPaginatedData(response);
  }

  /**
   * Obtener una mesa por ID
   */
  async obtenerPorId(id: string): Promise<MesaConMesero> {
    const response = await apiGet<MesaConMesero>(`/mesas/${id}`);
    return extractData(response);
  }

  /**
   * Obtener todas las mesas de un restaurante
   */
  async obtenerPorRestauranteId(restauranteId: string): Promise<MesaConMesero[]> {
    const response = await apiGet<MesaConMesero[]>(`/mesas/restaurante/${restauranteId}`);
    return extractData(response);
  }

  /**
   * Crear una nueva mesa
   */
  async crear(dto: CrearMesaDto): Promise<MesaConMesero> {
    const response = await apiPost<MesaConMesero>('/mesas', dto);
    return extractData(response);
  }

  /**
   * Actualizar una mesa
   */
  async actualizar(id: string, dto: ActualizarMesaDto): Promise<MesaConMesero> {
    const response = await apiPut<MesaConMesero>(`/mesas/${id}`, dto);
    return extractData(response);
  }

  /**
   * Regenerar el código QR y la imagen QR de una mesa
   */
  async regenerarQR(id: string): Promise<MesaConMesero> {
    const response = await apiPost<MesaConMesero>(`/mesas/${id}/regenerar-qr`, {});
    return extractData(response);
  }

  /**
   * Eliminar una mesa
   */
  async eliminar(id: string): Promise<void> {
    await apiDelete(`/mesas/${id}`);
  }
}

export const mesasService = new MesasService();

