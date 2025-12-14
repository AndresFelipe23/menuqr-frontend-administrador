import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { comentariosService } from '../services';
import type { ComentarioConUsuario, CrearComentarioDto, TipoComentario, EstadoComentario, PrioridadComentario } from '../types/api.types';
import Swal from 'sweetalert2';
import {
  MessageSquare,
  Plus,
  Trash2,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  Info,
  HelpCircle,
  Lightbulb,
  User,
} from 'lucide-react';

// Mapeo de tipos a iconos y colores
const TIPO_ICONS: Record<TipoComentario, any> = {
  comentario: MessageSquare,
  queja: AlertTriangle,
  solicitud: Info,
  sugerencia: Lightbulb,
  pregunta: HelpCircle,
};

const TIPO_COLORS: Record<TipoComentario, string> = {
  comentario: 'bg-blue-100 text-blue-800 border-blue-200',
  queja: 'bg-red-100 text-red-800 border-red-200',
  solicitud: 'bg-purple-100 text-purple-800 border-purple-200',
  sugerencia: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  pregunta: 'bg-green-100 text-green-800 border-green-200',
};

const ESTADO_COLORS: Record<EstadoComentario, string> = {
  pendiente: 'bg-gray-100 text-gray-800 border-gray-200',
  en_proceso: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  resuelto: 'bg-green-100 text-green-800 border-green-200',
  cerrado: 'bg-gray-100 text-gray-600 border-gray-200',
};

const PRIORIDAD_COLORS: Record<PrioridadComentario, string> = {
  baja: 'bg-gray-100 text-gray-600 border-gray-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  alta: 'bg-orange-100 text-orange-800 border-orange-200',
  urgente: 'bg-red-100 text-red-800 border-red-200',
};

