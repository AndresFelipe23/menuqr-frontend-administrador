/**
 * Servicio para gestión de pedidos
 */
import { apiGet, apiPost, apiPut, apiPatch, apiDelete, extractData, extractPaginatedData } from '../lib/api';
import type {
  PedidoCompleto,
  PaginatedResponse,
  CrearPedidoDto,
  ActualizarPedidoDto,
  QueryPedidoDto,
  EstadoPedido,
  HistorialEstadoPedido,
} from '../types/api.types';

class PedidosService {
  /**
   * Obtener todos los pedidos con paginación y filtros
   */
  async obtenerTodos(query?: QueryPedidoDto): Promise<PaginatedResponse<PedidoCompleto>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.restauranteId) params.append('restauranteId', query.restauranteId);
    if (query?.mesaId) params.append('mesaId', query.mesaId);
    if (query?.meseroAsignadoId) params.append('meseroAsignadoId', query.meseroAsignadoId);
    if (query?.estado) params.append('estado', query.estado);
    if (query?.nombreCliente) params.append('nombreCliente', query.nombreCliente);
    if (query?.orden) params.append('orden', query.orden);
    
    const queryString = params.toString();
    const url = queryString ? `/pedidos?${queryString}` : '/pedidos';
    
    const response = await apiGet<PaginatedResponse<PedidoCompleto>>(url);
    return extractPaginatedData(response);
  }

  /**
   * Obtener un pedido por ID
   */
  async obtenerPorId(id: string): Promise<PedidoCompleto> {
    const response = await apiGet<PedidoCompleto>(`/pedidos/${id}`);
    return extractData(response);
  }

  /**
   * Obtener todos los pedidos de un restaurante
   */
  async obtenerPorRestauranteId(restauranteId: string): Promise<PedidoCompleto[]> {
    const response = await apiGet<PedidoCompleto[]>(`/pedidos/restaurante/${restauranteId}`);
    return extractData(response);
  }

  /**
   * Obtener todos los pedidos de una mesa
   */
  async obtenerPorMesaId(mesaId: string): Promise<PedidoCompleto[]> {
    const response = await apiGet<PedidoCompleto[]>(`/pedidos/mesa/${mesaId}`);
    return extractData(response);
  }

  /**
   * Crear un nuevo pedido
   */
  async crear(dto: CrearPedidoDto): Promise<PedidoCompleto> {
    const response = await apiPost<PedidoCompleto>('/pedidos', dto);
    return extractData(response);
  }

  /**
   * Actualizar un pedido
   */
  async actualizar(id: string, dto: ActualizarPedidoDto): Promise<PedidoCompleto> {
    const response = await apiPut<PedidoCompleto>(`/pedidos/${id}`, dto);
    return extractData(response);
  }

  /**
   * Cambiar el estado de un pedido
   */
  async cambiarEstado(id: string, estado: EstadoPedido, notas?: string): Promise<PedidoCompleto> {
    const response = await apiPatch<PedidoCompleto>(`/pedidos/${id}/estado`, { estado, notas });
    return extractData(response);
  }

  /**
   * Confirmar un pedido pendiente de confirmación
   */
  async confirmarPedido(id: string): Promise<PedidoCompleto> {
    const response = await apiPost<PedidoCompleto>(`/pedidos/${id}/confirmar`, {});
    return extractData(response);
  }

  /**
   * Actualizar el estado de un item individual del pedido
   */
  async actualizarEstadoItem(itemId: string, estado: string, notas?: string): Promise<PedidoCompleto> {
    const response = await apiPatch<PedidoCompleto>(`/pedidos/items/${itemId}/estado`, { estado, notas });
    return extractData(response);
  }

  /**
   * Obtener el historial de cambios de estado de un pedido
   */
  async obtenerHistorial(id: string): Promise<HistorialEstadoPedido[]> {
    const response = await apiGet<HistorialEstadoPedido[]>(`/pedidos/${id}/historial`);
    return extractData(response);
  }

  /**
   * Eliminar un pedido
   */
  async eliminar(id: string): Promise<void> {
    await apiDelete(`/pedidos/${id}`);
  }
}

export const pedidosService = new PedidosService();

