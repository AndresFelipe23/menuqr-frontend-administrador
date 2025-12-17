/**
 * Servicio para gestión de reservas
 */
import { apiGet, apiPost, apiPut, apiDelete, extractData } from '../lib/api';
import type { PaginatedResponse } from '../types/api.types';

export interface Reserva {
  id: string;
  restauranteId: string;
  mesaId: string;
  nombreCliente: string;
  correoCliente: string;
  telefonoCliente: string;
  fechaReserva: string;
  numeroPersonas: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada' | 'completada' | 'no_show' | 'expirada';
  codigoConfirmacion: string | null;
  notasCliente: string | null;
  notasInternas: string | null;
  meseroAsignadoId: string | null;
  confirmada: boolean;
  fechaConfirmacion: string | null;
  confirmadaPorId: string | null;
  cancelada: boolean;
  fechaCancelacion: string | null;
  canceladaPorId: string | null;
  motivoCancelacion: string | null;
  fechaLlegada: string | null;
  fechaSalida: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface ReservaConDetalles extends Reserva {
  mesaNumero?: string | null;
  mesaNombre?: string | null;
  meseroNombre?: string | null;
  confirmadaPorNombre?: string | null;
  canceladaPorNombre?: string | null;
}

export interface CrearReservaDto {
  restauranteId: string;
  mesaId: string;
  nombreCliente: string;
  correoCliente: string;
  telefonoCliente: string;
  fechaReserva: string;
  numeroPersonas?: number;
  notasCliente?: string;
  meseroAsignadoId?: string;
}

export interface ActualizarReservaDto {
  mesaId?: string;
  nombreCliente?: string;
  correoCliente?: string;
  telefonoCliente?: string;
  fechaReserva?: string;
  numeroPersonas?: number;
  estado?: string;
  notasCliente?: string;
  notasInternas?: string;
  meseroAsignadoId?: string;
  confirmada?: boolean;
  cancelada?: boolean;
  motivoCancelacion?: string;
  fechaLlegada?: string;
  fechaSalida?: string;
}

export interface QueryReservaDto {
  page?: number;
  limit?: number;
  restauranteId?: string;
  mesaId?: string;
  estado?: string;
  correoCliente?: string;
  telefonoCliente?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  confirmada?: boolean;
  cancelada?: boolean;
  meseroAsignadoId?: string;
  orden?: 'asc' | 'desc';
  ordenPor?: 'fecha_creacion' | 'fecha_reserva' | 'estado';
}

class ReservasService {
  /**
   * Obtener todas las reservas con paginación y filtros
   */
  async obtenerTodas(query?: QueryReservaDto): Promise<PaginatedResponse<ReservaConDetalles>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.restauranteId) params.append('restauranteId', query.restauranteId);
    if (query?.mesaId) params.append('mesaId', query.mesaId);
    if (query?.estado) params.append('estado', query.estado);
    if (query?.correoCliente) params.append('correoCliente', query.correoCliente);
    if (query?.telefonoCliente) params.append('telefonoCliente', query.telefonoCliente);
    if (query?.fechaDesde) params.append('fechaDesde', query.fechaDesde);
    if (query?.fechaHasta) params.append('fechaHasta', query.fechaHasta);
    if (query?.confirmada !== undefined) params.append('confirmada', query.confirmada.toString());
    if (query?.cancelada !== undefined) params.append('cancelada', query.cancelada.toString());
    if (query?.meseroAsignadoId) params.append('meseroAsignadoId', query.meseroAsignadoId);
    if (query?.orden) params.append('orden', query.orden);
    if (query?.ordenPor) params.append('ordenPor', query.ordenPor);
    
    const queryString = params.toString();
    const url = queryString ? `/reservas?${queryString}` : '/reservas';
    
    const response = await apiGet<ReservaConDetalles[]>(url);
    
    // El backend devuelve los items en data y la paginación en metadata
    if (!response.success || !response.data) {
      throw new Error(response.message || response.error || 'Error al obtener las reservas');
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
   * Obtener una reserva por ID
   */
  async obtenerPorId(id: string): Promise<ReservaConDetalles> {
    const response = await apiGet<ReservaConDetalles>(`/reservas/${id}`);
    return extractData(response);
  }

  /**
   * Crear una nueva reserva
   */
  async crear(data: CrearReservaDto): Promise<Reserva> {
    const response = await apiPost<Reserva>('/reservas', data);
    return extractData(response);
  }

  /**
   * Actualizar una reserva
   */
  async actualizar(id: string, data: ActualizarReservaDto): Promise<Reserva> {
    const response = await apiPut<Reserva>(`/reservas/${id}`, data);
    return extractData(response);
  }

  /**
   * Eliminar una reserva
   */
  async eliminar(id: string): Promise<void> {
    await apiDelete(`/reservas/${id}`);
  }

  /**
   * Confirmar una reserva por código (público)
   */
  async confirmarPorCodigo(codigo: string): Promise<Reserva> {
    const response = await apiGet<Reserva>(`/reservas/public/confirmar/${codigo}`);
    return extractData(response);
  }
}

export const reservasService = new ReservasService();

