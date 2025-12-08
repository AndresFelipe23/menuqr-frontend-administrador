import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mesasService, usuariosService } from '../services';
import type { MesaConMesero, CrearMesaDto, ActualizarMesaDto, UsuarioConRol } from '../types/api.types';
import {
  Plus,
  Edit2,
  Trash2,
  Table,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Users,
  MapPin,
  User,
  RotateCw,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  X,
} from 'lucide-react';

interface Rol {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export default function MesasPage() {
  const { user } = useAuth();
  const [mesas, setMesas] = useState<MesaConMesero[]>([]);
  const [meseros, setMeseros] = useState<UsuarioConRol[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMeseros, setLoadingMeseros] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingMesa, setEditingMesa] = useState<MesaConMesero | null>(null);
  const [selectedQR, setSelectedQR] = useState<{ imagenUrl: string; codigoQr: string; numero: string; nombre?: string } | null>(null);

  const [formData, setFormData] = useState<Partial<CrearMesaDto & ActualizarMesaDto>>({
    numero: '',
    nombre: '',
    codigoQr: '',
    imagenQrUrl: '',
    capacidad: 4,
    seccion: '',
    piso: 1,
    meseroAsignadoId: '',
    activa: true,
    ocupada: false,
  });

  useEffect(() => {
    if (user?.restauranteId) {
      loadMesas();
      loadRoles();
    }
  }, [user?.restauranteId]);

  useEffect(() => {
    if (user?.restauranteId && roles.length > 0) {
      loadMeseros();
    }
  }, [user?.restauranteId, roles]);

