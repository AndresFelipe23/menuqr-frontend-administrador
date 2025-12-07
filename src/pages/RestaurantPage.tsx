import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { restaurantsService } from '../services';
import { suscripcionesService } from '../services/suscripciones.service';
import type { Restaurante, ActualizarRestauranteDto, Suscripcion } from '../types/api.types';
import ImageUpload from '../components/ImageUpload';
import {
  ClipboardList,
  Image,
  Palette,
  Settings,
  MapPin,
  Briefcase,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Info,
  Loader2,
  Sparkles,
  Globe,
  Save,
  RotateCcw,
  RefreshCw,
  Store,
  ExternalLink,
} from 'lucide-react';

export default function RestaurantPage() {
  const { user } = useAuth();
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [suscripcion, setSuscripcion] = useState<Suscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('basico');

  const [formData, setFormData] = useState<ActualizarRestauranteDto>({
    nombre: '',
    slug: '',
    correo: '',
    telefono: '',
    biografia: '',
    imagenPerfilUrl: '',
    imagenPortadaUrl: '',
    colorTema: '#000000',
    colorTexto: '#FFFFFF',
    colorFondo: '#FFFFFF',
    familiaFuente: 'Arial',
    mostrarMenu: true,
    mostrarEnlaces: true,
    mostrarContacto: true,
    habilitarPedidos: true,
    direccion: '',
    ciudad: '',
    estadoProvincia: '',
    pais: '',
    codigoPostal: '',
    latitud: undefined,
    longitud: undefined,
    zonaHoraria: 'UTC',
    moneda: 'USD',
    idioma: 'es',
    activo: true,
    estadoSuscripcion: 'trial',
  });

  useEffect(() => {
    loadRestaurante();
  }, [user?.restauranteId]);

  // Cargar suscripción después de que se carga el restaurante
  useEffect(() => {
    if (restaurante?.id) {
      loadSuscripcion();
    }
  }, [restaurante?.id]);

  const loadRestaurante = async () => {
    if (!user?.restauranteId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await restaurantsService.obtenerPorId(user.restauranteId);
      setRestaurante(data);
      
      // Llenar formulario con datos actuales
      setFormData({
        nombre: data.nombre || '',
        slug: data.slug || '',
        correo: data.correo || '',
        telefono: data.telefono || '',
        biografia: data.biografia || '',
        imagenPerfilUrl: data.imagenPerfilUrl || '',
        imagenPortadaUrl: data.imagenPortadaUrl || '',
        colorTema: data.colorTema || '#000000',
        colorTexto: data.colorTexto || '#FFFFFF',
        colorFondo: data.colorFondo || '#FFFFFF',
        familiaFuente: data.familiaFuente || 'Arial',
        mostrarMenu: data.mostrarMenu ?? true,
        mostrarEnlaces: data.mostrarEnlaces ?? true,
        mostrarContacto: data.mostrarContacto ?? true,
        habilitarPedidos: data.habilitarPedidos ?? true,
        direccion: data.direccion || '',
        ciudad: data.ciudad || '',
        estadoProvincia: data.estadoProvincia || '',
        pais: data.pais || '',
        codigoPostal: data.codigoPostal || '',
        latitud: data.latitud ?? undefined,
        longitud: data.longitud ?? undefined,
        zonaHoraria: data.zonaHoraria || 'UTC',
        moneda: data.moneda || 'USD',
        idioma: data.idioma || 'es',
        activo: data.activo ?? true,
        estadoSuscripcion: data.estadoSuscripcion || 'trial',
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar la información del restaurante');
    } finally {
      setLoading(false);
    }
  };

  const loadSuscripcion = async () => {
    if (!user?.restauranteId) {
      return;
    }

    try {
      const suscripcionData = await suscripcionesService.obtenerPorRestauranteId(user.restauranteId);
      setSuscripcion(suscripcionData);
      
      // Actualizar el estado de suscripción en el formulario con el valor real
      if (suscripcionData) {
        setFormData(prev => ({
          ...prev,
          estadoSuscripcion: suscripcionData.estado || 'trial',
        }));
        
        // Actualizar también el restaurante localmente si existe
        if (restaurante) {
          setRestaurante(prev => prev ? {
            ...prev,
            estadoSuscripcion: suscripcionData.estado || prev.estadoSuscripcion,
          } : null);
        }
      }
    } catch (err: any) {
      // Si no hay suscripción, es normal (usuario nuevo)
      setSuscripcion(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === 'number') {
      const numValue = value === '' ? undefined : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: numValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
    
    setError(null);
    setSuccess(null);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSlugFromNombre = () => {
    if (formData.nombre) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(prev.nombre || ''),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurante?.id) {
      setError('No se puede actualizar el restaurante: ID no encontrado');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updatedRestaurante = await restaurantsService.actualizar(restaurante.id, formData);
      setRestaurante(updatedRestaurante);
      
      // Recargar suscripción para actualizar el estado de suscripción
      await loadSuscripcion();
      
      setSuccess('Restaurante actualizado exitosamente');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el restaurante');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'basico', name: 'Información Básica', icon: ClipboardList },
    { id: 'perfil', name: 'Perfil Público', icon: Image },
    { id: 'tema', name: 'Personalización', icon: Palette },
    { id: 'pagina', name: 'Configuración', icon: Globe },
    { id: 'ubicacion', name: 'Ubicación', icon: MapPin },
    { id: 'negocio', name: 'Negocio', icon: Briefcase },
  ];

  // Construir URL pública del restaurante
  const getPublicUrl = () => {
    if (!restaurante?.slug) return null;
    // En desarrollo usa localhost:4321, en producción usar variable de entorno o dominio configurado
    const clienteBaseUrl = import.meta.env.VITE_CLIENTE_URL || 'http://localhost:4321';
    return `${clienteBaseUrl}/${restaurante.slug}`;
  };

  const handleViewPublic = () => {
    const publicUrl = getPublicUrl();
    if (publicUrl) {
      window.open(publicUrl, '_blank', 'noopener,noreferrer');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
          <p className="mt-4 text-sm text-gray-600">Cargando información del restaurante...</p>
        </div>
      </div>
    );
  }

  if (!user?.restauranteId) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No hay restaurante asociado</h3>
            <p className="mt-2 text-sm text-yellow-700">No tienes un restaurante asociado a tu cuenta.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurante) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar restaurante</h3>
            <p className="mt-2 text-sm text-red-700">{error || 'No se pudo cargar la información del restaurante'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header mejorado con glassmorphism */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl shadow-2xl p-8 text-white">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">Configuración del Restaurante</h1>
            </div>
            <p className="text-green-50 text-lg">
              Gestiona toda la información y configuración de tu restaurante
            </p>
            {restaurante.nombre && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30">
                <Store className="h-4 w-4" />
                <span className="font-semibold">{restaurante.nombre}</span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0 flex flex-col gap-3">
            <div className="bg-white/20 backdrop-blur-xl rounded-xl p-5 border border-white/30 shadow-xl">
              <div className="text-sm text-green-100 mb-2 font-medium">Estado del Restaurante</div>
              <div className="flex items-center space-x-3">
                <div className={`h-3 w-3 rounded-full ${restaurante.activo ? 'bg-green-300' : 'bg-red-300'} shadow-lg ${restaurante.activo ? 'animate-pulse' : ''}`}></div>
                <span className="font-bold text-lg">{restaurante.activo ? 'Activo' : 'Inactivo'}</span>
              </div>
            </div>
            {restaurante.slug && (
              <button
                type="button"
                onClick={handleViewPublic}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 shadow-xl text-white font-semibold hover:bg-white/30 transition-all duration-200 hover:scale-105"
                title="Ver vista pública del restaurante"
              >
                <ExternalLink className="h-5 w-5" />
                <span>Ver Vista Pública</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mensajes de éxito/error mejorados con glassmorphism */}
      {success && (
        <div className="rounded-xl bg-green-50/80 backdrop-blur-sm border border-green-200/50 p-4 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="ml-3 text-sm font-semibold text-green-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-200/50 p-4 shadow-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="ml-3 text-sm font-semibold text-red-800">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Navegación por secciones con glassmorphism */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
            <nav className="flex overflow-x-auto scrollbar-hide" aria-label="Tabs">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`relative px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? 'text-green-700 bg-gradient-to-br from-green-50 to-emerald-50'
                        : 'text-gray-600 hover:text-green-600 hover:bg-gray-50/50'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                    )}
                    <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>{section.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Contenido de las secciones */}
          <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50/30 to-white/50">
            {/* Sección: Información Básica */}
            {activeSection === 'basico' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <Info className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Información Básica</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre del Restaurante <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        id="nombre"
                        required
                        value={formData.nombre}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all bg-white/80"
                        placeholder="Ej: Mi Restaurante"
                      />
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="slug" className="block text-sm font-semibold text-gray-700 mb-2">
                        Slug (URL única) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          name="slug"
                          id="slug"
                          required
                          pattern="^[a-z0-9-]+$"
                          value={formData.slug}
                          onChange={handleChange}
                          className="flex-1 block px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm font-mono transition-all bg-white/80"
                          placeholder="mi-restaurante"
                        />
                        <button
                          type="button"
                          onClick={handleSlugFromNombre}
                          className="inline-flex items-center px-4 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-green-50 hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Generar
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Solo letras minúsculas, números y guiones</p>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="correo" className="block text-sm font-semibold text-gray-700 mb-2">
                        Correo Electrónico <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="correo"
                        id="correo"
                        required
                        value={formData.correo}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all bg-white/80"
                        placeholder="contacto@restaurante.com"
                      />
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="telefono" className="block text-sm font-semibold text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="text"
                        name="telefono"
                        id="telefono"
                        value={formData.telefono || ''}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all bg-white/80"
                        placeholder="+57 300 123 4567"
                      />
                    </div>

                    <div className="sm:col-span-2 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="biografia" className="block text-sm font-semibold text-gray-700 mb-2">
                        Biografía / Descripción
                      </label>
                      <textarea
                        name="biografia"
                        id="biografia"
                        rows={4}
                        maxLength={1000}
                        value={formData.biografia || ''}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all resize-y bg-white/80"
                        placeholder="Describe tu restaurante..."
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        {(formData.biografia || '').length}/1000 caracteres
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Perfil Público */}
            {activeSection === 'perfil' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <Image className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Perfil Público</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div>
                      <ImageUpload
                        value={formData.imagenPerfilUrl || null}
                        onChange={(url) => {
                          setFormData(prev => ({ ...prev, imagenPerfilUrl: url }));
                        }}
                        onRemove={() => {
                          setFormData(prev => ({ ...prev, imagenPerfilUrl: '' }));
                        }}
                        subfolder="perfil"
                        label="Imagen de Perfil"
                        previewSize="medium"
                        shape="circle"
                        allowUrlInput={true}
                      />
                    </div>

                    <div>
                      <ImageUpload
                        value={formData.imagenPortadaUrl || null}
                        onChange={(url) => {
                          setFormData(prev => ({ ...prev, imagenPortadaUrl: url }));
                        }}
                        onRemove={() => {
                          setFormData(prev => ({ ...prev, imagenPortadaUrl: '' }));
                        }}
                        subfolder="portada"
                        label="Imagen de Portada"
                        previewSize="large"
                        shape="square"
                        allowUrlInput={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Personalización */}
            {activeSection === 'tema' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Personalización y Tema</h3>
                  </div>
                  
                  {/* Preview del tema mejorado */}
                  <div className="mb-6 p-8 rounded-2xl border-2 border-dashed border-gray-300/50 bg-white/50 backdrop-blur-sm shadow-lg" style={{ backgroundColor: formData.colorFondo }}>
                    <div className="text-center">
                      <div className="inline-block mb-4">
                        {formData.imagenPerfilUrl ? (
                          <img
                            src={formData.imagenPerfilUrl}
                            alt="Perfil"
                            className="h-20 w-20 rounded-full object-cover border-4 shadow-lg"
                            style={{ borderColor: formData.colorTema }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div
                            className="h-20 w-20 rounded-full mx-auto border-4 shadow-lg flex items-center justify-center text-2xl font-bold"
                            style={{ backgroundColor: formData.colorTema, borderColor: formData.colorTema, color: formData.colorTexto }}
                          >
                            {formData.nombre?.charAt(0)?.toUpperCase() || 'R'}
                          </div>
                        )}
                      </div>
                      <h3 className="text-xl font-bold mb-2" style={{ color: formData.colorTema, fontFamily: formData.familiaFuente }}>
                        {formData.nombre || 'Nombre del Restaurante'}
                      </h3>
                      <p className="text-sm" style={{ color: formData.colorTexto, fontFamily: formData.familiaFuente }}>
                        {formData.biografia || 'Descripción del restaurante'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="colorTema" className="block text-sm font-semibold text-gray-700 mb-2">
                        Color de Tema
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          name="colorTema"
                          id="colorTema"
                          value={formData.colorTema}
                          onChange={handleChange}
                          className="h-12 w-16 border-2 border-gray-300 rounded-lg cursor-pointer shadow-sm hover:border-green-400 transition-colors"
                        />
                        <input
                          type="text"
                          value={formData.colorTema}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                              setFormData(prev => ({ ...prev, colorTema: e.target.value }));
                            }
                          }}
                          className="flex-1 block px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm font-mono transition-all bg-white/80"
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="colorTexto" className="block text-sm font-semibold text-gray-700 mb-2">
                        Color de Texto
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          name="colorTexto"
                          id="colorTexto"
                          value={formData.colorTexto}
                          onChange={handleChange}
                          className="h-12 w-16 border-2 border-gray-300 rounded-lg cursor-pointer shadow-sm hover:border-green-400 transition-colors"
                        />
                        <input
                          type="text"
                          value={formData.colorTexto}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                              setFormData(prev => ({ ...prev, colorTexto: e.target.value }));
                            }
                          }}
                          className="flex-1 block px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm font-mono transition-all bg-white/80"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="colorFondo" className="block text-sm font-semibold text-gray-700 mb-2">
                        Color de Fondo
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          name="colorFondo"
                          id="colorFondo"
                          value={formData.colorFondo}
                          onChange={handleChange}
                          className="h-12 w-16 border-2 border-gray-300 rounded-lg cursor-pointer shadow-sm hover:border-green-400 transition-colors"
                        />
                        <input
                          type="text"
                          value={formData.colorFondo}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                              setFormData(prev => ({ ...prev, colorFondo: e.target.value }));
                            }
                          }}
                          className="flex-1 block px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm font-mono transition-all bg-white/80"
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="familiaFuente" className="block text-sm font-semibold text-gray-700 mb-2">
                        Familia de Fuente
                      </label>
                      <select
                        name="familiaFuente"
                        id="familiaFuente"
                        value={formData.familiaFuente}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Configuración de Página */}
            {activeSection === 'pagina' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Configuración de Página</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="relative flex items-center p-5 rounded-xl border-2 border-gray-200/50 hover:border-green-300 bg-white/70 backdrop-blur-sm cursor-pointer transition-all shadow-sm hover:shadow-md">
                      <input
                        type="checkbox"
                        name="mostrarMenu"
                        checked={formData.mostrarMenu ?? true}
                        onChange={handleChange}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-semibold text-gray-900">Mostrar Menú</span>
                        <span className="block text-xs text-gray-500">Mostrar sección de menú</span>
                      </div>
                    </label>

                    <label className="relative flex items-center p-5 rounded-xl border-2 border-gray-200/50 hover:border-green-300 bg-white/70 backdrop-blur-sm cursor-pointer transition-all shadow-sm hover:shadow-md">
                      <input
                        type="checkbox"
                        name="mostrarEnlaces"
                        checked={formData.mostrarEnlaces ?? true}
                        onChange={handleChange}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-semibold text-gray-900">Mostrar Enlaces</span>
                        <span className="block text-xs text-gray-500">Mostrar enlaces sociales</span>
                      </div>
                    </label>

                    <label className="relative flex items-center p-5 rounded-xl border-2 border-gray-200/50 hover:border-green-300 bg-white/70 backdrop-blur-sm cursor-pointer transition-all shadow-sm hover:shadow-md">
                      <input
                        type="checkbox"
                        name="mostrarContacto"
                        checked={formData.mostrarContacto ?? true}
                        onChange={handleChange}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-semibold text-gray-900">Mostrar Contacto</span>
                        <span className="block text-xs text-gray-500">Mostrar información de contacto</span>
                      </div>
                    </label>

                    <label className="relative flex items-center p-5 rounded-xl border-2 border-gray-200/50 hover:border-green-300 bg-white/70 backdrop-blur-sm cursor-pointer transition-all shadow-sm hover:shadow-md">
                      <input
                        type="checkbox"
                        name="habilitarPedidos"
                        checked={formData.habilitarPedidos ?? true}
                        onChange={handleChange}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-semibold text-gray-900">Habilitar Pedidos</span>
                        <span className="block text-xs text-gray-500">Permitir que los clientes hagan pedidos en línea</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Ubicación */}
            {activeSection === 'ubicacion' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Ubicación</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="sm:col-span-2 bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="direccion" className="block text-sm font-semibold text-gray-700 mb-2">
                        Dirección
                      </label>
                      <input
                        type="text"
                        name="direccion"
                        id="direccion"
                        value={formData.direccion || ''}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all bg-white/80"
                        placeholder="Calle 123 #45-67"
                      />
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="ciudad" className="block text-sm font-semibold text-gray-700 mb-2">
                        Ciudad
                      </label>
                      <input
                        type="text"
                        name="ciudad"
                        id="ciudad"
                        value={formData.ciudad || ''}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all bg-white/80"
                        placeholder="Montería"
                      />
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="estadoProvincia" className="block text-sm font-semibold text-gray-700 mb-2">
                        Estado / Provincia
                      </label>
                      <input
                        type="text"
                        name="estadoProvincia"
                        id="estadoProvincia"
                        value={formData.estadoProvincia || ''}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all bg-white/80"
                        placeholder="Córdoba"
                      />
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="pais" className="block text-sm font-semibold text-gray-700 mb-2">
                        País
                      </label>
                      <input
                        type="text"
                        name="pais"
                        id="pais"
                        value={formData.pais || ''}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all bg-white/80"
                        placeholder="Colombia"
                      />
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="codigoPostal" className="block text-sm font-semibold text-gray-700 mb-2">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        name="codigoPostal"
                        id="codigoPostal"
                        value={formData.codigoPostal || ''}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all bg-white/80"
                        placeholder="230001"
                      />
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="latitud" className="block text-sm font-semibold text-gray-700 mb-2">
                        Latitud
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="latitud"
                        id="latitud"
                        value={formData.latitud ?? ''}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all bg-white/80"
                        placeholder="Ej: 8.7500"
                      />
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="longitud" className="block text-sm font-semibold text-gray-700 mb-2">
                        Longitud
                      </label>
                      <input
                        type="number"
                        step="any"
                        name="longitud"
                        id="longitud"
                        value={formData.longitud ?? ''}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all bg-white/80"
                        placeholder="Ej: -75.8814"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sección: Configuración de Negocio */}
            {activeSection === 'negocio' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Configuración de Negocio</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="zonaHoraria" className="block text-sm font-semibold text-gray-700 mb-2">
                        Zona Horaria
                      </label>
                      <select
                        name="zonaHoraria"
                        id="zonaHoraria"
                        value={formData.zonaHoraria}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/Bogota">America/Bogota (Colombia)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Mexico_City">America/Mexico_City</option>
                        <option value="America/Buenos_Aires">America/Buenos_Aires</option>
                      </select>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="moneda" className="block text-sm font-semibold text-gray-700 mb-2">
                        Moneda
                      </label>
                      <select
                        name="moneda"
                        id="moneda"
                        value={formData.moneda}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                      >
                        <option value="USD">USD - Dólar Estadounidense</option>
                        <option value="COP">COP - Peso Colombiano</option>
                        <option value="MXN">MXN - Peso Mexicano</option>
                        <option value="ARS">ARS - Peso Argentino</option>
                        <option value="EUR">EUR - Euro</option>
                      </select>
                    </div>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="idioma" className="block text-sm font-semibold text-gray-700 mb-2">
                        Idioma
                      </label>
                      <select
                        name="idioma"
                        id="idioma"
                        value={formData.idioma}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Estado */}
                <div className="border-t border-gray-200/50 pt-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Estado</h4>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <label className="relative flex items-center p-5 rounded-xl border-2 border-gray-200/50 hover:border-green-300 bg-white/70 backdrop-blur-sm cursor-pointer transition-all shadow-sm hover:shadow-md">
                      <input
                        type="checkbox"
                        name="activo"
                        checked={formData.activo ?? true}
                        onChange={handleChange}
                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-semibold text-gray-900">Restaurante Activo</span>
                        <span className="block text-xs text-gray-500">Activar o desactivar el restaurante</span>
                      </div>
                    </label>

                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                      <label htmlFor="estadoSuscripcion" className="block text-sm font-semibold text-gray-700 mb-2">
                        Estado de Suscripción
                      </label>
                      {suscripcion ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200/50">
                              Plan: {suscripcion.tipoPlan.toUpperCase()}
                            </span>
                            <span className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold ${
                              suscripcion.estado === 'active' 
                                ? 'bg-green-100 text-green-800 border border-green-200/50'
                                : suscripcion.estado === 'cancelled'
                                ? 'bg-red-100 text-red-800 border border-red-200/50'
                                : suscripcion.estado === 'past_due'
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200/50'
                                : 'bg-gray-100 text-gray-800 border border-gray-200/50'
                            }`}>
                              {suscripcion.estado === 'active' ? 'Activa' :
                               suscripcion.estado === 'cancelled' ? 'Cancelada' :
                               suscripcion.estado === 'past_due' ? 'Vencida' :
                               suscripcion.estado === 'trialing' ? 'Prueba' :
                               suscripcion.estado}
                            </span>
                          </div>
                          {suscripcion.finPeriodoActual && (
                            <p className="text-sm text-gray-600 font-medium">
                              Renovación: {new Date(suscripcion.finPeriodoActual).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              loadSuscripcion();
                              loadRestaurante();
                            }}
                            className="text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-2 transition-colors"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Actualizar Estado
                          </button>
                        </div>
                      ) : (
                        <select
                          name="estadoSuscripcion"
                          id="estadoSuscripcion"
                          value={formData.estadoSuscripcion}
                          onChange={handleChange}
                          className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                        >
                          <option value="trial">Trial</option>
                          <option value="active">Activa</option>
                          <option value="cancelled">Cancelada</option>
                          <option value="past_due">Vencida</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción fijos mejorados */}
        <div className="sticky bottom-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 px-6 py-4 shadow-2xl rounded-2xl">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={loadRestaurante}
              className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
