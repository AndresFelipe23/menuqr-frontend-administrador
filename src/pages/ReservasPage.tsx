import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reservasService, mesasService, usuariosService, suscripcionesService } from '../services';
import { Link } from 'react-router-dom';
import type { MesaConMesero, UsuarioConRol } from '../types/api.types';
import type { ReservaConDetalles, CrearReservaDto, ActualizarReservaDto, QueryReservaDto } from '../services/reservas.service';
import Swal from 'sweetalert2';
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  Phone,
  X,
  CalendarX,
  Users,
  Crown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

const ESTADOS_RESERVA: { value: string; label: string; color: string }[] = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmada', label: 'Confirmada', color: 'bg-blue-100 text-blue-800' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-red-100 text-red-800' },
  { value: 'completada', label: 'Completada', color: 'bg-green-100 text-green-800' },
  { value: 'no_show', label: 'No se presentó', color: 'bg-orange-100 text-orange-800' },
  { value: 'expirada', label: 'Expirada', color: 'bg-gray-100 text-gray-800' },
];

export default function ReservasPage() {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<ReservaConDetalles[]>([]);
  const [mesas, setMesas] = useState<MesaConMesero[]>([]);
  const [meseros, setMeseros] = useState<UsuarioConRol[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingReserva, setEditingReserva] = useState<ReservaConDetalles | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroMesa, setFiltroMesa] = useState<string>('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState<string>('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState<string>('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [esPremium, setEsPremium] = useState(false);
  const [verificandoPlan, setVerificandoPlan] = useState(true);

  const [formData, setFormData] = useState<Partial<CrearReservaDto & ActualizarReservaDto>>({
    mesaId: '',
    nombreCliente: '',
    correoCliente: '',
    telefonoCliente: '',
    fechaReserva: '',
    numeroPersonas: 2,
    notasCliente: '',
    meseroAsignadoId: '',
  });

  // Verificar plan PREMIUM al cargar
  useEffect(() => {
    async function verificarPlan() {
      if (!user?.restauranteId) {
        setVerificandoPlan(false);
        return;
      }

      try {
        const suscripcion = await suscripcionesService.obtenerPorRestauranteId(user.restauranteId);
        const esPlanPremium = suscripcion?.tipoPlan === 'premium' && suscripcion?.estado === 'active';
        setEsPremium(esPlanPremium);
      } catch (err) {
        console.error('Error al verificar plan:', err);
        setEsPremium(false);
      } finally {
        setVerificandoPlan(false);
      }
    }

    verificarPlan();
  }, [user?.restauranteId]);

  useEffect(() => {
    if (user?.restauranteId && esPremium) {
      loadReservas();
      loadMesas();
      loadMeseros();
    }
  }, [user?.restauranteId, esPremium, pagination.page, filtroEstado, filtroMesa, filtroFechaDesde, filtroFechaHasta]);

  const loadReservas = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoading(true);
      setError(null);
      
      const query: QueryReservaDto = {
        page: pagination.page,
        limit: pagination.limit,
        restauranteId: user.restauranteId,
        estado: filtroEstado || undefined,
        mesaId: filtroMesa || undefined,
        fechaDesde: filtroFechaDesde || undefined,
        fechaHasta: filtroFechaHasta || undefined,
        orden: 'desc',
        ordenPor: 'fecha_reserva',
      };

      const data = await reservasService.obtenerTodas(query);
      setReservas(data.items || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (err: any) {
      setError(err.message || 'Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  const loadMesas = async () => {
    if (!user?.restauranteId) return;

    try {
      const data = await mesasService.obtenerPorRestauranteId(user.restauranteId);
      const sorted = data.filter(m => m.activa).sort((a, b) => a.numero.localeCompare(b.numero));
      setMesas(sorted);
    } catch (err: any) {
      console.error('Error al cargar mesas:', err);
    }
  };

  const loadMeseros = async () => {
    if (!user?.restauranteId) return;

    try {
      const rolesResponse = await fetch(`${import.meta.env.VITE_API_URL}/roles`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      let rolMeseroId = '';
      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        const rolMesero = rolesData.data?.find((r: any) => r.nombre.toLowerCase() === 'mesero');
        if (rolMesero) {
          rolMeseroId = rolMesero.id;
        }
      }

      const usuarios = await usuariosService.obtenerPorRestauranteId(user.restauranteId);
      const meserosFiltrados = usuarios.filter(u => 
        u.rolId === rolMeseroId && u.activo
      );
      const sorted = meserosFiltrados.sort((a, b) => {
        const nombreA = `${a.nombre || ''} ${a.apellido || ''}`.trim() || a.correo;
        const nombreB = `${b.nombre || ''} ${b.apellido || ''}`.trim() || b.correo;
        return nombreA.localeCompare(nombreB);
      });
      setMeseros(sorted);
    } catch (err: any) {
      console.error('Error al cargar meseros:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.restauranteId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (editingReserva) {
        // Actualizar
        const datosActualizar: ActualizarReservaDto = {
          mesaId: formData.mesaId || undefined,
          nombreCliente: formData.nombreCliente || undefined,
          correoCliente: formData.correoCliente || undefined,
          telefonoCliente: formData.telefonoCliente || undefined,
          fechaReserva: formData.fechaReserva || undefined,
          numeroPersonas: formData.numeroPersonas || undefined,
          notasCliente: formData.notasCliente || undefined,
          meseroAsignadoId: formData.meseroAsignadoId || undefined,
        };

        await reservasService.actualizar(editingReserva.id, datosActualizar);
        setSuccess('Reserva actualizada exitosamente');
      } else {
        // Crear
        const datosCrear: CrearReservaDto = {
          restauranteId: user.restauranteId,
          mesaId: formData.mesaId!,
          nombreCliente: formData.nombreCliente!,
          correoCliente: formData.correoCliente!,
          telefonoCliente: formData.telefonoCliente!,
          fechaReserva: formData.fechaReserva!,
          numeroPersonas: formData.numeroPersonas || 2,
          notasCliente: formData.notasCliente || undefined,
          meseroAsignadoId: formData.meseroAsignadoId || undefined,
        };

        await reservasService.crear(datosCrear);
        setSuccess('Reserva creada exitosamente');
      }

      setShowForm(false);
      resetForm();
      loadReservas();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la reserva');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reserva: ReservaConDetalles) => {
    setEditingReserva(reserva);
    setFormData({
      mesaId: reserva.mesaId,
      nombreCliente: reserva.nombreCliente,
      correoCliente: reserva.correoCliente,
      telefonoCliente: reserva.telefonoCliente,
      fechaReserva: reserva.fechaReserva ? new Date(reserva.fechaReserva).toISOString().slice(0, 16) : '',
      numeroPersonas: reserva.numeroPersonas,
      notasCliente: reserva.notasCliente || '',
      meseroAsignadoId: reserva.meseroAsignadoId || '',
    });
    setShowForm(true);
  };

  const handleConfirmar = async (reserva: ReservaConDetalles) => {
    try {
      setError(null);
      await reservasService.actualizar(reserva.id, { confirmada: true });
      setSuccess('Reserva confirmada exitosamente');
      loadReservas();
    } catch (err: any) {
      setError(err.message || 'Error al confirmar la reserva');
    }
  };

  const handleCancelar = async (reserva: ReservaConDetalles) => {
    const result = await Swal.fire({
      title: '¿Cancelar reserva?',
      text: 'Esta acción marcará la reserva como cancelada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setError(null);
      await reservasService.actualizar(reserva.id, { 
        cancelada: true, 
        motivoCancelacion: 'Cancelada por el administrador'
      });
      setSuccess('Reserva cancelada exitosamente');
      loadReservas();
    } catch (err: any) {
      setError(err.message || 'Error al cancelar la reserva');
    }
  };

  const handleReactivar = async (reserva: ReservaConDetalles) => {
    const result = await Swal.fire({
      title: '¿Reactivar reserva?',
      text: 'Esta acción restaurará la reserva cancelada a estado pendiente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, reactivar',
      cancelButtonText: 'No',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setError(null);
      await reservasService.actualizar(reserva.id, { 
        cancelada: false,
        estado: 'pendiente'
      });
      setSuccess('Reserva reactivada exitosamente');
      loadReservas();
    } catch (err: any) {
      setError(err.message || 'Error al reactivar la reserva');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar reserva?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setError(null);
      await reservasService.eliminar(id);
      setSuccess('Reserva eliminada exitosamente');
      loadReservas();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la reserva');
      Swal.fire({
        title: 'Error',
        text: err.message || 'Hubo un problema al eliminar la reserva.',
        icon: 'error',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      mesaId: '',
      nombreCliente: '',
      correoCliente: '',
      telefonoCliente: '',
      fechaReserva: '',
      numeroPersonas: 2,
      notasCliente: '',
      meseroAsignadoId: '',
    });
    setEditingReserva(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    resetForm();
  };

  const getEstadoLabel = (estado: string) => {
    return ESTADOS_RESERVA.find(e => e.value === estado)?.label || estado;
  };

  const getEstadoColor = (estado: string) => {
    return ESTADOS_RESERVA.find(e => e.value === estado)?.color || 'bg-gray-100 text-gray-800';
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Funciones para el calendario
  const getReservasPorFecha = (fecha: Date) => {
    const fechaStr = fecha.toISOString().split('T')[0];
    return reservas.filter(reserva => {
      const reservaFecha = new Date(reserva.fechaReserva).toISOString().split('T')[0];
      return reservaFecha === fechaStr;
    });
  };

  const getDiasDelMes = (fecha: Date) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicioSemana = primerDia.getDay();
    
    const dias: (Date | null)[] = [];
    
    // Agregar días vacíos al inicio
    for (let i = 0; i < diaInicioSemana; i++) {
      dias.push(null);
    }
    
    // Agregar días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push(new Date(año, mes, dia));
    }
    
    return dias;
  };

  const cambiarMes = (direccion: 'anterior' | 'siguiente') => {
    setSelectedDate(prev => {
      const nuevaFecha = new Date(prev);
      if (direccion === 'anterior') {
        nuevaFecha.setMonth(prev.getMonth() - 1);
      } else {
        nuevaFecha.setMonth(prev.getMonth() + 1);
      }
      return nuevaFecha;
    });
  };

  const nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Si está verificando el plan, mostrar loading
  if (verificandoPlan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  // Si no es PREMIUM, mostrar mensaje
  if (!esPremium) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Crown className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Funcionalidad Premium
            </h2>
            <p className="text-gray-600 mb-6">
              Las reservas de mesas solo están disponibles para usuarios con plan <strong>PREMIUM</strong>.
            </p>
            <p className="text-gray-500 mb-8">
              Actualiza tu plan para acceder a esta funcionalidad y gestionar las reservas de tu restaurante.
            </p>
            <Link
              to="/dashboard/planes"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
            >
              Ver Planes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal del Formulario - Fuera del contenedor principal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={cancelForm}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px) saturate(100%)',
            WebkitBackdropFilter: 'blur(10px) saturate(100%)',
          }}
        >
          <div
            className="rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto border-2 border-white/30"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.5)'
            }}
          >
            <div 
              className="sticky top-0 px-6 py-4 border-b-2 border-white/50 flex items-center justify-between z-10"
              style={{
                background: 'linear-gradient(135deg, rgba(240, 253, 250, 0.98) 0%, rgba(209, 250, 229, 0.98) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              <h2 className="text-xl font-bold text-gray-900">
                {editingReserva ? 'Editar Reserva' : 'Nueva Reserva'}
              </h2>
              <button
                onClick={cancelForm}
                className="p-2 hover:bg-white/40 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mesa <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="mesaId"
                      value={formData.mesaId || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                      <option value="">Seleccionar mesa</option>
                      {mesas.map(mesa => (
                        <option key={mesa.id} value={mesa.id}>
                          {mesa.numero} {mesa.nombre ? `- ${mesa.nombre}` : ''} (Capacidad: {mesa.capacidad})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha y Hora <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="fechaReserva"
                      value={formData.fechaReserva || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Cliente <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nombreCliente"
                      value={formData.nombreCliente || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correo <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="correoCliente"
                      value={formData.correoCliente || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="telefonoCliente"
                      value={formData.telefonoCliente || ''}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Personas
                    </label>
                    <input
                      type="number"
                      name="numeroPersonas"
                      value={formData.numeroPersonas || 2}
                      onChange={handleChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mesero Asignado
                    </label>
                    <select
                      name="meseroAsignadoId"
                      value={formData.meseroAsignadoId || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    >
                      <option value="">Sin asignar</option>
                      {meseros.map(mesero => (
                        <option key={mesero.id} value={mesero.id}>
                          {mesero.nombre} {mesero.apellido || ''} ({mesero.correo})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas del Cliente
                  </label>
                  <textarea
                    name="notasCliente"
                    value={formData.notasCliente || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                    placeholder="Alergias, preferencias, etc."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 inline animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      editingReserva ? 'Actualizar' : 'Crear'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal del Calendario */}
      {showCalendar && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={() => setShowCalendar(false)}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px) saturate(100%)',
            WebkitBackdropFilter: 'blur(10px) saturate(100%)',
          }}
        >
          <div
            className="rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-auto border-2 border-white/30"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.5)'
            }}
          >
            <div
              className="sticky top-0 px-4 sm:px-6 py-3 sm:py-4 border-b-2 border-white/50 flex items-center justify-between z-10"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.98) 0%, rgba(6, 182, 212, 0.98) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
              }}
            >
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Calendario de Reservas
              </h2>
              <button
                onClick={() => setShowCalendar(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="p-3 sm:p-6">
              {/* Controles del calendario */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <button
                  onClick={() => cambiarMes('anterior')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 text-center">
                  {nombresMeses[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                </h3>
                <button
                  onClick={() => cambiarMes('siguiente')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Calendario */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
                {nombresDias.map(dia => (
                  <div key={dia} className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-1 sm:py-2">
                    {dia}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {getDiasDelMes(selectedDate).map((dia, index) => {
                  if (!dia) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const reservasDelDia = getReservasPorFecha(dia);
                  const esHoy = dia.toDateString() === new Date().toDateString();
                  const esPasado = dia < new Date() && !esHoy;

                  return (
                    <div
                      key={dia.toISOString()}
                      className={`aspect-square border-2 rounded sm:rounded-lg p-1 sm:p-2 overflow-y-auto ${
                        esHoy
                          ? 'border-blue-500 bg-blue-50'
                          : esPasado
                          ? 'border-gray-200 bg-gray-50'
                          : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <div className={`text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 ${esHoy ? 'text-blue-600' : 'text-gray-700'}`}>
                        {dia.getDate()}
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        {reservasDelDia.slice(0, 2).map(reserva => (
                          <div
                            key={reserva.id}
                            onClick={() => {
                              setEditingReserva(reserva);
                              setShowCalendar(false);
                              setShowForm(true);
                              setFormData({
                                mesaId: reserva.mesaId,
                                nombreCliente: reserva.nombreCliente,
                                correoCliente: reserva.correoCliente,
                                telefonoCliente: reserva.telefonoCliente,
                                fechaReserva: new Date(reserva.fechaReserva).toISOString().slice(0, 16),
                                numeroPersonas: reserva.numeroPersonas,
                                notasCliente: reserva.notasCliente || '',
                                meseroAsignadoId: reserva.meseroAsignadoId || '',
                              });
                            }}
                            className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded cursor-pointer truncate ${getEstadoColor(reserva.estado)}`}
                            title={`${reserva.nombreCliente} - ${new Date(reserva.fechaReserva).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`}
                          >
                            <span className="hidden sm:inline">{new Date(reserva.fechaReserva).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - </span>
                            <span className="truncate">{reserva.nombreCliente}</span>
                          </div>
                        ))}
                        {reservasDelDia.length > 2 && (
                          <div className="text-[10px] sm:text-xs text-gray-500 font-semibold">
                            +{reservasDelDia.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Leyenda:</h4>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {ESTADOS_RESERVA.map(estado => (
                    <div key={estado.value} className="flex items-center gap-1 sm:gap-2">
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded ${estado.color}`} />
                      <span className="text-xs sm:text-sm text-gray-600">{estado.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                Reservas de Mesas
              </h1>
              <p className="text-gray-600 mt-1">Gestiona las reservas de tu restaurante</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCalendar(true)}
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all shadow-lg"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Ver Calendario
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nueva Reserva
              </button>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-5 w-5 text-red-600" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <p className="text-green-800">{success}</p>
            <button onClick={() => setSuccess(null)} className="ml-auto">
              <X className="h-5 w-5 text-green-600" />
            </button>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => {
                  setFiltroEstado(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Todos</option>
                {ESTADOS_RESERVA.map(estado => (
                  <option key={estado.value} value={estado.value}>{estado.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mesa</label>
              <select
                value={filtroMesa}
                onChange={(e) => {
                  setFiltroMesa(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Todas</option>
                {mesas.map(mesa => (
                  <option key={mesa.id} value={mesa.id}>{mesa.numero} {mesa.nombre ? `- ${mesa.nombre}` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <input
                type="date"
                value={filtroFechaDesde}
                onChange={(e) => {
                  setFiltroFechaDesde(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <input
                type="date"
                value={filtroFechaHasta}
                onChange={(e) => {
                  setFiltroFechaHasta(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Lista de Reservas */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : reservas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay reservas</h3>
            <p className="text-gray-600 mb-4">Comienza creando tu primera reserva</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nueva Reserva
            </button>
          </div>
        ) : (
          <>
            {/* Vista de tabla para pantallas grandes */}
            <div className="hidden lg:block bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mesa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha y Hora
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Personas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mesero
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservas.map((reserva) => (
                      <tr key={reserva.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{reserva.nombreCliente}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Mail className="h-3 w-3" />
                              {reserva.correoCliente}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {reserva.telefonoCliente}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reserva.mesaNumero || 'N/A'}
                            {reserva.mesaNombre && (
                              <span className="text-gray-500"> - {reserva.mesaNombre}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatFecha(reserva.fechaReserva)}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {reserva.numeroPersonas}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(reserva.estado)}`}>
                            {getEstadoLabel(reserva.estado)}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {reserva.meseroNombre || 'Sin asignar'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {!reserva.confirmada && reserva.estado === 'pendiente' && (
                              <button
                                onClick={() => handleConfirmar(reserva)}
                                className="text-green-600 hover:text-green-900"
                                title="Confirmar"
                              >
                                <CheckCircle2 className="h-5 w-5" />
                              </button>
                            )}
                            {reserva.cancelada && reserva.estado === 'cancelada' && (
                              <button
                                onClick={() => handleReactivar(reserva)}
                                className="text-green-600 hover:text-green-900"
                                title="Reactivar"
                              >
                                <RotateCcw className="h-5 w-5" />
                              </button>
                            )}
                            {!reserva.cancelada && reserva.estado !== 'completada' && (
                              <button
                                onClick={() => handleCancelar(reserva)}
                                className="text-orange-600 hover:text-orange-900"
                                title="Cancelar"
                              >
                                <CalendarX className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(reserva)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Editar"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(reserva.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vista de cards para pantallas pequeñas */}
            <div className="lg:hidden space-y-4">
              {reservas.map((reserva) => (
                <div key={reserva.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{reserva.nombreCliente}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{reserva.correoCliente}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{reserva.telefonoCliente}</span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(reserva.estado)}`}>
                      {getEstadoLabel(reserva.estado)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <span className="text-gray-500">Mesa:</span>
                      <span className="ml-1 font-medium text-gray-900">
                        {reserva.mesaNumero || 'N/A'}
                        {reserva.mesaNombre && ` - ${reserva.mesaNombre}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Personas:</span>
                      <span className="ml-1 font-medium text-gray-900 flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {reserva.numeroPersonas}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Fecha y Hora:</span>
                      <span className="ml-1 font-medium text-gray-900">{formatFecha(reserva.fechaReserva)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Mesero:</span>
                      <span className="ml-1 font-medium text-gray-900">{reserva.meseroNombre || 'Sin asignar'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                    {!reserva.confirmada && reserva.estado === 'pendiente' && (
                      <button
                        onClick={() => handleConfirmar(reserva)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Confirmar"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                    )}
                    {reserva.cancelada && reserva.estado === 'cancelada' && (
                      <button
                        onClick={() => handleReactivar(reserva)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Reactivar"
                      >
                        <RotateCcw className="h-5 w-5" />
                      </button>
                    )}
                    {!reserva.cancelada && reserva.estado !== 'completada' && (
                      <button
                        onClick={() => handleCancelar(reserva)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Cancelar"
                      >
                        <CalendarX className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(reserva)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(reserva.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} reservas
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </>
  );
}