  const loadMesas = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await mesasService.obtenerPorRestauranteId(user.restauranteId);
      // Ordenar por número
      const sorted = data.sort((a, b) => a.numero.localeCompare(b.numero));
      setMesas(sorted);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las mesas');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar roles:', err);
    }
  };

  const loadMeseros = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoadingMeseros(true);
      // Buscar el rol "Mesero"
      const rolMesero = roles.find(r => r.nombre.toLowerCase() === 'mesero');
      if (!rolMesero) {
        setMeseros([]);
        return;
      }

      // Cargar usuarios del restaurante con rol de mesero
      const usuarios = await usuariosService.obtenerPorRestauranteId(user.restauranteId);
      const meserosFiltrados = usuarios.filter(u => 
        u.rolId === rolMesero.id && u.activo
      );
      // Ordenar por nombre
      const sorted = meserosFiltrados.sort((a, b) => {
        const nombreA = `${a.nombre || ''} ${a.apellido || ''}`.trim() || a.correo;
        const nombreB = `${b.nombre || ''} ${b.apellido || ''}`.trim() || b.correo;
        return nombreA.localeCompare(nombreB);
      });
      setMeseros(sorted);
    } catch (err: any) {
      console.error('Error al cargar meseros:', err);
      setMeseros([]);
    } finally {
      setLoadingMeseros(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        return { ...prev, [name]: checked };
      }
      if (name === 'capacidad' || name === 'piso') {
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
        numero: formData.numero?.trim() || '',
      };

      if (formData.nombre?.trim()) {
        datosEnviar.nombre = formData.nombre.trim();
      }

      if (formData.codigoQr?.trim() && formData.codigoQr.trim() !== '') {
        datosEnviar.codigoQr = formData.codigoQr.trim();
      }

      if (formData.imagenQrUrl?.trim() && formData.imagenQrUrl.trim() !== '') {
        datosEnviar.imagenQrUrl = formData.imagenQrUrl.trim();
      }

      if (formData.capacidad !== undefined && formData.capacidad !== null && formData.capacidad > 0) {
        datosEnviar.capacidad = formData.capacidad;
      }

      if (formData.seccion?.trim()) {
        datosEnviar.seccion = formData.seccion.trim();
      }

      if (formData.piso !== undefined && formData.piso !== null && formData.piso > 0) {
        datosEnviar.piso = formData.piso;
      }

      if (formData.meseroAsignadoId?.trim()) {
        datosEnviar.meseroAsignadoId = formData.meseroAsignadoId.trim();
      }

      if (formData.activa !== undefined) {
        datosEnviar.activa = formData.activa;
      }

      if (formData.ocupada !== undefined) {
        datosEnviar.ocupada = formData.ocupada;
      }

      let mesaResultado: MesaConMesero | null = null;

      if (editingMesa) {
        const { restauranteId, ...datosActualizar } = datosEnviar;
        if (datosActualizar.meseroAsignadoId === '') {
          datosActualizar.meseroAsignadoId = null;
        }
        mesaResultado = await mesasService.actualizar(editingMesa.id, datosActualizar);
        setSuccess('Mesa actualizada exitosamente');
      } else {
        mesaResultado = await mesasService.crear(datosEnviar);
        setSuccess('Mesa creada exitosamente');
      }

      if (mesaResultado) {
        const mesaCompleta = await mesasService.obtenerPorId(mesaResultado.id);
        if (mesaCompleta) {
          setEditingMesa(mesaCompleta);
          setFormData({
            numero: mesaCompleta.numero,
            nombre: mesaCompleta.nombre || '',
            codigoQr: mesaCompleta.codigoQr || '',
            imagenQrUrl: mesaCompleta.imagenQrUrl || '',
            capacidad: mesaCompleta.capacidad,
            seccion: mesaCompleta.seccion || '',
            piso: mesaCompleta.piso,
            meseroAsignadoId: mesaCompleta.meseroAsignadoId || '',
            activa: mesaCompleta.activa,
            ocupada: mesaCompleta.ocupada,
          });
          setShowForm(true);
        }
      }

      loadMesas();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la mesa');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (mesa: MesaConMesero) => {
    setEditingMesa(mesa);
    setFormData({
      numero: mesa.numero,
      nombre: mesa.nombre || '',
      codigoQr: mesa.codigoQr || '',
      imagenQrUrl: mesa.imagenQrUrl || '',
      capacidad: mesa.capacidad,
      seccion: mesa.seccion || '',
      piso: mesa.piso,
      meseroAsignadoId: mesa.meseroAsignadoId || '',
      activa: mesa.activa,
      ocupada: mesa.ocupada,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta mesa? Esta acción no se puede deshacer.')) return;

    try {
      setError(null);
      await mesasService.eliminar(id);
      setSuccess('Mesa eliminada exitosamente');
      loadMesas();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la mesa');
    }
  };

  const handleToggleActiva = async (mesa: MesaConMesero) => {
    try {
      setError(null);
      await mesasService.actualizar(mesa.id, { activa: !mesa.activa });
      setSuccess(`Mesa ${mesa.activa ? 'desactivada' : 'activada'} exitosamente`);
      loadMesas();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la mesa');
    }
  };

  const handleRegenerarQR = async (mesa: MesaConMesero) => {
    try {
      setError(null);
      setSuccess(null);
      await mesasService.regenerarQR(mesa.id);
      setSuccess('QR regenerado exitosamente');
      loadMesas();
      if (editingMesa?.id === mesa.id) {
        const mesaActualizada = await mesasService.obtenerPorId(mesa.id);
        setEditingMesa(mesaActualizada);
        setFormData({
          numero: mesaActualizada.numero,
          nombre: mesaActualizada.nombre || '',
          codigoQr: mesaActualizada.codigoQr || '',
          imagenQrUrl: mesaActualizada.imagenQrUrl || '',
          capacidad: mesaActualizada.capacidad,
          seccion: mesaActualizada.seccion || '',
          piso: mesaActualizada.piso,
          meseroAsignadoId: mesaActualizada.meseroAsignadoId || '',
          activa: mesaActualizada.activa,
          ocupada: mesaActualizada.ocupada,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Error al regenerar el QR');
    }
  };

  const handleToggleOcupada = async (mesa: MesaConMesero) => {
    try {
      setError(null);
      await mesasService.actualizar(mesa.id, { ocupada: !mesa.ocupada });
      setSuccess(`Mesa ${mesa.ocupada ? 'marcada como disponible' : 'marcada como ocupada'} exitosamente`);
      loadMesas();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la mesa');
    }
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      nombre: '',
      codigoQr: '',
      imagenQrUrl: '',
      capacidad: 4,
      seccion: '',
      piso: 1,
      meseroAsignadoId: '',
      activa: true,
      ocupada: false,
    });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingMesa(null);
    resetForm();
  };

  const getTotalOcupadas = () => {
    return mesas.filter(m => m.ocupada).length;
  };

  const getTotalDisponibles = () => {
    return mesas.filter(m => !m.ocupada && m.activa).length;
  };

  const getCapacidadTotal = () => {
    return mesas.reduce((sum, mesa) => sum + mesa.capacidad, 0);
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
                  <Table className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex flex-wrap items-center gap-2 sm:gap-3">
                  <span>Mesas del Restaurante</span>
                  {mesas.length > 0 && !loading && (
                    <span className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                      {mesas.length}
                    </span>
                  )}
                </h1>
                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                  Gestiona las mesas y códigos QR de tu restaurante
                </p>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingMesa(null);
                  resetForm();
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2.5 sm:py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="whitespace-nowrap">Nueva Mesa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {mesas.length > 0 && !loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                <Table className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Mesas</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{mesas.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Disponibles</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{getTotalDisponibles()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Ocupadas</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{getTotalOcupadas()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
              </div>
              <div className="ml-2 sm:ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Capacidad Total</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">{getCapacidadTotal()}</p>
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
            {editingMesa ? 'Editar Mesa' : 'Nueva Mesa'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="numero" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Mesa *
                </label>
                <input
                  type="text"
                  name="numero"
                  id="numero"
                  required
                  value={formData.numero}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Ej: Mesa 1, M-01"
                />
              </div>

              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre (Opcional)
                </label>
                <input
                  type="text"
                  name="nombre"
                  id="nombre"
                  value={formData.nombre || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Ej: Mesa VIP, Terraza Principal"
                />
              </div>

              <div>
                <label htmlFor="capacidad" className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidad *
                </label>
                <input
                  type="number"
                  name="capacidad"
                  id="capacidad"
                  min="1"
                  required
                  value={formData.capacidad || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="4"
                />
              </div>

              <div>
                <label htmlFor="seccion" className="block text-sm font-medium text-gray-700 mb-2">
                  Sección
                </label>
                <input
                  type="text"
                  name="seccion"
                  id="seccion"
                  value={formData.seccion || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Ej: Interior, Terraza, Bar"
                />
              </div>

              <div>
                <label htmlFor="piso" className="block text-sm font-medium text-gray-700 mb-2">
                  Piso
                </label>
                <input
                  type="number"
                  name="piso"
                  id="piso"
                  min="1"
                  value={formData.piso || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="1"
                />
              </div>

              <div>
                <label htmlFor="meseroAsignadoId" className="block text-sm font-medium text-gray-700 mb-2">
                  Mesero Asignado
                </label>
                <select
                  name="meseroAsignadoId"
                  id="meseroAsignadoId"
                  value={formData.meseroAsignadoId || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white sm:text-sm transition-colors"
                  disabled={loadingMeseros}
                >
                  <option value="">Sin mesero asignado</option>
                  {meseros.map((mesero) => {
                    const nombreCompleto = `${mesero.nombre || ''} ${mesero.apellido || ''}`.trim() || mesero.correo;
                    return (
                      <option key={mesero.id} value={mesero.id}>
                        {nombreCompleto} {mesero.correo && `(${mesero.correo})`}
                      </option>
                    );
                  })}
                </select>
                {loadingMeseros && (
                  <p className="mt-1 text-xs text-gray-500">Cargando meseros...</p>
                )}
                {!loadingMeseros && meseros.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">No hay meseros disponibles. Crea usuarios con rol de Mesero.</p>
                )}
              </div>

              {/* Información sobre QR automático */}
              <div className="sm:col-span-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <QrCode className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-green-900">Código QR Automático</h3>
                      <p className="mt-1 text-xs text-green-700">
                        El código QR se generará automáticamente cuando crees la mesa. 
                        {editingMesa && (
                          <span className="block mt-1">
                            Puedes regenerarlo usando el botón "Regenerar QR" en la lista de mesas.
                          </span>
                        )}
                      </p>
                      {editingMesa?.imagenQrUrl && (
                        <div className="mt-3">
                          <p className="text-xs text-green-700 mb-2 font-medium">QR Actual:</p>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div 
                              className="cursor-pointer group flex-shrink-0 mx-auto sm:mx-0"
                              onClick={() => setSelectedQR({
                                imagenUrl: editingMesa.imagenQrUrl!,
                                codigoQr: editingMesa.codigoQr || '',
                                numero: editingMesa.numero,
                                nombre: editingMesa.nombre || undefined,
                              })}
                            >
                              <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-lg border-2 border-green-200 p-2 group-hover:border-green-400 group-hover:shadow-lg transition-all">
                                <img
                                  src={editingMesa.imagenQrUrl}
                                  alt="QR de la mesa"
                                  className="w-full h-full object-contain rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-green-600/0 group-hover:bg-green-600/10 rounded-lg transition-colors">
                                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 text-center mt-1 group-hover:text-green-600 transition-colors whitespace-nowrap">
                                Ver en grande
                              </p>
                            </div>
                            <div className="flex-1 min-w-0 w-full sm:w-auto">
                              <p className="text-xs text-green-700 font-semibold mb-1">Enlace:</p>
                              <code className="block text-xs text-green-600 font-mono break-all bg-green-50 px-2 py-1 rounded border border-green-200">
                                {editingMesa.codigoQr || 'No disponible'}
                              </code>
                              {editingMesa.codigoQr && (
                                <a
                                  href={editingMesa.codigoQr}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-1 font-medium"
                                >
                                  Abrir enlace <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos manuales ocultos por defecto */}
              <details className="sm:col-span-2">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Opciones avanzadas de QR (opcional)
                </summary>
                <div className="mt-3 space-y-4 pt-3 border-t border-gray-200">
                  <div>
                    <label htmlFor="codigoQr" className="block text-sm font-medium text-gray-700 mb-2">
                      Código QR Personalizado
                    </label>
                    <input
                      type="text"
                      name="codigoQr"
                      id="codigoQr"
                      value={formData.codigoQr || ''}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                      placeholder="URL personalizada del QR (opcional)"
                    />
                    <p className="mt-1 text-xs text-gray-500">Deja vacío para generación automática</p>
                  </div>

                  <div>
                    <label htmlFor="imagenQrUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      URL de Imagen QR Personalizada
                    </label>
                    <input
                      type="url"
                      name="imagenQrUrl"
                      id="imagenQrUrl"
                      value={formData.imagenQrUrl || ''}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                      placeholder="https://ejemplo.com/qr-mesa.png"
                    />
                    <p className="mt-1 text-xs text-gray-500">Deja vacío para generación automática</p>
                    {formData.imagenQrUrl && (
                      <div className="mt-2">
                        <img
                          src={formData.imagenQrUrl}
                          alt="Vista previa QR"
                          className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </details>

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
                    <span className="block text-sm font-medium text-gray-900">Mesa Activa</span>
                    <span className="block text-xs text-gray-500">Disponible para uso</span>
                  </div>
                </label>
              </div>

              <div className="flex items-end">
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors w-full">
                  <input
                    type="checkbox"
                    name="ocupada"
                    checked={formData.ocupada ?? false}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Mesa Ocupada</span>
                    <span className="block text-xs text-gray-500">Marcar como ocupada</span>
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
                    {editingMesa ? 'Actualizar' : 'Crear'} Mesa
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de mesas - Vista mejorada con cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-green-600" />
        </div>
      ) : mesas.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Table className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No hay mesas</h3>
          <p className="mt-2 text-sm text-gray-500">Comienza agregando tu primera mesa.</p>
          <div className="mt-6">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingMesa(null);
                resetForm();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Mesa
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Grid de cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mesas.map((mesa) => (
              <div
                key={mesa.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md overflow-hidden ${
                  mesa.activa 
                    ? mesa.ocupada 
                      ? 'border-red-200 bg-red-50' 
                      : 'border-green-200' 
                    : 'border-gray-300 opacity-75'
                }`}
              >
                <div className="p-5">
                  {/* Header del card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Table className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {mesa.numero}
                        </h3>
                      </div>
                      {mesa.nombre && (
                        <p className="text-sm text-gray-600 mt-1">{mesa.nombre}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {!mesa.activa && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactiva
                        </span>
                      )}
                      {mesa.ocupada && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="h-3 w-3 mr-1" />
                          Ocupada
                        </span>
                      )}
                      {!mesa.ocupada && mesa.activa && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Disponible
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Información de la mesa */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                      <span>{mesa.capacidad} personas</span>
                    </div>
                    {mesa.seccion && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span>{mesa.seccion}</span>
                      </div>
                    )}
                    {mesa.piso > 1 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span>Piso {mesa.piso}</span>
                      </div>
                    )}
                    {mesa.meseroNombre && (
                      <div className="flex items-center text-sm">
                        <User className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                        <span className="text-purple-600 font-medium">{mesa.meseroNombre}</span>
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  {mesa.imagenQrUrl && (
                    <div className="mb-4 p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:border-green-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-xs text-gray-700 font-medium">
                          <QrCode className="h-4 w-4 mr-1.5 text-green-600" />
                          <span>Código QR</span>
                        </div>
                      </div>
                      <div 
                        className="cursor-pointer group"
                        onClick={() => setSelectedQR({
                          imagenUrl: mesa.imagenQrUrl!,
                          codigoQr: mesa.codigoQr || '',
                          numero: mesa.numero,
                          nombre: mesa.nombre || undefined,
                        })}
                      >
                        <div className="relative mx-auto w-28 h-28 bg-white rounded-lg border-2 border-green-200 p-2 group-hover:border-green-400 group-hover:shadow-lg transition-all">
                          <img
                            src={mesa.imagenQrUrl}
                            alt={`QR ${mesa.numero}`}
                            className="w-full h-full object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-green-600/0 group-hover:bg-green-600/10 rounded-lg transition-colors">
                            <Eye className="h-6 w-6 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 text-center mt-2 group-hover:text-green-600 transition-colors">
                          Haz clic para ver en grande
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center justify-center sm:justify-end space-x-1 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleOcupada(mesa)}
                      className={`p-1.5 transition-colors ${
                        mesa.ocupada
                          ? 'text-red-600 hover:text-red-700'
                          : 'text-green-600 hover:text-green-700'
                      }`}
                      title={mesa.ocupada ? 'Marcar como disponible' : 'Marcar como ocupada'}
                    >
                      {mesa.ocupada ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </button>
                    {mesa.imagenQrUrl && (
                      <button
                        onClick={() => handleRegenerarQR(mesa)}
                        className="p-1.5 text-blue-400 hover:text-blue-600 transition-colors"
                        title="Regenerar QR"
                      >
                        <RotateCw className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActiva(mesa)}
                      className={`p-1.5 transition-colors ${
                        mesa.activa
                          ? 'text-green-600 hover:text-green-700'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={mesa.activa ? 'Desactivar' : 'Activar'}
                    >
                      {mesa.activa ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(mesa)}
                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(mesa.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal para ver QR en grande */}
      {selectedQR && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setSelectedQR(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto border border-gray-200">
              <div className="sticky top-0 bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="p-1.5 sm:p-2 bg-green-600 rounded-lg flex-shrink-0">
                    <QrCode className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                      Código QR - Mesa {selectedQR.numero}
                    </h3>
                    {selectedQR.nombre && (
                      <p className="text-xs sm:text-sm text-gray-600 truncate">{selectedQR.nombre}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedQR(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 sm:p-6">
                {/* Imagen QR Grande */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200">
                  <img
                    src={selectedQR.imagenUrl}
                    alt={`QR Mesa ${selectedQR.numero}`}
                    className="w-full max-w-sm mx-auto aspect-square object-contain bg-white p-4 rounded-lg border-2 border-green-200 shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* Información del QR */}
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enlace del QR
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-900 break-all font-mono min-w-0">
                        {selectedQR.codigoQr || 'No disponible'}
                      </code>
                      {selectedQR.codigoQr && (
                        <a
                          href={selectedQR.codigoQr}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="sm:flex-shrink-0 inline-flex items-center justify-center p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          title="Abrir enlace"
                        >
                          <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        if (selectedQR.imagenUrl) {
                          const link = document.createElement('a');
                          link.href = selectedQR.imagenUrl;
                          link.download = `qr-mesa-${selectedQR.numero}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }
                      }}
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-green-700 transition-colors"
                    >
                      <Download className="h-4 w-4 sm:h-5 sm:w-5" />
                      Descargar QR
                    </button>
                    {selectedQR.codigoQr && (
                      <a
                        href={selectedQR.codigoQr}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5" />
                        Abrir Menú
                      </a>
                    )}
                  </div>

                  {/* Instrucciones */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Instrucciones:</strong> Los clientes pueden escanear este código QR con su teléfono para acceder directamente al menú de esta mesa.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
