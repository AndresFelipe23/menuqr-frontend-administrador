import { useAuth } from '../hooks/useAuth';
import { restaurantsService } from '../services';
import { suscripcionesService } from '../services/suscripciones.service';
import { pedidosService } from '../services/pedidos.service';
import { mesasService } from '../services/mesas.service';
import { categoriasService } from '../services/categorias.service';
import { itemsMenuService } from '../services/items-menu.service';
import { usuariosService } from '../services/usuarios.service';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Sparkles, 
  X, 
  Store, 
  ShoppingBag, 
  Users, 
  Menu as MenuIcon, 
  ClipboardList,
  Clock,
  Package,
  LayoutDashboard
} from 'lucide-react';
import type { Restaurante, Suscripcion, PedidoCompleto } from '../types/api.types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);
  
  // Estadísticas
  const [stats, setStats] = useState({
    totalItems: 0,
    totalCategorias: 0,
    totalMesas: 0,
    totalUsuarios: 0,
    pedidosHoy: 0,
    pedidosPendientes: 0,
    pedidosCompletados: 0,
  });
  
  const [pedidosRecientes, setPedidosRecientes] = useState<PedidoCompleto[]>([]);

  useEffect(() => {
    async function loadData() {
      if (user?.restauranteId) {
        try {
          const [
            restauranteData,
            suscripcionData,
            itemsData,
            categoriasData,
            mesasData,
            usuariosData,
            pedidosData,
          ] = await Promise.all([
            restaurantsService.obtenerPorId(user.restauranteId),
            suscripcionesService.obtenerPorRestauranteId(user.restauranteId).catch(() => null),
            itemsMenuService.obtenerPorRestauranteId(user.restauranteId).catch(() => []),
            categoriasService.obtenerPorRestauranteId(user.restauranteId).catch(() => []),
            mesasService.obtenerPorRestauranteId(user.restauranteId).catch(() => []),
            usuariosService.obtenerPorRestauranteId(user.restauranteId).catch(() => []),
            pedidosService.obtenerPorRestauranteId(user.restauranteId).catch(() => []),
          ]);

          setRestaurante(restauranteData);
          setSuscripcion(suscripcionData);

          // Calcular estadísticas
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          
          const pedidosHoyCount = pedidosData.filter((p: PedidoCompleto) => {
            const fechaPedido = new Date(p.fechaCreacion);
            fechaPedido.setHours(0, 0, 0, 0);
            return fechaPedido.getTime() === hoy.getTime();
          }).length;

          const pedidosPendientes = pedidosData.filter((p: PedidoCompleto) => 
            p.estado === 'pendiente' || p.estado === 'pendiente_confirmacion' || p.estado === 'confirmado' || p.estado === 'preparando'
          ).length;

          const pedidosCompletados = pedidosData.filter((p: PedidoCompleto) => 
            p.estado === 'completado'
          ).length;

          setStats({
            totalItems: itemsData.length,
            totalCategorias: categoriasData.length,
            totalMesas: mesasData.filter((m: any) => m.activa).length,
            totalUsuarios: usuariosData.length,
            pedidosHoy: pedidosHoyCount,
            pedidosPendientes,
            pedidosCompletados,
          });

          // Pedidos recientes (últimos 5)
          const pedidosOrdenados = [...pedidosData]
            .sort((a: PedidoCompleto, b: PedidoCompleto) => 
              new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
            )
            .slice(0, 5);
          setPedidosRecientes(pedidosOrdenados);

        } catch (error) {
          console.error('Error al cargar datos:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.restauranteId]);

  const statCards = [
    {
      name: 'Items del Menú',
      value: stats.totalItems,
      icon: MenuIcon,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      link: '/dashboard/menu',
      description: 'Platos disponibles',
    },
    {
      name: 'Categorías',
      value: stats.totalCategorias,
      icon: ClipboardList,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      link: '/dashboard/categorias',
      description: 'Grupos de platos',
    },
    {
      name: 'Mesas Activas',
      value: stats.totalMesas,
      icon: Package,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      link: '/dashboard/mesas',
      description: 'Mesas configuradas',
    },
    {
      name: 'Pedidos Hoy',
      value: stats.pedidosHoy,
      icon: ShoppingBag,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      link: '/dashboard/orders',
      description: 'Pedidos de hoy',
    },
    {
      name: 'Pedidos Pendientes',
      value: stats.pedidosPendientes,
      icon: Clock,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      link: '/dashboard/orders',
      description: 'Requieren atención',
    },
    {
      name: 'Usuarios',
      value: stats.totalUsuarios,
      icon: Users,
      bgColor: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      link: '/dashboard/users',
      description: 'Miembros del equipo',
    },
  ];

  const quickActions = [
    {
      name: 'Configurar Restaurante',
      description: 'Actualiza la información de tu restaurante',
      href: '/dashboard/restaurant',
      icon: Store,
    },
    {
      name: 'Gestionar Menú',
      description: 'Agrega o edita productos y categorías',
      href: '/dashboard/menu',
      icon: MenuIcon,
    },
    {
      name: 'Ver Pedidos',
      description: 'Revisa y gestiona los pedidos activos',
      href: '/dashboard/orders',
      icon: ShoppingBag,
    },
    {
      name: 'Gestionar Mesas',
      description: 'Configura y administra las mesas',
      href: '/dashboard/mesas',
      icon: Package,
    },
  ];

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmado':
        return 'bg-blue-100 text-blue-800';
      case 'en_preparacion':
        return 'bg-orange-100 text-orange-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      case 'cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} h`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header con gradiente verde */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-6 mb-8 border border-green-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
            <LayoutDashboard className="h-14 w-14 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenido, {user?.nombre} 👋
            </h1>
            <p className="text-gray-600">
              Aquí está el resumen de tu restaurante y las acciones rápidas
            </p>
          </div>
        </div>
      </div>

      {/* Banner de Upgrade para usuarios FREE */}
      {suscripcion?.tipoPlan === 'free' && showUpgradeBanner && (
        <div className="mb-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-lg p-6 text-white relative overflow-hidden">
          <button
            onClick={() => setShowUpgradeBanner(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Cerrar banner"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <Sparkles className="h-8 w-8 text-yellow-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">
                ¡Desbloquea todo el potencial de tu restaurante!
              </h3>
              <p className="text-green-100 mb-4">
                Estás usando el plan <strong>FREE</strong>. Actualiza a <strong>PRO</strong> o <strong>PREMIUM</strong> para obtener:
              </p>
              <ul className="list-disc list-inside text-green-100 space-y-1 mb-4">
                <li>Items, mesas y usuarios ilimitados</li>
                <li>WebSockets en tiempo real</li>
                <li>Analytics y reportes avanzados</li>
                <li>Soporte prioritario</li>
              </ul>
              <Link
                to="/dashboard/planes"
                className="inline-flex items-center px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Ver Planes
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const content = (
            <div className="bg-white overflow-hidden rounded-xl hover:shadow-lg transition-all border border-gray-200 hover:border-green-300 hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex-shrink-0 p-4 rounded-xl ${stat.bgColor} shadow-sm`}>
                      <Icon className={`h-7 w-7 ${stat.iconColor}`} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <dt className="text-sm font-medium text-gray-500 mb-1">
                        {stat.name}
                      </dt>
                      <dd className="text-3xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </dd>
                      <dd className="text-xs text-gray-500">
                        {stat.description}
                      </dd>
                    </div>
                  </div>
                  {stat.link && (
                    <ArrowRight className={`h-5 w-5 ${stat.iconColor} opacity-50`} />
                  )}
                </div>
              </div>
            </div>
          );

          return stat.link ? (
            <Link key={stat.name} to={stat.link} className="block">
              {content}
            </Link>
          ) : (
            <div key={stat.name}>{content}</div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border border-green-100">
            <h2 className="text-xl font-bold text-gray-900">Acciones Rápidas</h2>
            <p className="text-sm text-gray-600 mt-1">Accesos directos a funciones principales</p>
          </div>
          <div className="space-y-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className="relative rounded-xl border-2 border-gray-200 bg-white px-5 py-4 shadow-sm flex items-center space-x-4 hover:border-green-500 hover:shadow-md hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500 transition-all group"
                >
                  <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg group-hover:bg-green-600 transition-colors">
                    <Icon className="h-5 w-5 text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-semibold text-gray-900">{action.name}</p>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pedidos Recientes */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Pedidos Recientes</h3>
                  <p className="text-xs text-gray-600">Últimos 5 pedidos registrados</p>
                </div>
              </div>
              <Link
                to="/dashboard/orders"
                className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 transition-colors"
              >
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {pedidosRecientes.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {pedidosRecientes.map((pedido) => (
                  <div key={pedido.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">
                            Mesa {pedido.mesaNumero || 'N/A'}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadgeColor(pedido.estado)}`}>
                            {pedido.estado.replace('_', ' ')}
                          </span>
                        </div>
                        {pedido.nombreCliente && (
                          <p className="text-sm text-gray-500 mt-1">
                            Cliente: {pedido.nombreCliente}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatearFecha(pedido.fechaCreacion)}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          ${pedido.montoTotal?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pedido.items?.length || 0} items
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-12 text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pedidos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Los pedidos recientes aparecerán aquí
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información del Restaurante */}
      {restaurante && (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Store className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Información del Restaurante</h3>
                <p className="text-xs text-gray-600">Datos básicos de tu establecimiento</p>
              </div>
            </div>
            <Link
              to="/dashboard/restaurant"
              className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1 transition-colors"
            >
              Editar información
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="px-6 py-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                <dd className="mt-1 text-sm text-gray-900">{restaurante.nombre}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Slug</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{restaurante.slug}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Correo</dt>
                <dd className="mt-1 text-sm text-gray-900">{restaurante.correo}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                <dd className="mt-1 text-sm text-gray-900">{restaurante.telefono || 'No especificado'}</dd>
              </div>
              {restaurante.ciudad && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ubicación</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {restaurante.ciudad}
                    {restaurante.pais && `, ${restaurante.pais}`}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Estado</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      restaurante.activo
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {restaurante.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {!restaurante && user?.restauranteId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No se pudo cargar la información del restaurante
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Intenta recargar la página o contacta con soporte si el problema persiste.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
