import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { restaurantsService } from '../services/restaurants.service';
import type { CrearRestauranteDto } from '../types/api.types';
import { 
  ArrowLeft, 
  Store, 
  Link as LinkIcon, 
  Mail,
  CheckCircle2,
  Loader2, 
  AlertCircle,
  QrCode,
  Check
} from 'lucide-react';

export default function RegisterRestaurantPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    slug: '',
    correo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticación al montar
  useEffect(() => {
    // Esperar a que termine de cargar la autenticación
    if (authLoading) return;
    
    if (!isAuthenticated) {
      console.log('Usuario no autenticado, redirigiendo a login');
      navigate('/login', { replace: true });
    } else if (user?.restauranteId) {
      // Si el usuario ya tiene un restaurante, redirigir al dashboard
      console.log('Usuario ya tiene restaurante, redirigiendo a dashboard');
      navigate('/dashboard', { replace: true });
    } else {
      console.log('Usuario autenticado sin restaurante, mostrando formulario');
    }
  }, [isAuthenticated, user, navigate, authLoading]);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nombre = e.target.value;
    setFormData(prev => ({
      ...prev,
      nombre,
      slug: generateSlug(nombre),
      correo: user?.email || prev.correo,
    }));
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.nombre || !formData.slug) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      setError('El slug solo puede contener letras minúsculas, números y guiones');
      return;
    }

    if (formData.slug.length < 3) {
      setError('El slug debe tener al menos 3 caracteres');
      return;
    }

    try {
      setLoading(true);
      const dto: CrearRestauranteDto = {
        nombre: formData.nombre,
        slug: formData.slug,
        correo: formData.correo || user?.email || '',
      };

      await restaurantsService.crear(dto);
      
      // El backend ya actualizó el usuario con el restaurante y le asignó el rol de Administrador
      // Sin embargo, el token JWT actual no incluye el nuevo rol, por lo que necesitamos
      // que el usuario inicie sesión nuevamente para obtener un token actualizado
      
      // Guardar un mensaje en sessionStorage para mostrarlo después del login
      sessionStorage.setItem('restaurantCreated', 'true');
      
      // Redirigir al login con un parámetro para mostrar mensaje de éxito
      window.location.href = '/login?restaurantCreated=true';
    } catch (err: any) {
      setError(err.message || 'Error al crear el restaurante. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || user?.restauranteId) {
    return null; // El useEffect manejará la redirección
  }

  return (
    <div className="min-h-screen flex">
      {/* Columna izquierda - Información */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Elementos decorativos */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
        
        <div className="relative z-10">
          {/* Logo */}
          <Link
            to="/"
            className="inline-flex items-center space-x-3 mb-16"
          >
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">MenuQR</span>
          </Link>

          {/* Contenido */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              Crea tu Restaurante
            </h1>
            <p className="text-xl text-white/90 mb-12 leading-relaxed">
              Último paso: configura tu restaurante y comienza a usar menús digitales con códigos QR
            </p>

            {/* Características */}
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Configuración rápida
                  </h3>
                  <p className="text-white/80 text-sm">
                    Solo necesitas el nombre de tu restaurante y listo para empezar
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center flex-shrink-0">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    Personaliza después
                  </h3>
                  <p className="text-white/80 text-sm">
                    Podrás agregar más detalles desde el panel de administración
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    ¡Casi terminamos!
                  </h3>
                  <p className="text-white/80 text-sm">
                    En unos segundos estarás en tu panel de control
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-white/80 text-sm">
          <p>© {new Date().getFullYear()} MenuQR. Todos los derechos reservados.</p>
        </div>
      </div>

      {/* Columna derecha - Formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Botón volver (solo en móvil) */}
          <Link
            to="/login"
            className="lg:hidden inline-flex items-center text-sm text-gray-600 hover:text-green-600 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al login
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Crea tu Restaurante
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Último paso: Configura tu restaurante y comienza a usar MenuQR
            </p>
            <div className="mt-4 flex items-center justify-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold text-sm">1</div>
              <div className="w-12 h-0.5 bg-green-200"></div>
              <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-sm">2</div>
            </div>
          </div>

          {/* Formulario */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Errores */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Nombre del Restaurante */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Restaurante *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Store className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={handleNombreChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 transition-colors"
                  placeholder="Mi Restaurante"
                />
              </div>
            </div>

            {/* Slug */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL única) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 font-mono text-sm transition-colors"
                  placeholder="mi-restaurante"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Se genera automáticamente. Solo letras minúsculas, números y guiones. Este será tu enlace único: menusqr.site/{formData.slug || 'mi-restaurante'}
              </p>
            </div>

            {/* Correo */}
            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  required
                  value={formData.correo || user?.email || ''}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-400 transition-colors"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Se usará como contacto principal del restaurante
              </p>
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/30"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creando restaurante...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Finalizar
                </>
              )}
            </button>
          </form>

          {/* Información adicional */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 mb-2">
              Podrás personalizar más opciones desde el panel de administración
            </p>
            <p className="text-xs text-gray-400">
              Al finalizar, deberás iniciar sesión nuevamente para acceder con tu nuevo rol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

