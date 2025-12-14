import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { adicionesService } from '../services';
import type { Adicion, CrearAdicionDto, ActualizarAdicionDto } from '../types/api.types';
import Swal from 'sweetalert2';
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
  DollarSign,
  MoveUp,
  MoveDown,
  AlertTriangle,
  Info,
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
        nombre: formData.nombre?.trim() || '',
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar adición?',
      text: 'Esta acción no se puede deshacer. La adición será eliminada permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      setError(null);
      await adicionesService.eliminar(id);
      await Swal.fire({
        title: '¡Eliminada!',
        text: 'La adición ha sido eliminada exitosamente.',
        icon: 'success',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      loadAdiciones();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la adición');
      Swal.fire({
        title: 'Error',
        text: err.message || 'Hubo un problema al eliminar la adición.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
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

  const handleMoveOrder = async (adicion: Adicion, direction: 'up' | 'down') => {
    const currentIndex = adiciones.findIndex(a => a.id === adicion.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= adiciones.length) return;

    const targetAdicion = adiciones[newIndex];
    const newOrder = targetAdicion.ordenVisualizacion;

    try {
      await adicionesService.actualizar(adicion.id, { ordenVisualizacion: newOrder });
      await adicionesService.actualizar(targetAdicion.id, { ordenVisualizacion: adicion.ordenVisualizacion });
      loadAdiciones();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el orden');
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

  const getTotalGratis = () => {
    return adiciones.filter(a => a.precio === 0).length;
  };

  const getTotalConPrecio = () => {
    return adiciones.filter(a => a.precio > 0).length;
  };

  const getTotalObligatorias = () => {
    return adiciones.filter(a => a.esObligatorio).length;
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
      {/* Header mejorado */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl border border-green-100 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-fit">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span>Adiciones del Menú</span>
                  {adiciones.length > 0 && !loading && (
                    <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                      {adiciones.length}
                    </span>
                  )}
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                  Gestiona las adiciones y extras disponibles para los platos
                </p>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingAdicion(null);
                  resetForm();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2.5 sm:py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="whitespace-nowrap">Nueva Adición</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {adiciones.length > 0 && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-orange-100 rounded-lg">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Adiciones</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{adiciones.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Gratis</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{getTotalGratis()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Con Precio</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{getTotalConPrecio()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Obligatorias</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{getTotalObligatorias()}</p>
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                    className="block w-full pl-10 px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                    placeholder="0.00"
                  />
                </div>
                {formData.precio === 0 && (
                  <p className="mt-1 text-xs text-green-600 flex items-center">
                    <Info className="h-3 w-3 mr-1" />
                    Esta adición será gratuita
                  </p>
                )}
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Auto"
                />
              </div>

              <div className="flex items-end">
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors w-full">
                  <input
                    type="checkbox"
                    name="esObligatorio"
                    checked={formData.esObligatorio ?? false}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Obligatorio</span>
                    <span className="block text-xs text-gray-500">Debe seleccionarse al menos una opción</span>
                  </div>
                </label>
              </div>

              <div className="flex items-end">
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors w-full">
                  <input
                    type="checkbox"
                    name="activa"
                    checked={formData.activa ?? true}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Adición Activa</span>
                    <span className="block text-xs text-gray-500">Disponible para usar</span>
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
                    {editingAdicion ? 'Actualizar' : 'Crear'} Adición
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de adiciones - Vista mejorada con cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-green-600" />
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
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Adición
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Grid de cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {adiciones.map((adicion, index) => (
              <div
                key={adicion.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md overflow-hidden ${
                  adicion.activa ? 'border-gray-200' : 'border-gray-300 opacity-75'
                } ${adicion.esObligatorio ? 'ring-2 ring-orange-200' : ''}`}
              >
                <div className="p-5">
                  {/* Header del card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">{adicion.nombre}</h3>
                      </div>
                      {adicion.descripcion && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{adicion.descripcion}</p>
                      )}
                    </div>
                    {adicion.esObligatorio && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 flex-shrink-0">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Obligatorio
                      </span>
                    )}
                  </div>

                  {/* Información de precio */}
                  <div className="mb-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      {adicion.precio > 0 ? (
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-lg font-bold text-green-600">+${adicion.precio.toFixed(2)}</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-lg font-bold text-green-600">Gratis</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Máx. {adicion.maximoSelecciones} {adicion.maximoSelecciones === 1 ? 'selección' : 'selecciones'}
                      </div>
                    </div>
                  </div>

                  {/* Estado */}
                  {!adicion.activa && (
                    <div className="mb-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inactiva
                      </span>
                    </div>
                  )}

                  {/* Información adicional */}
                  <div className="mb-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center text-xs text-gray-500">
                      <Info className="h-3 w-3 mr-1" />
                      <span>Orden: {adicion.ordenVisualizacion}</span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-center sm:justify-start space-x-1">
                      <button
                        onClick={() => handleMoveOrder(adicion, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover arriba"
                      >
                        <MoveUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(adicion, 'down')}
                        disabled={index === adiciones.length - 1}
                        className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover abajo"
                      >
                        <MoveDown className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-center sm:justify-end space-x-1">
                      <button
                        onClick={() => handleToggleActiva(adicion)}
                        className={`p-1.5 transition-colors ${
                          adicion.activa
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={adicion.activa ? 'Desactivar' : 'Activar'}
                      >
                        {adicion.activa ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(adicion)}
                        className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(adicion.id)}
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
        </div>
      )}
    </div>
  );
}
