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
  GripVertical,
  TrendingUp,
} from 'lucide-react';
import ImageUpload from '../components/ImageUpload';

// Mapa de iconos predefinidos para redes sociales
const ICONOS_REDES_SOCIALES: Record<string, string> = {
  facebook: 'https://cdn.simpleicons.org/facebook/1877F2',
  instagram: 'https://cdn.simpleicons.org/instagram/E4405F',
  twitter: 'https://cdn.simpleicons.org/twitter/1DA1F2', // Mantener para compatibilidad
  x: 'https://cdn.simpleicons.org/x/000000', // X (anteriormente Twitter)
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
        // Para inputs tipo number, convertir a número o undefined si está vacío
        const numValue = value === '' ? undefined : parseInt(value, 10);
        newValue = isNaN(numValue!) ? undefined : numValue;
      } else {
        // Para otros campos, mantener como string o undefined si está vacío
        newValue = value === '' ? undefined : value;
      }

      // Si se cambia el tipo de icono, asignar automáticamente la URL del icono
      if (name === 'tipoIcono' && value && value !== 'custom') {
        const iconoUrl = ICONOS_REDES_SOCIALES[value];
        if (iconoUrl) {
          console.log(`Asignando icono para ${value}: ${iconoUrl}`);
          return {
            ...prev,
            [name]: newValue,
            iconoUrl: iconoUrl,
          };
        } else {
          console.warn(`No se encontró icono para: ${value}`);
        }
      }

      // Si se selecciona "custom", limpiar el iconoUrl para que el usuario pueda ingresar uno personalizado
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

      // Preparar datos para enviar, convirtiendo tipos y limpiando campos vacíos
      const datosEnviar: any = {
        restauranteId: user.restauranteId,
        titulo: (formData.titulo || '').trim(),
        url: (formData.url || '').trim(),
      };

      // Solo incluir campos opcionales si tienen valor
      if (formData.iconoUrl?.trim()) {
        datosEnviar.iconoUrl = formData.iconoUrl.trim();
      }

      if (formData.tipoIcono?.trim()) {
        datosEnviar.tipoIcono = formData.tipoIcono.trim();
      }

      // Convertir ordenVisualizacion a número solo si tiene valor
      if (formData.ordenVisualizacion !== undefined && formData.ordenVisualizacion !== null) {
        const ordenNum = typeof formData.ordenVisualizacion === 'number' 
          ? formData.ordenVisualizacion 
          : parseInt(String(formData.ordenVisualizacion), 10);
        if (!isNaN(ordenNum) && ordenNum >= 0) {
          datosEnviar.ordenVisualizacion = ordenNum;
        }
      } else if (!editingEnlace) {
        // Solo asignar orden automático al crear, no al actualizar
        datosEnviar.ordenVisualizacion = enlaces.length + 1;
      }

      // Incluir activo solo si es diferente del valor por defecto o si está editando
      if (formData.activo !== undefined) {
        datosEnviar.activo = formData.activo;
      }

      if (editingEnlace) {
        // Actualizar - remover restauranteId del objeto para actualizar
        const { restauranteId, ...datosActualizar } = datosEnviar;
        await enlacesService.actualizar(editingEnlace.id, datosActualizar);
        setSuccess('Enlace actualizado exitosamente');
      } else {
        // Crear
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enlaces del Restaurante</h1>
            <p className="mt-1 text-sm text-gray-500">Gestiona los enlaces sociales y de contacto de tu restaurante</p>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingEnlace(null);
                resetForm();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Enlace
            </button>
          )}
        </div>
      </div>

      {/* Mensajes de éxito/error */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800">Éxito</p>
            <p className="text-sm text-green-700">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-400 hover:text-green-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white sm:text-sm transition-colors"
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
                  <p className="mt-1 text-xs text-gray-500">
                    ✓ Icono predefinido asignado automáticamente
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Auto (siguiente orden disponible)"
                />
              </div>

              <div className="flex items-end">
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors w-full">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo ?? true}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Enlace Activo</span>
                    <span className="block text-xs text-gray-500">Mostrar en la página pública</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={cancelForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Lista de enlaces */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
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
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Enlace
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {enlaces.map((enlace) => (
              <li key={enlace.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <GripVertical className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    {enlace.iconoUrl && (
                      <div className="flex-shrink-0 mr-3">
                        <img
                          src={enlace.iconoUrl}
                          alt={enlace.tipoIcono || 'Icono'}
                          className="h-8 w-8 rounded object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">{enlace.titulo}</p>
                        {!enlace.activo && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Inactivo
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <Link2 className="h-4 w-4 mr-1 flex-shrink-0" />
                        <a
                          href={enlace.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:text-indigo-600 flex items-center"
                        >
                          {enlace.url}
                          <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                        </a>
                      </div>
                      {enlace.tipoIcono && (
                        <p className="mt-1 text-xs text-gray-500">Tipo: {enlace.tipoIcono}</p>
                      )}
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        <span>{enlace.contadorClics} clics</span>
                        <span className="mx-2">•</span>
                        <span>Orden: {enlace.ordenVisualizacion}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleActivo(enlace)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={enlace.activo ? 'Desactivar' : 'Activar'}
                    >
                      {enlace.activo ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(enlace)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(enlace.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