export default function ComentariosPage() {
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const [comentarios, setComentarios] = useState<ComentarioConUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedComentario, setSelectedComentario] = useState<ComentarioConUsuario | null>(null);
  const [showRespuesta, setShowRespuesta] = useState<string | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [filtros, setFiltros] = useState({
    tipo: '' as TipoComentario | '',
    estado: '' as EstadoComentario | '',
    prioridad: '' as PrioridadComentario | '',
    asunto: '',
    verSoloMios: false,
  });
  const [paginacion, setPaginacion] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [formData, setFormData] = useState<CrearComentarioDto>({
    tipo: 'comentario',
    asunto: '',
    mensaje: '',
    prioridad: 'normal',
  });

  useEffect(() => {
    // Cargar comentarios si tiene restauranteId O si es SuperAdministrador
    if (user?.restauranteId || hasRole('SuperAdministrador')) {
      loadComentarios();
    }
  }, [user?.restauranteId, paginacion.page, filtros]);

  const loadComentarios = async () => {
    // SuperAdministrador puede ver todos los comentarios sin restauranteId
    const esSuperAdmin = hasRole('SuperAdministrador');
    
    if (!user?.restauranteId && !esSuperAdmin) {
      setComentarios([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const query: any = {
        page: paginacion.page,
        limit: paginacion.limit,
        orden: 'desc',
      };
      
      // Solo agregar restauranteId si NO es SuperAdmin o si tiene restauranteId
      // SuperAdmin puede ver todos los comentarios omitiendo este filtro
      if (user?.restauranteId && !esSuperAdmin) {
        query.restauranteId = user.restauranteId;
      }
      
      if (filtros.verSoloMios && user?.id) {
        query.usuarioId = user.id;
      }
      
      if (filtros.tipo) query.tipo = filtros.tipo;
      if (filtros.estado) query.estado = filtros.estado;
      if (filtros.prioridad) query.prioridad = filtros.prioridad;
      if (filtros.asunto) query.asunto = filtros.asunto;

      const data = await comentariosService.obtenerTodos(query);
      setComentarios(data.items || []);
      setPaginacion({
        ...paginacion,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
        hasNext: data.pagination?.hasNext || false,
        hasPrev: data.pagination?.hasPrev || false,
      });
    } catch (err: any) {
      setError(err.message || 'Error al cargar los comentarios');
      setComentarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFiltroChange = (name: string, value: string | boolean) => {
    setFiltros((prev) => ({
      ...prev,
      [name]: typeof value === 'boolean' ? value : (value || ''),
    }));
    setPaginacion((prev) => ({ ...prev, page: 1 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // SuperAdministrador no necesita restauranteId para crear comentarios
    const esSuperAdmin = hasRole('SuperAdministrador');
    if (!user?.restauranteId && !esSuperAdmin) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const datosEnviar: CrearComentarioDto = {
        restauranteId: user?.restauranteId || undefined, // Opcional para SuperAdmin
        tipo: formData.tipo,
        asunto: formData.asunto.trim(),
        mensaje: formData.mensaje.trim(),
        prioridad: formData.prioridad || 'normal',
      };

      await comentariosService.crear(datosEnviar);
      setSuccess('Comentario creado exitosamente');
      setShowForm(false);
      resetForm();
      
      setPaginacion((prev) => ({ ...prev, page: 1 }));
      setFiltros({
        tipo: '' as TipoComentario | '',
        estado: '' as EstadoComentario | '',
        prioridad: '' as PrioridadComentario | '',
        asunto: '',
        verSoloMios: false,
      });
      
      await loadComentarios();
    } catch (err: any) {
      setError(err.message || 'Error al crear el comentario');
    } finally {
      setSaving(false);
    }
  };

  const handleResponder = async (id: string) => {
    if (!respuestaTexto.trim()) {
      setError('Por favor, escribe una respuesta');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await comentariosService.responder(id, respuestaTexto.trim());
      setSuccess('Respuesta agregada exitosamente');
      setShowRespuesta(null);
      setRespuestaTexto('');
      await loadComentarios();
    } catch (err: any) {
      setError(err.message || 'Error al responder el comentario');
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = async (id: string) => {
    const resultado = await Swal.fire({
      title: '¿Eliminar solicitud?',
      text: 'Esta acción no se puede deshacer. La solicitud será eliminada permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusConfirm: false,
      focusCancel: true,
    });

    if (!resultado.isConfirmed) return;

    try {
      setSaving(true);
      setError(null);
      await comentariosService.eliminar(id);
      
      await Swal.fire({
        title: '¡Eliminado!',
        text: 'La solicitud ha sido eliminada exitosamente.',
        icon: 'success',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'Aceptar',
        timer: 2000,
        timerProgressBar: true,
      });
      
      await loadComentarios();
    } catch (err: any) {
      await Swal.fire({
        title: 'Error',
        text: err.message || 'Error al eliminar la solicitud',
        icon: 'error',
        confirmButtonColor: '#dc2626',
        confirmButtonText: 'Aceptar',
      });
      setError(err.message || 'Error al eliminar el comentario');
    } finally {
      setSaving(false);
    }
  };

  const handleActualizarEstado = async (id: string, nuevoEstado: EstadoComentario) => {
    try {
      setSaving(true);
      setError(null);
      await comentariosService.actualizar(id, { estado: nuevoEstado });
      setSuccess('Estado actualizado exitosamente');
      await loadComentarios();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el estado');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'comentario',
      asunto: '',
      mensaje: '',
      prioridad: 'normal',
    });
    setSelectedComentario(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    resetForm();
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                </div>
                Comentarios y Solicitudes
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                Gestiona comentarios, quejas, solicitudes y sugerencias
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                resetForm();
              }}
              className="inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-2.5 border border-transparent rounded-lg shadow-sm text-sm sm:text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              <span className="hidden sm:inline">Nuevo Comentario</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border-l-4 border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-start gap-3 shadow-sm">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-400 hover:text-green-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="space-y-4">
            {/* Checkbox para ver solo mis comentarios */}
            <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
              <label className="relative flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={filtros.verSoloMios}
                  onChange={(e) => handleFiltroChange('verSoloMios', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Ver solo mis comentarios
                </span>
              </label>
            </div>
            
            {/* Filtros en grid responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="h-4 w-4 inline mr-1" />
                  Buscar por asunto
                </label>
                <input
                  type="text"
                  value={filtros.asunto}
                  onChange={(e) => handleFiltroChange('asunto', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Buscar comentarios..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={filtros.tipo}
                  onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white"
                >
                  <option value="">Todos</option>
                  <option value="comentario">Comentario</option>
                  <option value="queja">Queja</option>
                  <option value="solicitud">Solicitud</option>
                  <option value="sugerencia">Sugerencia</option>
                  <option value="pregunta">Pregunta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={filtros.estado}
                  onChange={(e) => handleFiltroChange('estado', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white"
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="resuelto">Resuelto</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                <select
                  value={filtros.prioridad}
                  onChange={(e) => handleFiltroChange('prioridad', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white"
                >
                  <option value="">Todas</option>
                  <option value="baja">Baja</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de creación */}
        {showForm && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {selectedComentario ? 'Editar Comentario' : 'Nuevo Comentario'}
              </h2>
              <button
                onClick={cancelForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white"
                  >
                    <option value="comentario">Comentario</option>
                    <option value="queja">Queja</option>
                    <option value="solicitud">Solicitud</option>
                    <option value="sugerencia">Sugerencia</option>
                    <option value="pregunta">Pregunta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad
                  </label>
                  <select
                    name="prioridad"
                    value={formData.prioridad}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors bg-white"
                  >
                    <option value="baja">Baja</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asunto *
                </label>
                <input
                  type="text"
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="Título del comentario..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje *
                </label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Describe tu comentario, queja o solicitud..."
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de comentarios */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 text-green-600 mx-auto mb-4" />
              <p className="text-sm text-gray-600">Cargando comentarios...</p>
            </div>
          </div>
        ) : !comentarios || comentarios.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay comentarios</h3>
            <p className="text-sm text-gray-500">Aún no hay comentarios registrados.</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {comentarios.map((comentario) => {
              const TipoIcon = TIPO_ICONS[comentario.tipo as TipoComentario];
              return (
                <div
                  key={comentario.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header del comentario */}
                      <div className="flex items-start gap-3 sm:gap-4 mb-4">
                        <div className={`p-2.5 rounded-lg border ${TIPO_COLORS[comentario.tipo as TipoComentario]} flex-shrink-0`}>
                          <TipoIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 break-words">
                            {comentario.asunto}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${TIPO_COLORS[comentario.tipo as TipoComentario]}`}>
                              {comentario.tipo}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ESTADO_COLORS[comentario.estado as EstadoComentario]}`}>
                              {comentario.estado.replace('_', ' ')}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${PRIORIDAD_COLORS[comentario.prioridad as PrioridadComentario]}`}>
                              {comentario.prioridad}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Mensaje */}
                      <div className="mb-4">
                        <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap break-words">
                          {comentario.mensaje}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-4">
                        {comentario.nombreUsuario && (
                          <span className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{comentario.nombreUsuario}</span>
                            {comentario.correoUsuario && (
                              <span className="text-gray-400">({comentario.correoUsuario})</span>
                            )}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {new Date(comentario.fechaCreacion).toLocaleString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Respuesta */}
                      {comentario.respuesta && (
                        <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              <span className="text-sm font-semibold text-green-900">
                                Respuesta del Equipo de Soporte
                              </span>
                            </div>
                            {comentario.fechaRespuesta && (
                              <span className="text-xs text-green-700 flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {new Date(comentario.fechaRespuesta).toLocaleString('es-CO', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                            {comentario.respuesta}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Acciones - Sidebar en desktop */}
                    <div className="flex flex-row sm:flex-col gap-2 lg:flex-shrink-0 lg:min-w-[200px]">
                      {!comentario.respuesta && hasRole('SuperAdministrador') && (
                        <button
                          onClick={() => {
                            setShowRespuesta(showRespuesta === comentario.id ? null : comentario.id);
                            setRespuestaTexto('');
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
                          title="Responder a esta solicitud"
                        >
                          <Send className="h-4 w-4" />
                          <span className="hidden sm:inline">Responder</span>
                          <span className="sm:hidden">Responder</span>
                        </button>
                      )}
                      {comentario.respuesta && (
                        <div className="flex-1 sm:flex-none px-4 py-3 text-xs font-medium text-green-700 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-1.5 mb-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="font-semibold">Respondido</span>
                          </div>
                          <div className="text-green-600 mt-1 text-xs">
                            Equipo de Soporte
                          </div>
                        </div>
                      )}
                      {hasRole('SuperAdministrador') && comentario.estado !== 'resuelto' && comentario.estado !== 'cerrado' && (
                        <select
                          value={comentario.estado}
                          onChange={(e) => handleActualizarEstado(comentario.id, e.target.value as EstadoComentario)}
                          className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_proceso">En Proceso</option>
                          <option value="resuelto">Resuelto</option>
                          <option value="cerrado">Cerrado</option>
                        </select>
                      )}
                      {(hasRole('SuperAdministrador') || comentario.usuarioId === user?.id) && (
                        <button
                          onClick={() => handleEliminar(comentario.id)}
                          className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2 transition-colors"
                          title={hasRole('SuperAdministrador') ? 'Eliminar solicitud' : 'Eliminar mi solicitud'}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Eliminar</span>
                          <span className="sm:hidden">Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Formulario de respuesta */}
                  {showRespuesta === comentario.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Escribir respuesta
                      </label>
                      <textarea
                        value={respuestaTexto}
                        onChange={(e) => setRespuestaTexto(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none mb-3"
                        placeholder="Escribe tu respuesta aquí..."
                      />
                      <div className="flex flex-col sm:flex-row gap-2 justify-end">
                        <button
                          onClick={() => {
                            setShowRespuesta(null);
                            setRespuestaTexto('');
                          }}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => handleResponder(comentario.id)}
                          disabled={saving || !respuestaTexto.trim()}
                          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Enviar Respuesta
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {!loading && comentarios && comentarios.length > 0 && (
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Mostrando {((paginacion.page - 1) * paginacion.limit) + 1} - {Math.min(paginacion.page * paginacion.limit, paginacion.total)} de {paginacion.total} comentarios
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPaginacion((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={!paginacion.hasPrev}
                className="px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </button>
              <div className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg border border-gray-200">
                {paginacion.page} / {paginacion.totalPages}
              </div>
              <button
                onClick={() => setPaginacion((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={!paginacion.hasNext}
                className="px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                <span className="hidden sm:inline">Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
