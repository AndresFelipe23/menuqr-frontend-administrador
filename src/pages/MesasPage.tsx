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
  GripVertical,
  QrCode,
  Users,
  MapPin,
  User,
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

  const [formData, setFormData] = useState<CrearMesaDto & ActualizarMesaDto>({
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

      // Preparar datos para enviar, convirtiendo tipos y limpiando campos vacíos
      const datosEnviar: any = {
        restauranteId: user.restauranteId,
        numero: formData.numero.trim(),
      };

      // Solo incluir campos opcionales si tienen valor
      if (formData.nombre?.trim()) {
        datosEnviar.nombre = formData.nombre.trim();
      }

      // No enviar codigoQr ni imagenQrUrl - se generan automáticamente
      // Solo se envían si el usuario quiere sobrescribir manualmente
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

      // Incluir activa y ocupada
      if (formData.activa !== undefined) {
        datosEnviar.activa = formData.activa;
      }

      if (formData.ocupada !== undefined) {
        datosEnviar.ocupada = formData.ocupada;
      }

      let mesaResultado: MesaConMesero | null = null;

      if (editingMesa) {
        // Actualizar - remover restauranteId del objeto para actualizar
        const { restauranteId, ...datosActualizar } = datosEnviar;
        // Si meseroAsignadoId está vacío, enviar null
        if (datosActualizar.meseroAsignadoId === '') {
          datosActualizar.meseroAsignadoId = null;
        }
        mesaResultado = await mesasService.actualizar(editingMesa.id, datosActualizar);
        setSuccess('Mesa actualizada exitosamente');
      } else {
        // Crear
        mesaResultado = await mesasService.crear(datosEnviar);
        setSuccess('Mesa creada exitosamente');
      }

      // Recargar la mesa para obtener el QR generado automáticamente
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
          // Mantener el formulario abierto para mostrar el QR generado
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
      // Si estamos editando esta mesa, actualizar el formulario
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
            <h1 className="text-2xl font-bold text-gray-900">Mesas del Restaurante</h1>
            <p className="mt-1 text-sm text-gray-500">Gestiona las mesas de tu restaurante</p>
          </div>
          {!showForm && (
            <button
              onClick={() => {
                setShowForm(true);
                setEditingMesa(null);
                resetForm();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Mesa
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white sm:text-sm transition-colors"
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <QrCode className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-blue-900">Código QR Automático</h3>
                      <p className="mt-1 text-xs text-blue-700">
                        El código QR se generará automáticamente cuando crees la mesa. 
                        {editingMesa && (
                          <span className="block mt-1">
                            Puedes regenerarlo usando el botón "Regenerar QR" en la lista de mesas.
                          </span>
                        )}
                      </p>
                      {editingMesa?.imagenQrUrl && (
                        <div className="mt-3">
                          <p className="text-xs text-blue-700 mb-2">QR Actual:</p>
                          <div className="flex items-center gap-3">
                            <img
                              src={editingMesa.imagenQrUrl}
                              alt="QR de la mesa"
                              className="h-24 w-24 object-contain rounded-lg border border-blue-200 bg-white p-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="flex-1">
                              <p className="text-xs text-blue-600 font-mono break-all">
                                {editingMesa.codigoQr}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos manuales ocultos por defecto (opcional para casos especiales) */}
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
                      className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                      className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
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
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors w-full">
                  <input
                    type="checkbox"
                    name="activa"
                    checked={formData.activa ?? true}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Mesa Activa</span>
                    <span className="block text-xs text-gray-500">Disponible para uso</span>
                  </div>
                </label>
              </div>

              <div className="flex items-end">
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 cursor-pointer transition-colors w-full">
                  <input
                    type="checkbox"
                    name="ocupada"
                    checked={formData.ocupada ?? false}
                    onChange={handleChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Mesa Ocupada</span>
                    <span className="block text-xs text-gray-500">Marcar como ocupada</span>
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
                    {editingMesa ? 'Actualizar' : 'Crear'} Mesa
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de mesas */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
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
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Mesa
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {mesas.map((mesa) => (
              <li key={mesa.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <GripVertical className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {mesa.numero} {mesa.nombre && `- ${mesa.nombre}`}
                        </p>
                        {!mesa.activa && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Inactiva
                          </span>
                        )}
                        {mesa.ocupada && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Ocupada
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{mesa.capacidad} personas</span>
                        </div>
                        {mesa.seccion && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{mesa.seccion}</span>
                          </div>
                        )}
                        {mesa.piso > 1 && (
                          <span>Piso {mesa.piso}</span>
                        )}
                        {mesa.meseroNombre && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{mesa.meseroNombre}</span>
                          </div>
                        )}
                      </div>
                      {mesa.imagenQrUrl && (
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <QrCode className="h-3 w-3 mr-1" />
                          <span>QR disponible</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleOcupada(mesa)}
                      className={`p-2 rounded transition-colors ${
                        mesa.ocupada
                          ? 'text-red-400 hover:text-red-600 hover:bg-red-50'
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                      title={mesa.ocupada ? 'Marcar como disponible' : 'Marcar como ocupada'}
                    >
                      {mesa.ocupada ? (
                        <span className="text-xs font-medium">Ocupada</span>
                      ) : (
                        <span className="text-xs font-medium">Libre</span>
                      )}
                    </button>
                    {mesa.imagenQrUrl && (
                      <button
                        onClick={() => handleRegenerarQR(mesa)}
                        className="p-2 text-indigo-400 hover:text-indigo-600 transition-colors"
                        title="Regenerar QR"
                      >
                        <QrCode className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleActiva(mesa)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title={mesa.activa ? 'Desactivar' : 'Activar'}
                    >
                      {mesa.activa ? (
                        <Eye className="h-5 w-5" />
                      ) : (
                        <EyeOff className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEdit(mesa)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(mesa.id)}
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

