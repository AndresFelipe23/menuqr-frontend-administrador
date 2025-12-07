/**
 * Hook para verificar permisos del usuario
 */
import { useAuth } from './useAuth';
import type { Permiso } from '../types/api.types';

export function usePermissions() {
  const { user } = useAuth();

  /**
   * Verifica si el usuario tiene un permiso específico
   * Soporta wildcards: '*' otorga todos los permisos
   * Soporta permisos con wildcard: 'menu.*' otorga todos los permisos de menu
   */
  const hasPermission = (codigoPermiso: string): boolean => {
    // Si no hay usuario, denegar acceso
    if (!user) {
      return false;
    }

    // Si no tiene permisos definidos, denegar acceso
    const permisos = user.permisos || [];
    if (permisos.length === 0) {
      // Si el usuario no tiene permisos, solo permitir acceso si es un permiso especial
      // que no requiere verificación (esto se maneja en permissionMap con array vacío)
      return false;
    }

    // Si tiene el permiso '*', tiene todos los permisos
    const tieneTodosPermisos = user.permisos.some(p => p.codigo === '*');
    if (tieneTodosPermisos) {
      return true;
    }

    // Verificar permiso exacto
    const tienePermisoExacto = user.permisos.some(p => p.codigo === codigoPermiso);
    if (tienePermisoExacto) {
      return true;
    }

    // Verificar permiso con wildcard (ej: 'menu.*' incluye 'menu.view', 'menu.create', etc.)
    const partesPermiso = codigoPermiso.split('.');
    if (partesPermiso.length > 1) {
      const moduloPermiso = partesPermiso[0];
      const permisoWildcard = `${moduloPermiso}.*`;
      const tieneWildcard = user.permisos.some(p => p.codigo === permisoWildcard);
      if (tieneWildcard) {
        return true;
      }
    }

    return false;
  };

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   */
  const hasAnyPermission = (codigosPermisos: string[]): boolean => {
    return codigosPermisos.some(codigo => hasPermission(codigo));
  };

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   */
  const hasAllPermissions = (codigosPermisos: string[]): boolean => {
    return codigosPermisos.every(codigo => hasPermission(codigo));
  };

  /**
   * Obtiene todos los permisos del usuario
   */
  const getPermissions = (): Permiso[] => {
    return user?.permisos || [];
  };

  /**
   * Verifica si el usuario tiene un rol específico
   */
  const hasRole = (rolNombre: string): boolean => {
    return user?.rolNombre?.toLowerCase() === rolNombre.toLowerCase();
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPermissions,
    hasRole,
    user,
  };
}

