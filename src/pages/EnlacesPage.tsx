import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { enlacesService } from '../services';
import type { EnlaceRestaurante, CrearEnlaceDto, ActualizarEnlaceDto } from '../types/api.types';
import {
  Plus,
  Edit2,
  Trash2,
  Link2,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  MoveUp,
  MoveDown,
  Globe,
  BarChart3,
} from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

// Mapa de iconos predefinidos para redes sociales
const ICONOS_REDES_SOCIALES: Record<string, string> = {
  facebook: 'https://cdn.simpleicons.org/facebook/1877F2',
  instagram: 'https://cdn.simpleicons.org/instagram/E4405F',
  twitter: 'https://cdn.simpleicons.org/twitter/1DA1F2',
  x: 'https://cdn.simpleicons.org/x/000000',
  whatsapp: 'https://cdn.simpleicons.org/whatsapp/25D366',
  youtube: 'https://cdn.simpleicons.org/youtube/FF0000',
  tiktok: 'https://cdn.simpleicons.org/tiktok/000000',
  linkedin: 'https://cdn.simpleicons.org/linkedin/0A66C2',
  pinterest: 'https://cdn.simpleicons.org/pinterest/BD081C',
  snapchat: 'https://cdn.simpleicons.org/snapchat/FFFC00',
  telegram: 'https://cdn.simpleicons.org/telegram/26A5E4',
  discord: 'https://cdn.simpleicons.org/discord/5865F2',
  twitch: 'https://cdn.simpleicons.org/twitch/9146FF',
  spotify: 'https://cdn.simpleicons.org/spotify/1DB954',
  apple: 'https://cdn.simpleicons.org/applemusic/FA243C',
  google: 'https://cdn.simpleicons.org/google/4285F4',
  googlemaps: 'https://cdn.simpleicons.org/googlemaps/4285F4',
};

