import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { routePermissions } from '../utils/permissionMap';
import {
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [pageTitle, setPageTitle] = useState('Dashboard');

  // Obtener el título de la página actual basado en la ruta
  useEffect(() => {
    const currentRoute = routePermissions.find(
      route => route.path === location.pathname
    );
    if (currentRoute) {
      setPageTitle(currentRoute.name);
    } else {
      // Si no encuentra la ruta, usar el pathname como fallback
      const pathParts = location.pathname.split('/').filter(Boolean);
      if (pathParts.length > 1) {
        const lastPart = pathParts[pathParts.length - 1];
        setPageTitle(lastPart.charAt(0).toUpperCase() + lastPart.slice(1));
      } else {
        setPageTitle('Dashboard');
      }
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-30">
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm"></div>
      <div className="relative max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Título dinámico */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse"></div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {pageTitle}
              </h2>
            </div>
          </div>

          {/* Acciones del usuario */}
          <div className="flex items-center space-x-3">
            {/* Menú de usuario */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100/50 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-gray-900">{user?.nombre}</p>
                  <p className="text-xs text-gray-500">{user?.rolNombre}</p>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 hidden md:block transition-transform ${
                    showUserMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown del menú de usuario */}
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl shadow-2xl bg-white/95 backdrop-blur-xl border border-white/20 z-20 overflow-hidden">
                    {/* Header del dropdown */}
                    <div className="px-4 py-3 border-b border-gray-200/50 bg-gradient-to-br from-green-50 to-emerald-50">
                      <p className="text-sm font-bold text-gray-900">{user?.nombre}</p>
                      <p className="text-xs text-green-600 font-medium truncate">{user?.email}</p>
                      <p className="text-xs text-gray-600 mt-1">{user?.rolNombre}</p>
                    </div>

                    {/* Opciones del menú */}
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/dashboard/settings');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-gray-400" />
                        <span>Configuración</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
