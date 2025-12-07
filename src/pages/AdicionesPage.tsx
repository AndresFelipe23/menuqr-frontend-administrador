import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { adicionesService } from '../services';
import type { Adicion, CrearAdicionDto, ActualizarAdicionDto } from '../types/api.types';
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  GripVertical,
  DollarSign,
} from 'lucide-react';

export default function AdicionesPage() {
  const { user } = useAuth();
  const [adiciones, setAdiciones] = useState<Adicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAdicion, setEditingAdicion] = useState<Adicion | null>(null);

  const [formData, setFormData] = useState<Partial<CrearAdicionDto & ActualizarAdicionDto>>({
    nombre: '',
    descripcion: '',
    precio: 0,
    esObligatorio: false,
    maximoSelecciones: 1,
    ordenVisualizacion: 0,
    activa: true,
  });

  useEffect(() => {
    if (user?.restauranteId) {
      loadAdiciones();
    }
  }, [user?.restauranteId]);

  const loadAdiciones = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await adicionesService.obtenerPorRestauranteId(user.restauranteId);
      // Ordenar por ordenVisualizacion
      const sorted = data.sort((a, b) => a.ordenVisualizacion - b.ordenVisualizacion);
      setAdiciones(sorted);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las adiciones');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        return { ...prev, [name]: checked };
      }
      if (name === 'precio' || name === 'maximoSelecciones' || name === 'ordenVisualizacion') {
        return { ...prev, [name]: value === '' ? undefined : parseFloat(value) };
      }
      return { ...prev, [name]: value };
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
        nombre: formData.nombre.trim(),
        precio: formData.precio || 0,
      };

      if (formData.descripcion?.trim()) {
        datosEnviar.descripcion = formData.descripcion.trim();
      }

      if (formData.esObligatorio !== undefined) {
        datosEnviar.esObligatorio = formData.esObligatorio;
      }

      if (formData.maximoSelecciones !== undefined && formData.maximoSelecciones !== null) {
        datosEnviar.maximoSelecciones = formData.maximoSelecciones;
      }

      if (formData.ordenVisualizacion !== undefined && formData.ordenVisualizacion !== null) {
        datosEnviar.ordenVisualizacion = formData.ordenVisualizacion;
      }

      if (formData.activa !== undefined) {
        datosEnviar.activa = formData.activa;
      }

      if (editingAdicion) {
        const { restauranteId, ...datosActualizar } = datosEnviar;
        await adicionesService.actualizar(editingAdicion.id, datosActualizar);
        setSuccess('Adición actualizada exitosamente');
      } else {
        await adicionesService.crear(datosEnviar);
        setSuccess('Adición creada exitosamente');
      }

      setShowForm(false);
      setEditingAdicion(null);
      resetForm();
      loadAdiciones();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la adición');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (adicion: Adicion) => {
    setEditingAdicion(adicion);
    setFormData({
      nombre: adicion.nombre,
      descripcion: adicion.descripcion || '',
      precio: adicion.precio,
      esObligatorio: adicion.esObligatorio,
      maximoSelecciones: adicion.maximoSelecciones,
      ordenVisualizacion: adicion.ordenVisualizacion,
      activa: adicion.activa,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta adición? Esta acción no se puede deshacer.')) return;

    try {
      setError(null);
      await adicionesService.eliminar(id);
      setSuccess('Adición eliminada exitosamente');
      loadAdiciones();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la adición');
    }
  };

  const handleToggleActiva = async (adicion: Adicion) => {
    try {
      setError(null);
      await adicionesService.actualizar(adicion.id, { activa: !adicion.activa });
      setSuccess(`Adición ${adicion.activa ? 'desactivada' : 'activada'} exitosamente`);
      loadAdiciones();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la adición');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      precio: 0,
      esObligatorio: false,
      maximoSelecciones: 1,
      ordenVisualizacion: 0,
      activa: true,
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingAdicion(null);
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
            <h1 className="text-2xl font-bold text-gray-900">Adiciones del Menú</h1>
            <p className="mt-1 text-sm text-gray-500">Gestiona las adiciones y extras disponibles para los platos</p>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingAdicion(null);
                resetForm();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Adición
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
            {editingAdicion ? 'Editar Adición' : 'Nueva Adición'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  id="nombre"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Ej: Tamaño, Salsa, Extra"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  id="descripcion"
                  rows={3}
                  value={formData.descripcion || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Descripción opcional de la adición"
                />
              </div>

              <div>
                <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Adicional
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="precio"
                    id="precio"
                    min="0"
                    step="0.01"
                    value={formData.precio || ''}
                    onChange={handleChange}
                    className="block w-full pl-10 px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="maximoSelecciones" className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Selecciones
                </label>
                <input
                  type="number"
                  name="maximoSelecciones"
                  id="maximoSelecciones"
                  min="1"
                  value={formData.maximoSelecciones || 1}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="1"
                />
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
                  placeholder="Auto"
                />
              </div>

              <div className="flex items-end">
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors w-full">
                  <input
                    type="checkbox"
                    name="esObligatorio"
                    checked={formData.esObligatorio ?? false}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Obligatorio</span>
                    <span className="block text-xs text-gray-500">Debe seleccionarse al menos una opción</span>
                  </div>
                </label>
              </div>

              <div className="flex items-end">
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors w-full">
                  <input
                    type="checkbox"
                    name="activa"
                    checked={formData.activa ?? true}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Adición Activa</span>
                    <span className="block text-xs text-gray-500">Disponible para usar</span>
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
                    {editingAdicion ? 'Actualizar' : 'Crear'} Adición
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de adiciones */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      ) : adiciones.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No hay adiciones</h3>
          <p className="mt-2 text-sm text-gray-500">Comienza agregando tu primera adición.</p>
          <div className="mt-6">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingAdicion(null);
                resetForm();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Adición
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {adiciones.map((adicion) => (
              <li key={adicion.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <GripVertical className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {adicion.nombre}
                        </p>
                        {!adicion.activa && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Inactiva
                          </span>
                        )}
                        {adicion.esObligatorio && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                            Obligatorio
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                        {adicion.precio > 0 && (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>+${adicion.precio.toFixed(2)}</span>
                          </div>
                        )}
                        {adicion.precio === 0 && (
                          <span className="text-green-600">Gratis</span>
                        )}
                        <span>Máx. {adicion.maximoSelecciones} selección(es)</span>
                        {adicion.descripcion && (
                          <span className="text-gray-400 truncate">{adicion.descripcion}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleActiva(adicion)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={adicion.activa ? 'Desactivar' : 'Activar'}
                    >
                      {adicion.activa ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(adicion)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(adicion.id)}
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

