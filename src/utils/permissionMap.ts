/**
 * Mapeo de rutas/páginas a permisos requeridos
 */

export interface RoutePermission {
  path: string;
  requiredPermissions: string[];
  name: string;
}

/**
 * Mapeo de rutas a permisos
 * Si una ruta requiere múltiples permisos, el usuario necesita tener al menos uno (OR)
 */
export const routePermissions: RoutePermission[] = [
  {
    path: '/dashboard',
    requiredPermissions: [], // Dashboard accesible para todos los usuarios autenticados (array vacío = sin restricciones)
    name: 'Dashboard',
  },
  {
    path: '/dashboard/restaurant',
    requiredPermissions: ['restaurant.*', '*'],
    name: 'Restaurante',
  },
  {
    path: '/dashboard/enlaces',
    requiredPermissions: ['restaurant.*', '*'],
    name: 'Enlaces',
  },
  {
    path: '/dashboard/categorias',
    requiredPermissions: ['menu.*', '*'],
    name: 'Categorías',
  },
  {
    path: '/dashboard/menu',
    requiredPermissions: ['menu.*', '*'],
    name: 'Menú',
  },
  {
    path: '/dashboard/adiciones',
    requiredPermissions: ['menu.*', '*'],
    name: 'Adiciones',
  },
  {
    path: '/dashboard/users',
    requiredPermissions: ['users.*', '*'],
    name: 'Usuarios',
  },
  {
    path: '/dashboard/orders',
    requiredPermissions: ['orders.view', 'orders.update_status', '*'],
    name: 'Pedidos',
  },
  {
    path: '/dashboard/mesas',
    requiredPermissions: [], // Mesas accesible para todos los usuarios autenticados
    name: 'Mesas',
  },
  {
    path: '/dashboard/settings',
    requiredPermissions: [], // Settings accesible para todos los usuarios autenticados
    name: 'Configuración',
  },
  {
    path: '/dashboard/planes',
    requiredPermissions: [], // Planes accesible para todos los usuarios autenticados
    name: 'Planes',
  },
];

/**
 * Obtiene los permisos requeridos para una ruta específica
 */
export function getRequiredPermissionsForRoute(path: string): string[] {
  const route = routePermissions.find(r => r.path === path);
  return route?.requiredPermissions || [];
}

/**
 * Verifica si una ruta está permitida para el usuario
 */
export function isRouteAllowed(
  path: string,
  hasPermission: (codigo: string) => boolean
): boolean {
  const requiredPermissions = getRequiredPermissionsForRoute(path);
  if (requiredPermissions.length === 0) {
    return true; // Si no hay permisos requeridos, permitir acceso
  }
  return requiredPermissions.some(perm => hasPermission(perm));
}

