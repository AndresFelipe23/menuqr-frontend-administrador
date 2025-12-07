import { 
  QrCode, 
  Menu, 
  Users, 
  Clock, 
  Smartphone, 
  BarChart3,
  Check,
  ArrowRight,
  LogIn,
  UserPlus,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { restaurantsService } from '../services';
import type { Restaurante } from '../types/api.types';

export default function LandingPage() {
  const [restaurantes, setRestaurantes] = useState<Restaurante[]>([]);
  const [loadingRestaurantes, setLoadingRestaurantes] = useState(true);

  useEffect(() => {
    const cargarRestaurantes = async () => {
      try {
        const data = await restaurantsService.obtenerTodosPublicos();
        // Limitar a 6 restaurantes para mostrar en el landing
        setRestaurantes(data.slice(0, 6));
      } catch (error) {
        console.error('Error al cargar restaurantes:', error);
        setRestaurantes([]);
      } finally {
        setLoadingRestaurantes(false);
      }
    };

    cargarRestaurantes();
  }, []);

  const features = [
    {
      icon: QrCode,
      title: 'Códigos QR Automáticos',
      description: 'Genera códigos QR únicos para cada mesa automáticamente. Tus clientes escanean y acceden al menú al instante.',
    },
    {
      icon: Menu,
      title: 'Gestión Completa de Menú',
      description: 'Administra categorías, platos, precios y adiciones de forma fácil e intuitiva. Actualiza tu menú en tiempo real.',
    },
    {
      icon: Users,
      title: 'Sistema de Roles',
      description: 'Administradores, meseros y cocina trabajan en armonía. Control de acceso granular para cada usuario.',
    },
    {
      icon: Clock,
      title: 'Pedidos en Tiempo Real',
      description: 'WebSockets para actualizaciones instantáneas. Los pedidos llegan a cocina al momento, sin demoras.',
    },
    {
      icon: Smartphone,
      title: 'Diseño Responsive',
      description: 'Funciona perfectamente en móviles, tablets y escritorio. Tus clientes pueden pedir desde cualquier dispositivo.',
    },
    {
      icon: BarChart3,
      title: 'Analytics Avanzado',
      description: 'Conoce tus items más vendidos, horas pico y tendencias. Toma decisiones basadas en datos reales.',
    },
  ];

  const plans = [
    {
      name: 'FREE',
      price: '$0',
      period: '/mes',
      description: 'Perfecto para empezar',
      features: [
        'Hasta 15 items en el menú',
        'Hasta 3 categorías',
        'Hasta 5 mesas',
        '1 usuario (solo administrador)',
        'QR automático por mesa',
        'Soporte por email',
        'Sin marca de agua',
      ],
      limitations: [
        'Sin WebSockets (actualizaciones manuales)',
        'Sin analytics',
        'Sin enlaces sociales',
        'Sin roles adicionales',
      ],
      cta: 'Comenzar Gratis',
      popular: false,
    },
    {
      name: 'PRO',
      price: '$9',
      period: '/mes',
      priceAnnual: '$90',
      periodAnnual: '/año',
      description: 'Para restaurantes establecidos',
      features: [
        'Items ilimitados en el menú',
        'Categorías ilimitadas',
        'Adiciones y opciones ilimitadas',
        'Mesas ilimitadas',
        'Usuarios ilimitados',
        'WebSockets (tiempo real)',
        'Historial completo de cambios',
        'Múltiples vistas de pedidos',
        'Personalización completa',
        'Enlaces sociales (Linktr.ee)',
        'Soporte prioritario',
        'Sin marca de agua',
      ],
      limitations: [],
      cta: 'Comenzar Ahora',
      popular: true,
    },
    {
      name: 'PREMIUM',
      price: '$14',
      period: '/mes',
      priceAnnual: '$140',
      periodAnnual: '/año',
      description: 'Funcionalidades avanzadas',
      features: [
        'Todo lo de PRO',
        'Analytics y reportes avanzados',
        'Reservas de mesas',
        'Promociones y descuentos',
        'Reseñas y calificaciones',
        'Gestión de stock/inventario',
        'Integración con delivery',
        'API personalizada',
        'Soporte 24/7',
      ],
      limitations: [],
      cta: 'Comenzar Ahora',
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                MenuQR
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/login"
                className="flex items-center space-x-2 px-5 py-2.5 text-gray-700 hover:text-green-600 transition-all rounded-lg hover:bg-white/50 backdrop-blur-sm"
              >
                <LogIn className="h-4 w-4" />
                <span className="font-medium">Iniciar Sesión</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 hover:shadow-xl transform hover:scale-105"
              >
                <UserPlus className="h-4 w-4" />
                <span className="font-semibold">Registrarse</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background con gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,197,94,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.1),transparent_50%)]"></div>
        
        {/* Elementos decorativos flotantes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-white/20 shadow-lg mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm font-medium text-gray-700">Disponible ahora • Sin tarjeta de crédito</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-green-900 to-emerald-900 bg-clip-text text-transparent">
              Menús Digitales con{' '}
            </span>
            <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Códigos QR
            </span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Moderniza tu restaurante con menús digitales interactivos. 
            Tus clientes escanean, ordenan y disfrutan. Simple, rápido y eficiente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link
              to="/register"
              className="group flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-lg font-semibold hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-105 shadow-xl shadow-green-500/30 hover:shadow-2xl"
            >
              <span>Comenzar Gratis</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#planes"
              className="px-8 py-4 bg-white/80 backdrop-blur-md text-green-600 rounded-xl text-lg font-semibold border-2 border-green-200 hover:bg-white hover:border-green-300 transition-all shadow-lg hover:shadow-xl"
            >
              Ver Planes
            </a>
          </div>
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Configuración en minutos</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Soporte incluido</span>
            </div>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background con gradientes */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-green-50/30 to-emerald-50/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.05),transparent_70%)]"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-2 rounded-full bg-green-100/50 backdrop-blur-sm border border-green-200/50 mb-6">
              <span className="text-sm font-semibold text-green-700">Vista Previa</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Así se ve tu{' '}
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                restaurante
              </span>{' '}
              para tus clientes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Una experiencia completa y profesional que tus clientes amarán
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
            {/* Mockup del dispositivo móvil */}
            <div className="relative flex-shrink-0">
              {/* Frame del dispositivo */}
              <div className="relative w-[320px] h-[640px] bg-gray-900 rounded-[3rem] p-2 shadow-2xl">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10"></div>
                
                {/* Pantalla */}
                <div className="w-full h-full bg-gray-50 rounded-[2.5rem] overflow-hidden relative">
                  {/* Barra de estado */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-white z-20 flex items-center justify-between px-4 text-gray-900 text-xs">
                    <span>9:41</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-2 border border-gray-900 rounded-sm"></div>
                      <div className="w-1 h-3 bg-gray-900 rounded-sm"></div>
                    </div>
                  </div>
                  
                  {/* Contenido de la página del restaurante */}
                  <div className="pt-8 h-full overflow-y-auto">
                    {/* Imagen de portada */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60"></div>
                      {/* Patrón decorativo */}
                      <div 
                        className="absolute inset-0 opacity-10"
                        style={{
                          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                          backgroundSize: '32px 32px'
                        }}
                      />
                    </div>
                    
                    {/* Card flotante con perfil - Glass effect */}
                    <div className="px-4 -mt-24 relative z-10">
                      <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6">
                        {/* Avatar */}
                        <div className="text-center mb-4">
                          <div className="relative inline-block mb-3">
                            <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-green-400 to-emerald-500 border-4 border-white shadow-xl flex items-center justify-center text-4xl font-bold text-white">
                              R
                            </div>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            Restaurante Ejemplo
                          </h3>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Sabores auténticos y experiencias inolvidables desde 2015
                          </p>
                        </div>
                        
                        {/* Separador */}
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-gray-200"></div>
                          <div className="w-2 h-2 rounded-full bg-green-600"></div>
                          <div className="flex-1 h-px bg-gray-200"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Contenido principal */}
                    <div className="px-4 mt-4 space-y-4 pb-20">
                      {/* Botón de Menú */}
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg overflow-hidden">
                        <div className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
                              🍽️
                            </div>
                            <div>
                              <p className="text-white font-bold text-base">Nuestro Menú</p>
                              <p className="text-white/80 text-xs">Descubre nuestros platillos</p>
                            </div>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <span className="text-white text-lg">→</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Enlaces sociales */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-700 mb-3 px-1">Encuéntranos en</h4>
                        <div className="space-y-2">
                          {/* Enlace 1 */}
                          <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/30 overflow-hidden hover:shadow-xl transition-all">
                            <div className="p-3 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-lg">📱</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 truncate">Instagram</p>
                                <p className="text-xs text-gray-500 truncate">instagram.com</p>
                              </div>
                              <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-green-600 font-bold">→</span>
                              </div>
                            </div>
                            <div className="h-0.5 bg-gradient-to-r from-green-500 to-emerald-600 w-0"></div>
                          </div>
                          
                          {/* Enlace 2 */}
                          <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/30 overflow-hidden hover:shadow-xl transition-all">
                            <div className="p-3 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-lg">🌐</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 truncate">Sitio Web</p>
                                <p className="text-xs text-gray-500 truncate">restaurante.com</p>
                              </div>
                              <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-green-600 font-bold">→</span>
                              </div>
                            </div>
                            <div className="h-0.5 bg-gradient-to-r from-green-500 to-emerald-600 w-0"></div>
                          </div>
                          
                          {/* Enlace 3 */}
                          <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/30 overflow-hidden hover:shadow-xl transition-all">
                            <div className="p-3 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                                <span className="text-lg">📞</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm text-gray-900 truncate">WhatsApp</p>
                                <p className="text-xs text-gray-500 truncate">wa.me/restaurante</p>
                              </div>
                              <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs text-green-600 font-bold">→</span>
                              </div>
                            </div>
                            <div className="h-0.5 bg-gradient-to-r from-green-500 to-emerald-600 w-0"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer */}
                      <div className="pt-4 text-center border-t border-gray-200">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center">
                            <span className="text-xs">📱</span>
                          </div>
                          <p className="text-xs font-medium text-gray-500">Menú QR Digital</p>
                        </div>
                        <p className="text-xs text-gray-400">Powered by MenuQR</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Efectos de brillo */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-[3rem] pointer-events-none"></div>
            </div>
            
            {/* Texto descriptivo */}
            <div className="max-w-lg space-y-8">
              <div className="space-y-6">
                <div className="group p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <Smartphone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Página Completa del Restaurante
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Muestra tu imagen de portada, logo, descripción y enlaces sociales en una página profesional y atractiva.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="group p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <QrCode className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Acceso Instantáneo
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Con un simple escaneo del código QR, tus clientes acceden a toda la información de tu restaurante sin necesidad de descargar apps.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="group p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-white/30 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                      <Menu className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Todo en un Solo Lugar
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        Menú digital, enlaces sociales, información de contacto y más. Todo lo que tus clientes necesitan en una sola página.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Link
                  to="/register"
                  className="group inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all shadow-xl shadow-green-500/30 hover:shadow-2xl transform hover:scale-105"
                >
                  <span>Comenzar Gratis</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurantes Section */}
      {restaurantes.length > 0 && (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                Empresas que{' '}
                <span className="text-green-600">confían en nosotros</span>
              </h2>
              <p className="text-gray-600">
                Únete a restaurantes que ya están modernizando su servicio con MenuQR
              </p>
            </div>
            
            {/* Carrusel horizontal */}
            <div className="relative">
              <div className="overflow-x-auto scrollbar-hide pb-4">
                <div className="flex gap-4" style={{ width: 'max-content' }}>
                  {restaurantes.map((restaurante) => {
                    const clienteUrl = import.meta.env.VITE_CLIENTE_URL || 'http://localhost:4321';
                    const restauranteUrl = `${clienteUrl}/${restaurante.slug}`;
                    
                    return (
                      <a
                        key={restaurante.id}
                        href={restauranteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex-shrink-0 w-80 px-6 py-5 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors truncate">
                                  {restaurante.nombre}
                                </h3>
                                {restaurante.mostrarMenu && (
                                  <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium flex-shrink-0">
                                    Menú
                                  </span>
                                )}
                              </div>
                            </div>
                            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors flex-shrink-0 ml-2" />
                          </div>
                          
                          {restaurante.biografia && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-1">
                              {restaurante.biografia}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
                            {restaurante.ciudad && (
                              <div className="flex items-center">
                                <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                                <span className="truncate">{restaurante.ciudad}</span>
                              </div>
                            )}
                            {restaurante.pais && restaurante.ciudad !== restaurante.pais && (
                              <span className="truncate">{restaurante.pais}</span>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
              
              {/* Indicador de scroll */}
              <div className="flex items-center justify-center mt-6 text-xs text-gray-400">
                <span>Desliza para ver más →</span>
              </div>
            </div>

            {restaurantes.length >= 6 && (
              <div className="text-center mt-8">
                <a
                  href={import.meta.env.VITE_CLIENTE_URL || 'http://localhost:4321'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  <span>Ver todos los restaurantes</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas para tu restaurante
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Herramientas poderosas diseñadas para hacer crecer tu negocio
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group relative p-8 rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 hover:border-green-300/50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  {/* Efecto de brillo en hover */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 transition-all duration-300"></div>
                  
                  <div className="relative">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planes" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Elige el plan perfecto para ti
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Desde restaurantes pequeños hasta cadenas grandes, tenemos el plan ideal
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`group relative rounded-3xl border p-8 bg-white/70 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 ${
                  plan.popular
                    ? 'border-green-300/50 shadow-2xl scale-105 ring-2 ring-green-500/20'
                    : 'border-white/30 shadow-xl hover:shadow-2xl'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-green-500/30">
                      Más Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600">{plan.period}</span>
                    <span className="text-sm text-gray-500 ml-1">USD</span>
                  </div>
                  {plan.priceAnnual && (
                    <div className="text-sm text-gray-500 mb-2">
                      o {plan.priceAnnual}
                      {plan.periodAnnual}
                      <span className="text-gray-500 ml-1">USD</span>
                    </div>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation, limitationIndex) => (
                    <li key={limitationIndex} className="flex items-start">
                      <span className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-gray-400">×</span>
                      <span className="text-gray-500 line-through">{limitation}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`group block w-full text-center py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-green-500/30'
                      : 'bg-white/80 backdrop-blur-md border border-white/30 text-gray-900 hover:bg-white'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>{plan.cta}</span>
                    <ArrowRight className={`h-4 w-4 ${plan.popular ? 'group-hover:translate-x-1' : ''} transition-transform`} />
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background con gradiente animado */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        
        {/* Elementos decorativos */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-6">
            <span className="text-sm font-semibold text-white">Únete Ahora</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            ¿Listo para modernizar tu restaurante?
          </h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto leading-relaxed">
            Únete a cientos de restaurantes que ya están usando MenuQR
          </p>
          <Link
            to="/register"
            className="group inline-flex items-center space-x-2 px-10 py-5 bg-white text-green-600 rounded-xl text-lg font-bold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-2xl hover:shadow-3xl"
          >
            <span>Comenzar Ahora</span>
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <QrCode className="h-6 w-6 text-green-400" />
                <span className="text-lg font-bold text-white">MenuQR</span>
              </div>
              <p className="text-sm">
                La solución completa para menús digitales con códigos QR.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#planes" className="hover:text-white transition-colors">
                    Planes
                  </a>
                </li>
                <li>
                  <a href="#funcionalidades" className="hover:text-white transition-colors">
                    Funcionalidades
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Sobre Nosotros
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contacto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Cuenta</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Iniciar Sesión
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    Registrarse
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© {new Date().getFullYear()} MenuQR. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

