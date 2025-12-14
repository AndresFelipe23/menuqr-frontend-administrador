import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { categoriasService } from '../services';
import { itemsMenuService } from '../services/items-menu.service';
import type { Categoria, CrearCategoriaDto, ActualizarCategoriaDto } from '../types/api.types';
import Swal from 'sweetalert2';
import {
  Plus,
  Edit2,
  Trash2,
  Folder,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  MoveUp,
  MoveDown,
  Package,
  Menu as MenuIcon,
} from 'lucide-react';
import ImageUpload from '../components/ImageUpload';
import { Link } from 'react-router-dom';

interface CategoriaConItems extends Categoria {
  totalItems?: number;
}

export default function CategoriasPage() {
  const { user } = useAuth();
  const [categorias, setCategorias] = useState<CategoriaConItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);

  const [formData, setFormData] = useState<Partial<CrearCategoriaDto & ActualizarCategoriaDto>>({
    nombre: '',
    descripcion: '',
    imagenUrl: '',
    ordenVisualizacion: 0,
    activa: true,
  });

  useEffect(() => {
    if (user?.restauranteId) {
      loadCategorias();
    }
  }, [user?.restauranteId]);

  const loadCategorias = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoading(true);
      setError(null);
      const [data, itemsData] = await Promise.all([
        categoriasService.obtenerPorRestauranteId(user.restauranteId),
        itemsMenuService.obtenerPorRestauranteId(user.restauranteId).catch(() => []),
      ]);

      // Ordenar por ordenVisualizacion
      const sorted = data.sort((a, b) => a.ordenVisualizacion - b.ordenVisualizacion);
      
      // Contar items por categoría
      const categoriasConItems: CategoriaConItems[] = sorted.map(categoria => {
        const totalItems = itemsData.filter((item: any) => item.categoriaId === categoria.id).length;
        return {
          ...categoria,
          totalItems,
        };
      });

      setCategorias(categoriasConItems);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las categorías');
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
      if (name === 'ordenVisualizacion') {
        return { ...prev, [name]: value === '' ? undefined : parseInt(value, 10) };
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
      };

      if (formData.descripcion?.trim()) {
        datosEnviar.descripcion = formData.descripcion.trim();
      }

      if (formData.imagenUrl?.trim()) {
        datosEnviar.imagenUrl = formData.imagenUrl.trim();
      }

      if (formData.ordenVisualizacion !== undefined && formData.ordenVisualizacion !== null) {
        const ordenNum = parseInt(String(formData.ordenVisualizacion), 10);
        if (!isNaN(ordenNum) && ordenNum >= 0) {
          datosEnviar.ordenVisualizacion = ordenNum;
        }
      } else if (!editingCategoria) {
        datosEnviar.ordenVisualizacion = categorias.length + 1;
      }

      if (formData.activa !== undefined) {
        datosEnviar.activa = formData.activa;
      }

      if (editingCategoria) {
        const { restauranteId, ...datosActualizar } = datosEnviar;
        await categoriasService.actualizar(editingCategoria.id, datosActualizar);
        setSuccess('Categoría actualizada exitosamente');
      } else {
        await categoriasService.crear(datosEnviar);
        setSuccess('Categoría creada exitosamente');
      }

      setShowForm(false);
      setEditingCategoria(null);
      resetForm();
      loadCategorias();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la categoría');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || '',
      imagenUrl: categoria.imagenUrl || '',
      ordenVisualizacion: categoria.ordenVisualizacion,
      activa: categoria.activa,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: 'Esta acción no se puede deshacer. La categoría será eliminada permanentemente.',
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
      await categoriasService.eliminar(id);
      await Swal.fire({
        title: '¡Eliminada!',
        text: 'La categoría ha sido eliminada exitosamente.',
        icon: 'success',
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
      });
      loadCategorias();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la categoría');
      Swal.fire({
        title: 'Error',
        text: err.message || 'Hubo un problema al eliminar la categoría.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const handleToggleActiva = async (categoria: Categoria) => {
    try {
      setError(null);
      await categoriasService.actualizar(categoria.id, { activa: !categoria.activa });
      setSuccess(`Categoría ${categoria.activa ? 'desactivada' : 'activada'} exitosamente`);
      loadCategorias();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la categoría');
    }
  };

  const handleMoveOrder = async (categoria: CategoriaConItems, direction: 'up' | 'down') => {
    const currentIndex = categorias.findIndex(c => c.id === categoria.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categorias.length) return;

    const targetCategoria = categorias[newIndex];
    const newOrder = targetCategoria.ordenVisualizacion;

    try {
      await categoriasService.actualizar(categoria.id, { ordenVisualizacion: newOrder });
      await categoriasService.actualizar(targetCategoria.id, { ordenVisualizacion: categoria.ordenVisualizacion });
      loadCategorias();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el orden');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      imagenUrl: '',
      ordenVisualizacion: 0,
      activa: true,
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingCategoria(null);
    resetForm();
  };

  const getTotalItems = () => {
    return categorias.reduce((sum, categoria) => sum + (categoria.totalItems || 0), 0);
  };

  const getCategoriasActivas = () => {
    return categorias.filter(c => c.activa);
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
                  <Folder className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span>Categorías del Menú</span>
                  {categorias.length > 0 && !loading && (
                    <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                      {categorias.length}
                    </span>
                  )}
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                  Organiza y gestiona las categorías de tu menú para una mejor experiencia
                </p>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingCategoria(null);
                  resetForm();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2.5 sm:py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="whitespace-nowrap">Nueva Categoría</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {categorias.length > 0 && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                <Folder className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total de Categorías</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{categorias.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Categorías Activas</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{getCategoriasActivas().length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                <MenuIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total de Items</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{getTotalItems()}</p>
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
            {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
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
                  placeholder="Ej: Entradas, Platos Principales, Postres"
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
                  placeholder="Descripción opcional de la categoría"
                />
              </div>

              <div className="sm:col-span-2">
                <ImageUpload
                  value={formData.imagenUrl || null}
                  onChange={(url) => {
                    setFormData(prev => ({ ...prev, imagenUrl: url }));
                  }}
                  onRemove={() => {
                    setFormData(prev => ({ ...prev, imagenUrl: '' }));
                  }}
                  subfolder="categorias"
                  label="Imagen de la Categoría"
                  previewSize="medium"
                  shape="square"
                  allowUrlInput={true}
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
                  placeholder="Auto (siguiente orden disponible)"
                />
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
                    <span className="block text-sm font-medium text-gray-900">Categoría Activa</span>
                    <span className="block text-xs text-gray-500">Mostrar en el menú público</span>
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
                    {editingCategoria ? 'Actualizar' : 'Crear'} Categoría
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de categorías - Vista mejorada con cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-green-600" />
        </div>
      ) : categorias.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Folder className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No hay categorías</h3>
          <p className="mt-2 text-sm text-gray-500">Comienza agregando tu primera categoría para organizar tu menú.</p>
          <div className="mt-6">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingCategoria(null);
                resetForm();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Categoría
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Grid de cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorias.map((categoria, index) => (
              <div
                key={categoria.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md overflow-hidden ${
                  categoria.activa ? 'border-gray-200' : 'border-gray-300 opacity-75'
                }`}
              >
                {/* Imagen de la categoría */}
                {categoria.imagenUrl ? (
                  <div className="h-40 w-full bg-gray-100 overflow-hidden">
                    <img
                      src={categoria.imagenUrl}
                      alt={categoria.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center"><svg class="h-16 w-16 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-40 w-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-purple-400" />
                  </div>
                )}

                <div className="p-5">
                  {/* Header del card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{categoria.nombre}</h3>
                      {categoria.descripcion && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{categoria.descripcion}</p>
                      )}
                    </div>
                    {!categoria.activa && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inactiva
                      </span>
                    )}
                  </div>

                  {/* Estadísticas */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-3">
                    <Link
                      to={`/dashboard/menu?categoriaId=${categoria.id}`}
                      className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      <span className="font-medium">{categoria.totalItems || 0}</span>
                      <span className="ml-1">items</span>
                    </Link>
                    <div className="text-xs text-gray-500">
                      Orden: {categoria.ordenVisualizacion}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-center sm:justify-start space-x-1">
                      <button
                        onClick={() => handleMoveOrder(categoria, 'up')}
                        disabled={index === 0}
                        className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover arriba"
                      >
                        <MoveUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleMoveOrder(categoria, 'down')}
                        disabled={index === categorias.length - 1}
                        className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover abajo"
                      >
                        <MoveDown className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-center sm:justify-end space-x-1">
                      <button
                        onClick={() => handleToggleActiva(categoria)}
                        className={`p-1.5 transition-colors ${
                          categoria.activa
                            ? 'text-green-600 hover:text-green-700'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                        title={categoria.activa ? 'Desactivar' : 'Activar'}
                      >
                        {categoria.activa ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleEdit(categoria)}
                        className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(categoria.id)}
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
