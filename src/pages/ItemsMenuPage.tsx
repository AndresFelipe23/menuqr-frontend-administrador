import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { itemsMenuService, categoriasService, adicionesService } from '../services';
import type { ItemMenuConAdiciones, CrearItemMenuDto, ActualizarItemMenuDto, Categoria, Adicion } from '../types/api.types';
import ImageUpload from '../components/ImageUpload';
import {
  Plus,
  Edit2,
  Trash2,
  Utensils,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Clock,
  Leaf,
  Flame,
  Wheat,
  Star,
  MoveUp,
  MoveDown,
  Filter,
} from 'lucide-react';

export default function ItemsMenuPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemMenuConAdiciones[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [adiciones, setAdiciones] = useState<Adicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingAdiciones, setLoadingAdiciones] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMenuConAdiciones | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');

  const [formData, setFormData] = useState<Partial<CrearItemMenuDto & ActualizarItemMenuDto>>({
    categoriaId: '',
    nombre: '',
    descripcion: '',
    precio: 0,
    imagenUrl: '',
    calorias: undefined,
    alergenos: [],
    disponible: true,
    destacado: false,
    ordenVisualizacion: 0,
    tiempoPreparacion: undefined,
    esVegetariano: false,
    esVegano: false,
    sinGluten: false,
    esPicante: false,
    nivelPicante: 0,
    adicionesIds: [],
  });

  const [alergenosInput, setAlergenosInput] = useState('');

  useEffect(() => {
    if (user?.restauranteId) {
      loadItems();
      loadCategorias();
      loadAdiciones();
    }
  }, [user?.restauranteId]);

  const loadItems = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await itemsMenuService.obtenerPorRestauranteId(user.restauranteId);
      // Ordenar por categoría y luego por ordenVisualizacion
      const sorted = data.sort((a, b) => {
        if (a.categoriaId !== b.categoriaId) {
          return a.categoriaId.localeCompare(b.categoriaId);
        }
        return a.ordenVisualizacion - b.ordenVisualizacion;
      });
      setItems(sorted);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los items del menú');
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoadingCategorias(true);
      const data = await categoriasService.obtenerPorRestauranteId(user.restauranteId);
      const sorted = data.filter(c => c.activa).sort((a, b) => a.ordenVisualizacion - b.ordenVisualizacion);
      setCategorias(sorted);
    } catch (err: any) {
      console.error('Error al cargar categorías:', err);
    } finally {
      setLoadingCategorias(false);
    }
  };

  const loadAdiciones = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoadingAdiciones(true);
      const data = await adicionesService.obtenerPorRestauranteId(user.restauranteId);
      const sorted = data.filter(a => a.activa).sort((a, b) => a.ordenVisualizacion - b.ordenVisualizacion);
      setAdiciones(sorted);
    } catch (err: any) {
      console.error('Error al cargar adiciones:', err);
    } finally {
      setLoadingAdiciones(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        return { ...prev, [name]: checked };
      }
      if (name === 'precio' || name === 'calorias' || name === 'tiempoPreparacion' || name === 'nivelPicante' || name === 'ordenVisualizacion') {
        return { ...prev, [name]: value === '' ? undefined : parseFloat(value) };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleAlergenosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAlergenosInput(value);
    // Convertir string separado por comas a array
    const alergenosArray = value.split(',').map(a => a.trim()).filter(a => a.length > 0);
    setFormData((prev) => ({ ...prev, alergenos: alergenosArray }));
  };

  const handleAdicionToggle = (adicionId: string) => {
    setFormData((prev) => {
      const currentIds = prev.adicionesIds || [];
      const isSelected = currentIds.includes(adicionId);
      
      if (isSelected) {
        // Remover de la selección
        return { ...prev, adicionesIds: currentIds.filter(id => id !== adicionId) };
      } else {
        // Agregar a la selección
        return { ...prev, adicionesIds: [...currentIds, adicionId] };
      }
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
        categoriaId: formData.categoriaId?.trim() || '',
        nombre: formData.nombre?.trim() || '',
        precio: formData.precio || 0,
      };

      if (formData.descripcion?.trim()) {
        datosEnviar.descripcion = formData.descripcion.trim();
      }

      if (formData.imagenUrl?.trim()) {
        datosEnviar.imagenUrl = formData.imagenUrl.trim();
      }

      if (formData.calorias !== undefined && formData.calorias !== null) {
        datosEnviar.calorias = formData.calorias;
      }

      if (formData.alergenos && formData.alergenos.length > 0) {
        datosEnviar.alergenos = formData.alergenos;
      }

      if (formData.disponible !== undefined) {
        datosEnviar.disponible = formData.disponible;
      }

      if (formData.destacado !== undefined) {
        datosEnviar.destacado = formData.destacado;
      }

      if (formData.ordenVisualizacion !== undefined && formData.ordenVisualizacion !== null) {
        datosEnviar.ordenVisualizacion = formData.ordenVisualizacion;
      }

      if (formData.tiempoPreparacion !== undefined && formData.tiempoPreparacion !== null) {
        datosEnviar.tiempoPreparacion = formData.tiempoPreparacion;
      }

      if (formData.esVegetariano !== undefined) {
        datosEnviar.esVegetariano = formData.esVegetariano;
      }

      if (formData.esVegano !== undefined) {
        datosEnviar.esVegano = formData.esVegano;
      }

      if (formData.sinGluten !== undefined) {
        datosEnviar.sinGluten = formData.sinGluten;
      }

      if (formData.esPicante !== undefined) {
        datosEnviar.esPicante = formData.esPicante;
      }

      if (formData.nivelPicante !== undefined && formData.nivelPicante !== null) {
        datosEnviar.nivelPicante = formData.nivelPicante;
      }

      if (formData.adicionesIds && formData.adicionesIds.length > 0) {
        datosEnviar.adicionesIds = formData.adicionesIds;
      }

      if (editingItem) {
        const { restauranteId, ...datosActualizar } = datosEnviar;
        await itemsMenuService.actualizar(editingItem.id, datosActualizar);
        setSuccess('Item del menú actualizado exitosamente');
      } else {
        await itemsMenuService.crear(datosEnviar);
        setSuccess('Item del menú creado exitosamente');
      }

      setShowForm(false);
      setEditingItem(null);
      resetForm();
      loadItems();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el item del menú');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ItemMenuConAdiciones) => {
    setEditingItem(item);
    // Parsear alergenos si vienen como JSON string
    let alergenosArray: string[] = [];
    if (item.alergenos) {
      try {
        alergenosArray = typeof item.alergenos === 'string' ? JSON.parse(item.alergenos) : item.alergenos;
      } catch {
        alergenosArray = [];
      }
    }
    setAlergenosInput(alergenosArray.join(', '));
    
    setFormData({
      categoriaId: item.categoriaId,
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      precio: item.precio,
      imagenUrl: item.imagenUrl || '',
      calorias: item.calorias || undefined,
      alergenos: alergenosArray,
      disponible: item.disponible,
      destacado: item.destacado,
      ordenVisualizacion: item.ordenVisualizacion,
      tiempoPreparacion: item.tiempoPreparacion || undefined,
      esVegetariano: item.esVegetariano,
      esVegano: item.esVegano,
      sinGluten: item.sinGluten,
      esPicante: item.esPicante,
      nivelPicante: item.nivelPicante,
      adicionesIds: item.adiciones?.map(a => a.id) || [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este item del menú? Esta acción no se puede deshacer.')) return;

    try {
      setError(null);
      await itemsMenuService.eliminar(id);
      setSuccess('Item del menú eliminado exitosamente');
      loadItems();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el item del menú');
    }
  };

  const handleToggleDisponible = async (item: ItemMenuConAdiciones) => {
    try {
      setError(null);
      await itemsMenuService.actualizar(item.id, { disponible: !item.disponible });
      setSuccess(`Item ${item.disponible ? 'marcado como no disponible' : 'marcado como disponible'} exitosamente`);
      loadItems();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el item');
    }
  };

  const resetForm = () => {
    setFormData({
      categoriaId: '',
      nombre: '',
      descripcion: '',
      precio: 0,
      imagenUrl: '',
      calorias: undefined,
      alergenos: [],
      disponible: true,
      destacado: false,
      ordenVisualizacion: 0,
      tiempoPreparacion: undefined,
      esVegetariano: false,
      esVegano: false,
      sinGluten: false,
      esPicante: false,
      nivelPicante: 0,
      adicionesIds: [],
    });
    setAlergenosInput('');
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
    resetForm();
  };

  const itemsFiltrados = filtroCategoria
    ? items.filter(item => item.categoriaId === filtroCategoria)
    : items;

  const getCategoriaNombre = (categoriaId: string) => {
    return categorias.find(c => c.id === categoriaId)?.nombre || 'Sin categoría';
  };

  const handleMoveOrder = async (item: ItemMenuConAdiciones, direction: 'up' | 'down') => {
    const itemsMismaCategoria = items.filter(i => i.categoriaId === item.categoriaId).sort((a, b) => a.ordenVisualizacion - b.ordenVisualizacion);
    const currentIndex = itemsMismaCategoria.findIndex(i => i.id === item.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= itemsMismaCategoria.length) return;

    const targetItem = itemsMismaCategoria[newIndex];
    const newOrder = targetItem.ordenVisualizacion;

    try {
      await itemsMenuService.actualizar(item.id, { ordenVisualizacion: newOrder });
      await itemsMenuService.actualizar(targetItem.id, { ordenVisualizacion: item.ordenVisualizacion });
      loadItems();
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el orden');
    }
  };

  const getTotalDisponibles = () => {
    return items.filter(i => i.disponible).length;
  };

  const getTotalDestacados = () => {
    return items.filter(i => i.destacado).length;
  };

  const getPrecioPromedio = () => {
    if (items.length === 0) return 0;
    const suma = items.reduce((sum, item) => sum + item.precio, 0);
    return suma / items.length;
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
      {/* Header mejorado */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl border border-green-100 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Utensils className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  Items del Menú
                  {items.length > 0 && !loading && (
                    <span className="ml-3 px-3 py-1 text-sm font-semibold bg-green-100 text-green-700 rounded-full">
                      {items.length}
                    </span>
                  )}
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Gestiona los platos y productos de tu menú
                </p>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingItem(null);
                  resetForm();
                }}
                className="inline-flex items-center px-5 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Item
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {items.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                <Utensils className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Items</p>
                <p className="text-2xl font-semibold text-gray-900">{items.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Disponibles</p>
                <p className="text-2xl font-semibold text-gray-900">{getTotalDisponibles()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Destacados</p>
                <p className="text-2xl font-semibold text-gray-900">{getTotalDestacados()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Precio Promedio</p>
                <p className="text-2xl font-semibold text-gray-900">${getPrecioPromedio().toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtro por categoría mejorado */}
      {!showForm && categorias.length > 0 && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex-1">
              <label htmlFor="filtroCategoria" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por categoría
              </label>
              <select
                id="filtroCategoria"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="block w-full sm:w-64 px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white sm:text-sm transition-colors"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </select>
            </div>
            {filtroCategoria && (
              <button
                onClick={() => setFiltroCategoria('')}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Limpiar filtro
              </button>
            )}
          </div>
        </div>
      )}

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

      {/* Formulario - Continuará en la siguiente parte debido a su tamaño */}
      {showForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? 'Editar Item del Menú' : 'Nuevo Item del Menú'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="categoriaId" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  name="categoriaId"
                  id="categoriaId"
                  required
                  value={formData.categoriaId}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white sm:text-sm transition-colors"
                  disabled={loadingCategorias}
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.id}>
                      {categoria.nombre}
                    </option>
                  ))}
                </select>
              </div>

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
                  placeholder="Ej: Pollo a la Plancha"
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
                  placeholder="Descripción del plato..."
                />
              </div>

              <div>
                <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-2">
                  Precio *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="precio"
                    id="precio"
                    required
                    min="0"
                    step="0.01"
                    value={formData.precio || ''}
                    onChange={handleChange}
                    className="block w-full pl-10 px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="calorias" className="block text-sm font-medium text-gray-700 mb-2">
                  Calorías
                </label>
                <input
                  type="number"
                  name="calorias"
                  id="calorias"
                  min="0"
                  value={formData.calorias || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Ej: 350"
                />
              </div>

              <div>
                <label htmlFor="tiempoPreparacion" className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo de Preparación (min)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="tiempoPreparacion"
                    id="tiempoPreparacion"
                    min="0"
                    value={formData.tiempoPreparacion || ''}
                    onChange={handleChange}
                    className="block w-full pl-10 px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                    placeholder="Ej: 20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="nivelPicante" className="block text-sm font-medium text-gray-700 mb-2">
                  Nivel Picante (0-5)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Flame className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="nivelPicante"
                    id="nivelPicante"
                    min="0"
                    max="5"
                    value={formData.nivelPicante || 0}
                    onChange={handleChange}
                    className="block w-full pl-10 px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  />
                </div>
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
                  subfolder="items"
                  label="Imagen del Plato"
                  previewSize="large"
                  shape="square"
                  allowUrlInput={true}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="alergenosInput" className="block text-sm font-medium text-gray-700 mb-2">
                  Alérgenos (separados por comas)
                </label>
                <input
                  type="text"
                  id="alergenosInput"
                  value={alergenosInput}
                  onChange={handleAlergenosChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Ej: Gluten, Lactosa, Frutos secos"
                />
                <p className="mt-1 text-xs text-gray-500">Separa los alérgenos con comas</p>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Adiciones Disponibles
                </label>
                {loadingAdiciones ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin h-6 w-6 text-green-600" />
                    <span className="ml-2 text-sm text-gray-500">Cargando adiciones...</span>
                  </div>
                ) : adiciones.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500 text-center">
                      No hay adiciones disponibles. Crea adiciones en la sección "Adiciones" primero.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
                    {adiciones.map((adicion) => {
                      const isSelected = (formData.adicionesIds || []).includes(adicion.id);
                      return (
                        <label
                          key={adicion.id}
                          className={`relative flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 bg-white hover:border-green-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleAdicionToggle(adicion.id)}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <div className="ml-3 flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {adicion.nombre}
                              </span>
                              {adicion.precio > 0 && (
                                <span className="ml-2 text-xs font-semibold text-green-600 whitespace-nowrap">
                                  +${adicion.precio.toFixed(2)}
                                </span>
                              )}
                            </div>
                            {adicion.descripcion && (
                              <p className="mt-1 text-xs text-gray-500 line-clamp-1">
                                {adicion.descripcion}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
                {formData.adicionesIds && formData.adicionesIds.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    {formData.adicionesIds.length} adición(es) seleccionada(s)
                  </p>
                )}
              </div>

              <div className="sm:col-span-2 grid grid-cols-2 gap-4">
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="disponible"
                    checked={formData.disponible ?? true}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Disponible</span>
                    <span className="block text-xs text-gray-500">Visible en el menú</span>
                  </div>
                </label>

                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="destacado"
                    checked={formData.destacado ?? false}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Destacado</span>
                    <span className="block text-xs text-gray-500">Mostrar como especial</span>
                  </div>
                </label>

                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="esVegetariano"
                    checked={formData.esVegetariano ?? false}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex items-center">
                    <Leaf className="h-4 w-4 text-green-600 mr-2" />
                    <span className="block text-sm font-medium text-gray-900">Vegetariano</span>
                  </div>
                </label>

                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="esVegano"
                    checked={formData.esVegano ?? false}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex items-center">
                    <Leaf className="h-4 w-4 text-green-700 mr-2" />
                    <span className="block text-sm font-medium text-gray-900">Vegano</span>
                  </div>
                </label>

                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="sinGluten"
                    checked={formData.sinGluten ?? false}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex items-center">
                    <Wheat className="h-4 w-4 text-amber-600 mr-2" />
                    <span className="block text-sm font-medium text-gray-900">Sin Gluten</span>
                  </div>
                </label>

                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    name="esPicante"
                    checked={formData.esPicante ?? false}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3 flex items-center">
                    <Flame className="h-4 w-4 text-red-600 mr-2" />
                    <span className="block text-sm font-medium text-gray-900">Picante</span>
                  </div>
                </label>
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
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={cancelForm}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Guardando...
                  </>
                ) : (
                  <>
                    {editingItem ? 'Actualizar' : 'Crear'} Item
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de items - Vista mejorada con cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-green-600" />
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Utensils className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No hay items del menú</h3>
          <p className="mt-2 text-sm text-gray-500">
            {filtroCategoria ? 'No hay items en esta categoría' : 'Comienza agregando tu primer plato.'}
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingItem(null);
                resetForm();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Item
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Grid de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {itemsFiltrados.map((item, index) => {
              const itemsMismaCategoria = itemsFiltrados.filter(i => i.categoriaId === item.categoriaId).sort((a, b) => a.ordenVisualizacion - b.ordenVisualizacion);
              const itemIndex = itemsMismaCategoria.findIndex(i => i.id === item.id);
              const canMoveUp = itemIndex > 0;
              const canMoveDown = itemIndex < itemsMismaCategoria.length - 1;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md overflow-hidden ${
                    item.disponible ? 'border-gray-200' : 'border-gray-300 opacity-75'
                  } ${item.destacado ? 'ring-2 ring-yellow-200' : ''}`}
                >
                  {/* Imagen del item */}
                  {item.imagenUrl ? (
                    <div className="h-48 w-full bg-gray-100 overflow-hidden relative">
                      <img
                        src={item.imagenUrl}
                        alt={item.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center"><svg class="h-16 w-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>';
                        }}
                      />
                      {item.destacado && (
                        <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                          <Star className="h-4 w-4 text-yellow-900 fill-yellow-900" />
                        </div>
                      )}
                      {!item.disponible && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">No disponible</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center relative">
                      <Utensils className="h-16 w-16 text-green-400" />
                      {item.destacado && (
                        <div className="absolute top-2 right-2 bg-yellow-400 rounded-full p-1">
                          <Star className="h-4 w-4 text-yellow-900 fill-yellow-900" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5">
                    {/* Header del card */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">{item.nombre}</h3>
                      </div>
                      <div className="mt-2 flex items-center space-x-3 text-sm">
                        <div className="flex items-center font-bold text-green-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          ${item.precio.toFixed(2)}
                        </div>
                        {item.calorias && (
                          <span className="text-gray-500">{item.calorias} cal</span>
                        )}
                        {item.tiempoPreparacion && (
                          <div className="flex items-center text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{item.tiempoPreparacion} min</span>
                          </div>
                        )}
                      </div>
                      <span className="inline-block mt-2 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                        {getCategoriaNombre(item.categoriaId)}
                      </span>
                    </div>

                    {/* Descripción */}
                    {item.descripcion && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{item.descripcion}</p>
                    )}

                    {/* Características */}
                    {(item.esVegetariano || item.esVegano || item.sinGluten || item.esPicante) && (
                      <div className="flex items-center flex-wrap gap-2 mb-3">
                        {item.esVegetariano && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            <Leaf className="h-3 w-3 mr-1" />
                            Vegetariano
                          </span>
                        )}
                        {item.esVegano && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-200 text-green-900">
                            <Leaf className="h-3 w-3 mr-1" />
                            Vegano
                          </span>
                        )}
                        {item.sinGluten && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            <Wheat className="h-3 w-3 mr-1" />
                            Sin Gluten
                          </span>
                        )}
                        {item.esPicante && item.nivelPicante > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            <Flame className="h-3 w-3 mr-1" />
                            Picante {item.nivelPicante}/5
                          </span>
                        )}
                      </div>
                    )}

                    {/* Adiciones */}
                    {item.adiciones && item.adiciones.length > 0 && (
                      <div className="mb-3 text-xs text-gray-500">
                        {item.adiciones.length} adición(es) disponible(s)
                      </div>
                    )}

                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleMoveOrder(item, 'up')}
                          disabled={!canMoveUp}
                          className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover arriba"
                        >
                          <MoveUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoveOrder(item, 'down')}
                          disabled={!canMoveDown}
                          className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover abajo"
                        >
                          <MoveDown className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleDisponible(item)}
                          className={`p-1.5 transition-colors ${
                            item.disponible
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title={item.disponible ? 'Marcar como no disponible' : 'Marcar como disponible'}
                        >
                          {item.disponible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

