import { useAuth } from '../hooks/useAuth';
import { restaurantsService } from '../services';
import { suscripcionesService } from '../services/suscripciones.service';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import type { Restaurante, Suscripcion } from '../types/api.types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (user?.restauranteId) {
        try {
          const [restauranteData, suscripcionData] = await Promise.all([
            restaurantsService.obtenerPorId(user.restauranteId),
            suscripcionesService.obtenerPorRestauranteId(user.restauranteId).catch(() => null),
          ]);
          setRestaurante(restauranteData);
          setSuscripcion(suscripcionData);
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

  const stats = [
    {
      name: 'Restaurante',
      value: restaurante ? restaurante.nombre : 'No configurado',
      icon: (
        <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-indigo-500',
      link: '/dashboard/restaurant',
    },
    {
      name: 'Estado',
      value: restaurante?.activo ? 'Activo' : 'Inactivo',
      icon: (
        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: restaurante?.activo ? 'bg-green-500' : 'bg-gray-500',
    },
    {
      name: 'Suscripción',
      value: suscripcion ? suscripcion.tipoPlan.toUpperCase() : restaurante?.estadoSuscripcion || 'N/A',
      icon: (
        <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: suscripcion?.tipoPlan === 'free' ? 'bg-gray-500' : suscripcion?.tipoPlan === 'pro' ? 'bg-indigo-500' : 'bg-purple-500',
      link: '/dashboard/planes',
    },
    {
      name: 'Pedidos Hoy',
      value: '0',
      icon: (
        <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      color: 'bg-purple-500',
      link: '/dashboard/orders',
    },
  ];

  const quickActions = [
    {
      name: 'Configurar Restaurante',
      description: 'Actualiza la información de tu restaurante',
      href: '/dashboard/restaurant',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      name: 'Gestionar Menú',
      description: 'Agrega o edita productos y categorías',
      href: '/dashboard/menu',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: 'Ver Pedidos',
      description: 'Revisa y gestiona los pedidos activos',
      href: '/dashboard/orders',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      name: 'Gestionar Usuarios',
      description: 'Agrega o edita usuarios del sistema',
      href: '/dashboard/users',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.nombre}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Aquí está el resumen de tu restaurante y las acciones rápidas
        </p>
      </div>

      {/* Banner de Upgrade para usuarios FREE */}
      {suscripcion?.tipoPlan === 'free' && showUpgradeBanner && (
        <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white relative overflow-hidden">
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
              <p className="text-indigo-100 mb-4">
                Estás usando el plan <strong>FREE</strong>. Actualiza a <strong>PRO</strong> o <strong>PREMIUM</strong> para obtener:
              </p>
              <ul className="list-disc list-inside text-indigo-100 space-y-1 mb-4">
                <li>Items, mesas y usuarios ilimitados</li>
                <li>WebSockets en tiempo real</li>
                <li>Analytics y reportes avanzados</li>
                <li>Soporte prioritario</li>
              </ul>
              <Link
                to="/dashboard/planes"
                className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Ver Planes
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const content = (
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">{stat.icon}</div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900 capitalize">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
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

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              to={action.href}
              className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-indigo-500 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 transition-colors"
            >
              <div className="flex-shrink-0 text-indigo-600">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">{action.name}</p>
                <p className="text-sm text-gray-500 truncate">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Información del Restaurante */}
      {restaurante && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Restaurante</h3>
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
            <div className="mt-6">
              <Link
                to="/dashboard/restaurant"
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                Editar información →
              </Link>
            </div>
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
