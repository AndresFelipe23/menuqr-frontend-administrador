/**
 * Servicio para gestión de usuarios del sistema
 */
import { apiGet, apiPost, apiPut, apiDelete, extractData, extractPaginatedData } from '../lib/api';
import type {
  UsuarioConRol,
  PaginatedResponse,
  CrearUsuarioDto,
  ActualizarUsuarioDto,
  QueryUsuarioDto,
} from '../types/api.types';

class UsuariosService {
  /**
   * Obtener todos los usuarios con paginación y filtros
   */
  async obtenerTodos(query?: QueryUsuarioDto): Promise<PaginatedResponse<UsuarioConRol>> {
    const params = new URLSearchParams();
    
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.restauranteId) params.append('restauranteId', query.restauranteId);
    if (query?.correo) params.append('correo', query.correo);
    if (query?.nombre) params.append('nombre', query.nombre);
    if (query?.rolId) params.append('rolId', query.rolId);
    if (query?.activo !== undefined) params.append('activo', query.activo.toString());
    if (query?.correoVerificado !== undefined) params.append('correoVerificado', query.correoVerificado.toString());
    if (query?.orden) params.append('orden', query.orden);
    
    const queryString = params.toString();
    const url = queryString ? `/usuarios?${queryString}` : '/usuarios';
    
    const response = await apiGet<PaginatedResponse<UsuarioConRol>>(url);
    return extractPaginatedData(response);
  }

  /**
   * Obtener un usuario por ID
   */
  async obtenerPorId(id: string): Promise<UsuarioConRol> {
    const response = await apiGet<UsuarioConRol>(`/usuarios/${id}`);
    return extractData(response);
  }

  /**
   * Obtener todos los usuarios de un restaurante
   */
  async obtenerPorRestauranteId(restauranteId: string): Promise<UsuarioConRol[]> {
    const response = await apiGet<UsuarioConRol[]>(`/usuarios/restaurante/${restauranteId}`);
    return extractData(response);
  }

  /**
   * Crear un nuevo usuario
   */
  async crear(dto: CrearUsuarioDto): Promise<UsuarioConRol> {
    const response = await apiPost<UsuarioConRol>('/usuarios', dto);
    return extractData(response);
  }

  /**
   * Actualizar un usuario
   */
  async actualizar(id: string, dto: ActualizarUsuarioDto): Promise<UsuarioConRol> {
    const response = await apiPut<UsuarioConRol>(`/usuarios/${id}`, dto);
    return extractData(response);
  }

  /**
   * Eliminar un usuario
   */
  async eliminar(id: string): Promise<void> {
    await apiDelete(`/usuarios/${id}`);
  }
}

export const usuariosService = new UsuariosService();

