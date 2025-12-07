/**
 * Servicio para gestión de suscripciones
 */
import { apiGet, apiPost, apiPut, extractData } from '../lib/api';
import type {
  Suscripcion,
  CrearSuscripcionDto,
  ActualizarSuscripcionDto,
  LimitesPlan,
} from '../types/api.types';

class SuscripcionesService {
  /**
   * Obtener la suscripción de un restaurante
   */
  async obtenerPorRestauranteId(restauranteId: string): Promise<Suscripcion> {
    const response = await apiGet<Suscripcion>(`/suscripciones/restaurante/${restauranteId}`);
    return extractData(response);
  }

  /**
   * Verificar los límites de un plan
   */
  async verificarLimites(
    restauranteId: string,
    tipo?: 'items' | 'mesas' | 'usuarios'
  ): Promise<LimitesPlan> {
    const params = tipo ? `?tipo=${tipo}` : '';
    const response = await apiGet<LimitesPlan>(
      `/suscripciones/restaurante/${restauranteId}/limites${params}`
    );
    return extractData(response);
  }

  /**
   * Crear una nueva suscripción
   */
  async crear(dto: CrearSuscripcionDto): Promise<Suscripcion> {
    const response = await apiPost<Suscripcion>('/suscripciones', dto);
    return extractData(response);
  }

  /**
   * Actualizar una suscripción existente
   */
  async actualizar(id: string, dto: ActualizarSuscripcionDto): Promise<Suscripcion> {
    const response = await apiPut<Suscripcion>(`/suscripciones/${id}`, dto);
    return extractData(response);
  }
}

export const suscripcionesService = new SuscripcionesService();

