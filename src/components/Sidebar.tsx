import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { isRouteAllowed } from '../utils/permissionMap';
import {
  LayoutDashboard,
  Store,
  Link as LinkIcon,
  Folder,
  BookOpen,
  Layers,
  Users,
  ShoppingBag,
  Table,
  Settings,
  CreditCard,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { authService } from '../services/auth.service';
import { suscripcionesService } from '../services';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  premium?: boolean; // Indica si es solo para plan PREMIUM
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Restaurante',
    path: '/dashboard/restaurant',
    icon: Store,
  },
  {
    name: 'Enlaces',
    path: '/dashboard/enlaces',
    icon: LinkIcon,
  },
  {
    name: 'Categorías',
    path: '/dashboard/categorias',
    icon: Folder,
  },
  {
    name: 'Menú',
    path: '/dashboard/menu',
    icon: BookOpen,
  },
  {
    name: 'Adiciones',
    path: '/dashboard/adiciones',
    icon: Layers,
  },
  {
    name: 'Usuarios',
    path: '/dashboard/users',
    icon: Users,
  },
  {
    name: 'Pedidos',
    path: '/dashboard/orders',
    icon: ShoppingBag,
  },
  {
    name: 'Mesas',
    path: '/dashboard/mesas',
    icon: Table,
  },
  {
    name: 'Reservas',
    path: '/dashboard/reservas',
    icon: Calendar,
    premium: true, // Solo para plan PREMIUM
  },
  {
    name: 'Configuración',
    path: '/dashboard/settings',
    icon: Settings,
  },
  {
    name: 'Planes',
    path: '/dashboard/planes',
    icon: CreditCard,
  },
  {
    name: 'Solicitudes',
    path: '/dashboard/comentarios',
    icon: MessageSquare,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [esPremium, setEsPremium] = useState(false);

  // Verificar plan PREMIUM
  useEffect(() => {
    async function verificarPlan() {
      if (!user?.restauranteId) {
        return;
      }

      try {
        const suscripcion = await suscripcionesService.obtenerPorRestauranteId(user.restauranteId);
        const esPlanPremium = suscripcion?.tipoPlan === 'premium' && suscripcion?.estado === 'active';
        setEsPremium(esPlanPremium);
      } catch (err) {
        console.error('Error al verificar plan:', err);
        setEsPremium(false);
      }
    }

    verificarPlan();
  }, [user?.restauranteId]);

  // Filtrar navegación según permisos del usuario y plan PREMIUM
  const filteredNavigation = navigation.filter(item => {
    // Verificar permisos
    if (!isRouteAllowed(item.path, hasPermission)) {
      return false;
    }
    
    // Si el item requiere PREMIUM, verificar que el usuario tenga plan PREMIUM
    if (item.premium && !esPremium) {
      return false;
    }
    
    return true;
  });

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out ${
          collapsed ? 'md:w-20' : 'md:w-72'
        }`}
      >
        <div className="flex flex-col flex-grow bg-white/80 backdrop-blur-xl border-r border-gray-200/50 overflow-hidden">
          {/* Header con logo y toggle */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200/50">
            {!collapsed ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <LayoutDashboard className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  MenuQR
                </h1>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg mx-auto">
                <LayoutDashboard className="h-6 w-6 text-white" />
              </div>
            )}
            <button
              onClick={onToggle}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 backdrop-blur-sm transition-all duration-200"
              aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
              {collapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center rounded-lg bg-gray-50/50">
                No tienes acceso a ninguna sección
              </div>
            ) : (
              filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isDashboard = item.path === '/dashboard';
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    end={isDashboard}
                    className={({ isActive }) => {
                      return `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                          : 'text-gray-700 hover:bg-gray-100/50 hover:text-green-600'
                      } ${collapsed ? 'justify-center' : ''}`;
                    }}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-green-600'} transition-colors`} />
                        {!collapsed && (
                          <span className={`ml-3 ${isActive ? 'text-white' : 'text-gray-700 group-hover:text-green-600'} transition-colors`}>
                            {item.name}
                          </span>
                        )}
                        {!collapsed && isActive && (
                          <div className="ml-auto w-2 h-2 rounded-full bg-white/80"></div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })
            )}
          </nav>

          {/* Footer con información del usuario */}
          <div className="border-t border-gray-200/50 p-4">
            {!collapsed ? (
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100/50">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold text-sm">
                      {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.nombre}</p>
                  <p className="text-xs text-green-600 font-medium truncate">{user?.rolNombre}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg bg-white/90 backdrop-blur-md border border-gray-200/50 shadow-lg text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out"
            onClick={() => setMobileMenuOpen(false)}
            style={{ top: '64px' }}
          />
          
          {/* Sidebar móvil */}
          <aside className="md:hidden fixed left-0 w-72 bg-white shadow-2xl border-r border-gray-200 z-[45] overflow-y-auto transition-transform duration-300 ease-in-out" style={{ top: '64px', height: 'calc(100vh - 64px)', transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)', willChange: 'transform' }}>
            <div className="flex flex-col h-full">
              {/* Header móvil */}
              <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <LayoutDashboard className="h-6 w-6 text-white" />
                  </div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    MenuQR
                  </h1>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Navegación móvil */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {filteredNavigation.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500 text-center rounded-lg bg-gray-50/50">
                    No tienes acceso a ninguna sección
                  </div>
                ) : (
                  filteredNavigation.map((item) => {
                    const Icon = item.icon;
                    const isDashboard = item.path === '/dashboard';
                    
                    return (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        end={isDashboard}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) => {
                          return `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                              : 'text-gray-700 hover:bg-gray-100/50 hover:text-green-600'
                          }`;
                        }}
                      >
                        {({ isActive }) => (
                          <>
                            <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-green-600'} transition-colors`} />
                            <span className={`ml-3 ${isActive ? 'text-white' : 'text-gray-700 group-hover:text-green-600'} transition-colors`}>
                              {item.name}
                            </span>
                            {isActive && (
                              <div className="ml-auto w-2 h-2 rounded-full bg-white/80"></div>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })
                )}
              </nav>

              {/* Footer móvil */}
              <div className="border-t border-gray-200/50 p-4">
                <div className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100/50">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                      <span className="text-white font-semibold text-sm">
                        {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.nombre}</p>
                    <p className="text-xs text-green-600 font-medium truncate">{user?.rolNombre}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all"
                    title="Cerrar sesión"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