export default function EnlacesPage() {
  const { user } = useAuth();
  const [enlaces, setEnlaces] = useState<EnlaceRestaurante[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEnlace, setEditingEnlace] = useState<EnlaceRestaurante | null>(null);

  const [formData, setFormData] = useState<Partial<CrearEnlaceDto & ActualizarEnlaceDto>>({
    titulo: '',
    url: '',
    iconoUrl: '',
    tipoIcono: '',
    ordenVisualizacion: 0,
    activo: true,
  });

  useEffect(() => {
    if (user?.restauranteId) {
      loadEnlaces();
    }
  }, [user?.restauranteId]);

  const loadEnlaces = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await enlacesService.obtenerPorRestauranteId(user.restauranteId);
      // Ordenar por ordenVisualizacion
      const sorted = data.sort((a, b) => a.ordenVisualizacion - b.ordenVisualizacion);
      setEnlaces(sorted);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los enlaces');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => {
      let newValue: any;

      if (type === 'checkbox') {
        newValue = checked;
      } else if (type === 'number') {
        const numValue = value === '' ? undefined : parseInt(value, 10);
        newValue = isNaN(numValue!) ? undefined : numValue;
      } else {
        newValue = value === '' ? undefined : value;
      }

      if (name === 'tipoIcono' && value && value !== 'custom') {
        const iconoUrl = ICONOS_REDES_SOCIALES[value];
        if (iconoUrl) {
          return {
            ...prev,
            [name]: newValue,
            iconoUrl: iconoUrl,
          };
        }
      }

      if (name === 'tipoIcono' && value === 'custom') {
        return {
          ...prev,
          [name]: newValue,
          iconoUrl: '',
        };
      }

      return {
        ...prev,
        [name]: newValue,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.restauranteId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const datosEnviar: any = {
        restauranteId: user.restauranteId,
        titulo: (formData.titulo || '').trim(),
        url: (formData.url || '').trim(),
      };

      if (formData.iconoUrl?.trim()) {
        datosEnviar.iconoUrl = formData.iconoUrl.trim();
      }

      if (formData.tipoIcono?.trim()) {
        datosEnviar.tipoIcono = formData.tipoIcono.trim();
      }

      if (formData.ordenVisualizacion !== undefined && formData.ordenVisualizacion !== null) {
        const ordenNum = typeof formData.ordenVisualizacion === 'number' 
          ? formData.ordenVisualizacion 
          : parseInt(String(formData.ordenVisualizacion), 10);
        if (!isNaN(ordenNum) && ordenNum >= 0) {
          datosEnviar.ordenVisualizacion = ordenNum;
        }
      } else if (!editingEnlace) {
        datosEnviar.ordenVisualizacion = enlaces.length + 1;
      }

      if (formData.activo !== undefined) {
        datosEnviar.activo = formData.activo;
      }

      if (editingEnlace) {
        const { restauranteId, ...datosActualizar } = datosEnviar;
        await enlacesService.actualizar(editingEnlace.id, datosActualizar);
        setSuccess('Enlace actualizado exitosamente');
      } else {
        await enlacesService.crear(datosEnviar);
        setSuccess('Enlace creado exitosamente');
      }

      setShowForm(false);
      setEditingEnlace(null);
      resetForm();
      loadEnlaces();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el enlace');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (enlace: EnlaceRestaurante) => {
    setEditingEnlace(enlace);
    setFormData({
      titulo: enlace.titulo,
      url: enlace.url,
      iconoUrl: enlace.iconoUrl || '',
      tipoIcono: enlace.tipoIcono || '',
      ordenVisualizacion: enlace.ordenVisualizacion,
      activo: enlace.activo,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este enlace?')) return;

    try {
      setError(null);
      await enlacesService.eliminar(id);
      setSuccess('Enlace eliminado exitosamente');
      loadEnlaces();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el enlace');
    }
  };

  const handleToggleActivo = async (enlace: EnlaceRestaurante) => {
    try {
      setError(null);
      await enlacesService.actualizar(enlace.id, { activo: !enlace.activo });
      setSuccess(`Enlace ${enlace.activo ? 'desactivado' : 'activado'} exitosamente`);
      loadEnlaces();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el enlace');
    }
  };

  const handleMoveOrder = async (enlace: EnlaceRestaurante, direction: 'up' | 'down') => {
    const currentIndex = enlaces.findIndex(e => e.id === enlace.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= enlaces.length) return;

    const targetEnlace = enlaces[newIndex];
    const newOrder = targetEnlace.ordenVisualizacion;

    try {
      await enlacesService.actualizar(enlace.id, { ordenVisualizacion: newOrder });
      await enlacesService.actualizar(targetEnlace.id, { ordenVisualizacion: enlace.ordenVisualizacion });
      loadEnlaces();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el orden');
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      url: '',
      iconoUrl: '',
      tipoIcono: '',
      ordenVisualizacion: 0,
      activo: true,
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingEnlace(null);
    resetForm();
  };

  const getTotalClics = () => {
    return enlaces.reduce((sum, enlace) => sum + (enlace.contadorClics || 0), 0);
  };

  const getEnlacesActivos = () => {
    return enlaces.filter(e => e.activo);
  };

  if (!user?.restauranteId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No tienes un restaurante asociado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-green-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg w-fit">
              <Link2 className="h-10 w-10 sm:h-14 sm:w-14 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Enlaces del Restaurante</h1>
                {!loading && enlaces.length > 0 && (
                  <span className="px-2 sm:px-3 py-1 bg-green-600 text-white text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap">
                    {enlaces.length}
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600">Gestiona los enlaces sociales y de contacto de tu restaurante</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingEnlace(null);
                resetForm();
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="whitespace-nowrap">Nuevo Enlace</span>
            </button>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      {enlaces.length > 0 && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                <Link2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total de Enlaces</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{enlaces.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Enlaces Activos</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{getEnlacesActivos().length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total de Clics</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{getTotalClics()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensajes de éxito/error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 ml-2"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Éxito</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-400 hover:text-green-600 ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
            {editingEnlace ? 'Editar Enlace' : 'Nuevo Enlace'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  name="titulo"
                  id="titulo"
                  required
                  value={formData.titulo}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Ej: Síguenos en Facebook"
                />
              </div>

              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  URL *
                </label>
                <input
                  type="url"
                  name="url"
                  id="url"
                  required
                  value={formData.url}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="https://facebook.com/tu-restaurante"
                />
              </div>

              <div>
                <label htmlFor="tipoIcono" className="block text-sm font-medium text-gray-700 mb-2">
                  Red Social / Tipo de Icono
                </label>
                <select
                  name="tipoIcono"
                  id="tipoIcono"
                  value={formData.tipoIcono || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white sm:text-sm transition-colors"
                >
                  <option value="">Seleccionar...</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="x">X (anteriormente Twitter)</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="youtube">YouTube</option>
                  <option value="tiktok">TikTok</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="pinterest">Pinterest</option>
                  <option value="snapchat">Snapchat</option>
                  <option value="telegram">Telegram</option>
                  <option value="discord">Discord</option>
                  <option value="twitch">Twitch</option>
                  <option value="spotify">Spotify</option>
                  <option value="apple">Apple Music</option>
                  <option value="google">Google</option>
                  <option value="googlemaps">Google Maps</option>
                  <option value="custom">Personalizado</option>
                </select>
                {formData.tipoIcono && formData.tipoIcono !== 'custom' && (
                  <p className="mt-1 text-xs text-green-600 flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Icono predefinido asignado automáticamente
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="iconoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Icono {formData.tipoIcono && formData.tipoIcono !== 'custom' && '(Auto - Predefinido)'}
                </label>
                {formData.tipoIcono && formData.tipoIcono !== 'custom' ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {formData.iconoUrl && (
                        <img
                          src={formData.iconoUrl}
                          alt="Icono predefinido"
                          className="h-10 w-10 rounded object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Icono de {formData.tipoIcono}
                        </p>
                        <p className="text-xs text-gray-500">
                          Se asigna automáticamente. Selecciona "Personalizado" para usar tu propio icono.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ImageUpload
                    value={formData.iconoUrl || null}
                    onChange={(url) => {
                      setFormData(prev => ({ ...prev, iconoUrl: url }));
                    }}
                    onRemove={() => {
                      setFormData(prev => ({ ...prev, iconoUrl: '' }));
                    }}
                    subfolder="enlaces"
                    label=""
                    previewSize="small"
                    shape="square"
                    allowUrlInput={true}
                  />
                )}
              </div>

              <div>
                <label htmlFor="ordenVisualizacion" className="block text-sm font-medium text-gray-700 mb-2">
                  Orden de Visualización
                </label>
                <input
                  type="number"
                  name="ordenVisualizacion"
                  id="ordenVisualizacion"
                  min="0"
                  value={formData.ordenVisualizacion ?? ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Auto (siguiente orden disponible)"
                />
              </div>

              <div className="flex items-end">
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors w-full">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo ?? true}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Enlace Activo</span>
                    <span className="block text-xs text-gray-500">Mostrar en la página pública</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={cancelForm}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Guardando...
                  </>
                ) : (
                  <>
                    {editingEnlace ? 'Actualizar' : 'Crear'} Enlace
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de enlaces - Vista mejorada con cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-green-600" />
        </div>
      ) : enlaces.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Link2 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No hay enlaces</h3>
          <p className="mt-2 text-sm text-gray-500">Comienza agregando tu primer enlace social o de contacto.</p>
          <div className="mt-6">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingEnlace(null);
                resetForm();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Enlace
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Grid de cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {enlaces.map((enlace, index) => (
              <div
                key={enlace.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md ${
                  enlace.activo ? 'border-gray-200' : 'border-gray-300 opacity-75'
                }`}
              >
                <div className="p-5">
                  {/* Header del card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {enlace.iconoUrl && (
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                            <img
                              src={enlace.iconoUrl}
                              alt={enlace.tipoIcono || 'Icono'}
                              className="h-8 w-8 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{enlace.titulo}</h3>
                        {enlace.tipoIcono && (
                          <p className="text-xs text-gray-500 capitalize">{enlace.tipoIcono}</p>
                        )}
                      </div>
                    </div>
                    {!enlace.activo && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inactivo
                      </span>
                    )}
                  </div>

                  {/* URL */}
                  <div className="mb-4">
                    <a
                      href={enlace.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-600 hover:text-green-600 flex items-center truncate"
                    >
                      <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{enlace.url}</span>
                      <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                    </a>
                  </div>

                  {/* Estadísticas */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>{enlace.contadorClics || 0} clics</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Orden: {enlace.ordenVisualizacion}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-center sm:justify-start space-x-1">
                      <button
                        onClick={() => handleMoveOrder(enlace, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover arriba"
                      >
                        <MoveUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(enlace, 'down')}
                        disabled={index === enlaces.length - 1}
                        className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover abajo"
                      >
                        <MoveDown className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-center sm:justify-end space-x-1">
                      <button
                        onClick={() => handleToggleActivo(enlace)}
                        className={`p-1.5 transition-colors ${
                          enlace.activo
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={enlace.activo ? 'Desactivar' : 'Activar'}
                      >
                        {enlace.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(enlace)}
                        className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(enlace.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vista previa de cómo se verá en público */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Vista Previa</h3>
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              Así se verán tus enlaces en la página pública del restaurante:
            </p>
            <div className="space-y-2 max-w-md mx-auto sm:mx-0">
              {getEnlacesActivos().slice(0, 3).map((enlace) => (
                <div
                  key={enlace.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-green-300 transition-colors"
                >
                  {enlace.iconoUrl && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-200">
                      <img
                        src={enlace.iconoUrl}
                        alt={enlace.titulo}
                        className="h-6 w-6 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{enlace.titulo}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {new URL(enlace.url).hostname.replace('www.', '')}
                    </p>
                  </div>
                </div>
              ))}
              {getEnlacesActivos().length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No hay enlaces activos para mostrar
                </p>
              )}
              {getEnlacesActivos().length > 3 && (
                <p className="text-xs text-gray-500 text-center py-2">
                  +{getEnlacesActivos().length - 3} enlaces más
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
