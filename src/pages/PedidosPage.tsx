import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { pedidosService, mesasService, itemsMenuService, usuariosService } from '../services';
import type { PedidoCompleto, CrearPedidoDto, EstadoPedido, MesaConMesero, ItemMenuConAdiciones, UsuarioConRol, CrearItemPedidoDto, HistorialEstadoPedido } from '../types/api.types';
import {
  Plus,
  Trash2,
  ShoppingCart,
  Loader2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Clock,
  User,
  Table,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Check,
  XCircle,
  Package,
  ChefHat,
  Truck,
  List,
  Grid3x3,
  Columns,
  LayoutGrid,
} from 'lucide-react';

const ESTADOS_PEDIDO: { value: EstadoPedido; label: string; color: string }[] = [
  { value: 'pendiente', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'pendiente_confirmacion', label: 'Pendiente Confirmación', color: 'bg-amber-100 text-amber-800' },
  { value: 'confirmado', label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  { value: 'preparando', label: 'Preparando', color: 'bg-orange-100 text-orange-800' },
  { value: 'listo', label: 'Listo', color: 'bg-purple-100 text-purple-800' },
  { value: 'servido', label: 'Servido', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'completado', label: 'Completado', color: 'bg-green-100 text-green-800' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-800' },
];

export default function PedidosPage() {
  const { user } = useAuth();
  const { isConnected, on, off } = useWebSocket();
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([]);
  const [mesas, setMesas] = useState<MesaConMesero[]>([]);
  const [itemsMenu, setItemsMenu] = useState<ItemMenuConAdiciones[]>([]);
  const [meseros, setMeseros] = useState<UsuarioConRol[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMesas, setLoadingMesas] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingMeseros, setLoadingMeseros] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | ''>('');
  const [filtroMesa, setFiltroMesa] = useState<string>('');
  const [selectedPedido, setSelectedPedido] = useState<PedidoCompleto | null>(null);
  const [historial, setHistorial] = useState<HistorialEstadoPedido[]>([]);
  const [showClienteInfo, setShowClienteInfo] = useState(false);
  const [showOpcionesAvanzadas, setShowOpcionesAvanzadas] = useState(false);
  const [vistaPedidos, setVistaPedidos] = useState<'lista' | 'tarjetas' | 'tabla' | 'kanban'>('lista');

  const [formData, setFormData] = useState<Omit<CrearPedidoDto, 'restauranteId' | 'items'>>({
    mesaId: '',
    nombreCliente: '',
    telefonoCliente: '',
    correoCliente: '',
    notas: '',
    instruccionesEspeciales: '',
    meseroAsignadoId: '',
  });

  const [itemsForm, setItemsForm] = useState<Array<{
    itemMenuId: string;
    cantidad: number;
    notas: string;
    adicionesIds: string[];
  }>>([]);

  useEffect(() => {
    if (user?.restauranteId) {
      loadPedidos();
      loadMesas();
      loadItemsMenu();
      loadMeseros();
    }
  }, [user?.restauranteId]);

  // Cargar historial cuando se selecciona un pedido
  useEffect(() => {
    if (selectedPedido?.id) {
      loadHistorial(selectedPedido.id);
    } else {
      setHistorial([]);
    }
  }, [selectedPedido?.id]);

  // Escuchar eventos de WebSocket
  useEffect(() => {
    if (!isConnected) return;

    // Escuchar nuevo pedido
    const unsubscribeNuevo = on('pedido:nuevo', (data: { pedido: PedidoCompleto }) => {
      setPedidos(prev => {
        // Evitar duplicados
        if (prev.find(p => p.id === data.pedido.id)) {
          return prev;
        }
        return [data.pedido, ...prev].sort((a, b) => 
          new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
        );
      });
      setSuccess('Nuevo pedido recibido');
      setTimeout(() => setSuccess(null), 3000);
    });

    // Escuchar pedido actualizado
    const unsubscribeActualizado = on('pedido:actualizado', (data: { pedido: PedidoCompleto }) => {
      setPedidos(prev => prev.map(p => 
        p.id === data.pedido.id ? data.pedido : p
      ));
    });

    // Escuchar item de pedido actualizado
    const unsubscribeItem = on('pedido:item:actualizado', (data: { pedido: PedidoCompleto }) => {
      setPedidos(prev => prev.map(p => 
        p.id === data.pedido.id ? data.pedido : p
      ));
    });

    // Escuchar pedido listo (notificación para meseros)
    const unsubscribeListo = on('pedido:listo', (data: { pedido: PedidoCompleto }) => {
      setPedidos(prev => prev.map(p => 
        p.id === data.pedido.id ? data.pedido : p
      ));
      setSuccess(`Pedido #${data.pedido.id.slice(0, 8)} está listo`);
      setTimeout(() => setSuccess(null), 5000);
    });

    return () => {
      unsubscribeNuevo();
      unsubscribeActualizado();
      unsubscribeItem();
      unsubscribeListo();
    };
  }, [isConnected, on, off]);

  const loadHistorial = async (pedidoId: string) => {
    try {
      setLoadingHistorial(true);
      const historialData = await pedidosService.obtenerHistorial(pedidoId);
      setHistorial(historialData);
    } catch (err: any) {
      console.error('Error al cargar historial:', err);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const loadPedidos = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await pedidosService.obtenerPorRestauranteId(user.restauranteId);
      // Ordenar por fecha de creación (más recientes primero)
      const sorted = data.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
      setPedidos(sorted);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const loadMesas = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoadingMesas(true);
      const data = await mesasService.obtenerPorRestauranteId(user.restauranteId);
      const sorted = data.filter(m => m.activa).sort((a, b) => a.numero.localeCompare(b.numero));
      setMesas(sorted);
    } catch (err: any) {
      console.error('Error al cargar mesas:', err);
    } finally {
      setLoadingMesas(false);
    }
  };

  const loadItemsMenu = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoadingItems(true);
      const data = await itemsMenuService.obtenerPorRestauranteId(user.restauranteId);
      const sorted = data.filter(i => i.disponible).sort((a, b) => a.nombre.localeCompare(b.nombre));
      setItemsMenu(sorted);
    } catch (err: any) {
      console.error('Error al cargar items del menú:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const loadMeseros = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoadingMeseros(true);
      // Cargar roles primero
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

      // Cargar usuarios del restaurante
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
    } finally {
      setLoadingMeseros(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    setItemsForm([...itemsForm, { itemMenuId: '', cantidad: 1, notas: '', adicionesIds: [] }]);
  };

  const handleRemoveItem = (index: number) => {
    setItemsForm(itemsForm.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...itemsForm];
    if (field === 'cantidad') {
      newItems[index].cantidad = parseInt(value) || 1;
    } else if (field === 'adicionesIds') {
      // Si value es un array, usarlo directamente (para checkboxes)
      if (Array.isArray(value)) {
        newItems[index].adicionesIds = value;
      } else if (value?.target?.value) {
        // Si viene de un evento con target.value
        newItems[index].adicionesIds = value.target.value;
      } else {
        // Fallback para select múltiple
        const selectedOptions = Array.from(value.selectedOptions || [], (option: any) => option.value);
        newItems[index].adicionesIds = selectedOptions;
      }
    } else {
      (newItems[index] as any)[field] = value;
    }
    setItemsForm(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.restauranteId) return;

    if (itemsForm.length === 0) {
      setError('Debes agregar al menos un item al pedido');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const items: CrearItemPedidoDto[] = itemsForm.map(item => ({
        itemMenuId: item.itemMenuId,
        cantidad: item.cantidad,
        notas: item.notas || undefined,
        adicionesIds: item.adicionesIds.length > 0 ? item.adicionesIds : undefined,
      }));

      const datosEnviar: CrearPedidoDto = {
        restauranteId: user.restauranteId,
        mesaId: formData.mesaId,
        items,
      };

      if (formData.nombreCliente?.trim()) {
        datosEnviar.nombreCliente = formData.nombreCliente.trim();
      }

      if (formData.telefonoCliente?.trim()) {
        datosEnviar.telefonoCliente = formData.telefonoCliente.trim();
      }

      if (formData.correoCliente?.trim()) {
        datosEnviar.correoCliente = formData.correoCliente.trim();
      }

      if (formData.notas?.trim()) {
        datosEnviar.notas = formData.notas.trim();
      }

      if (formData.instruccionesEspeciales?.trim()) {
        datosEnviar.instruccionesEspeciales = formData.instruccionesEspeciales.trim();
      }

      if (formData.meseroAsignadoId?.trim()) {
        datosEnviar.meseroAsignadoId = formData.meseroAsignadoId.trim();
      }

      await pedidosService.crear(datosEnviar);
      setSuccess('Pedido creado exitosamente');
      setShowForm(false);
      resetForm();
      loadPedidos();
    } catch (err: any) {
      setError(err.message || 'Error al crear el pedido');
    } finally {
      setSaving(false);
    }
  };

  const handleCambiarEstado = async (pedido: PedidoCompleto, nuevoEstado: EstadoPedido) => {
    try {
      setError(null);
      await pedidosService.cambiarEstado(pedido.id, nuevoEstado);
      setSuccess(`Pedido ${getEstadoLabel(nuevoEstado).toLowerCase()} exitosamente`);
      loadPedidos();
      if (selectedPedido?.id === pedido.id) {
        const updated = await pedidosService.obtenerPorId(pedido.id);
        setSelectedPedido(updated);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado del pedido');
    }
  };

  const handleConfirmarPedido = async (pedido: PedidoCompleto) => {
    try {
      setError(null);
      await pedidosService.confirmarPedido(pedido.id);
      setSuccess('Pedido confirmado exitosamente. Ya puede ser enviado a cocina.');
      loadPedidos();
      if (selectedPedido?.id === pedido.id) {
        const updated = await pedidosService.obtenerPorId(pedido.id);
        setSelectedPedido(updated);
        loadHistorial(pedido.id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al confirmar el pedido');
    }
  };

  const handleCambiarEstadoItem = async (itemId: string, nuevoEstado: string) => {
    try {
      setError(null);
      const pedidoActualizado = await pedidosService.actualizarEstadoItem(itemId, nuevoEstado);
      setSuccess(`Estado del item actualizado a "${getEstadoLabel(nuevoEstado as EstadoPedido)}"`);
      loadPedidos();
      if (selectedPedido?.id === pedidoActualizado.id) {
        setSelectedPedido(pedidoActualizado);
        loadHistorial(pedidoActualizado.id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado del item');
    }
  };

  const getSiguienteEstadoItem = (estado: string): string | null => {
    const estados: string[] = ['pendiente', 'preparando', 'listo', 'servido'];
    const index = estados.indexOf(estado);
    return index < estados.length - 1 ? estados[index + 1] : null;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este pedido? Esta acción no se puede deshacer.')) return;

    try {
      setError(null);
      await pedidosService.eliminar(id);
      setSuccess('Pedido eliminado exitosamente');
      loadPedidos();
      if (selectedPedido?.id === id) {
        setSelectedPedido(null);
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el pedido');
    }
  };

  const resetForm = () => {
    setFormData({
      mesaId: '',
      nombreCliente: '',
      telefonoCliente: '',
      correoCliente: '',
      notas: '',
      instruccionesEspeciales: '',
      meseroAsignadoId: '',
    });
    setItemsForm([]);
  };

  const cancelForm = () => {
    setShowForm(false);
    resetForm();
  };

  const getEstadoLabel = (estado: EstadoPedido) => {
    return ESTADOS_PEDIDO.find(e => e.value === estado)?.label || estado;
  };

  const getEstadoColor = (estado: EstadoPedido) => {
    return ESTADOS_PEDIDO.find(e => e.value === estado)?.color || 'bg-gray-100 text-gray-800';
  };

  const getEstadoIcon = (estado: EstadoPedido) => {
    switch (estado) {
      case 'pendiente':
        return <Clock className="h-4 w-4" />;
      case 'pendiente_confirmacion':
        return <AlertCircle className="h-4 w-4" />;
      case 'confirmado':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'preparando':
        return <ChefHat className="h-4 w-4" />;
      case 'listo':
        return <Package className="h-4 w-4" />;
      case 'servido':
        return <Truck className="h-4 w-4" />;
      case 'completado':
        return <Check className="h-4 w-4" />;
      case 'cancelado':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getSiguienteEstado = (estado: EstadoPedido): EstadoPedido | null => {
    const estados: EstadoPedido[] = ['pendiente', 'pendiente_confirmacion', 'confirmado', 'preparando', 'listo', 'servido', 'completado'];
    const index = estados.indexOf(estado);
    return index < estados.length - 1 ? estados[index + 1] : null;
  };

  const getProgresoPedido = (estado: EstadoPedido): number => {
    const estados: EstadoPedido[] = ['pendiente', 'pendiente_confirmacion', 'confirmado', 'preparando', 'listo', 'servido', 'completado'];
    const index = estados.indexOf(estado);
    if (index === -1 || estado === 'cancelado') return 0;
    return ((index + 1) / estados.length) * 100;
  };

  const getEtapasProgreso = (estado: EstadoPedido): Array<{ label: string; completada: boolean; activa: boolean }> => {
    const estados: EstadoPedido[] = ['pendiente', 'confirmado', 'preparando', 'listo', 'servido', 'completado'];
    const index = estados.indexOf(estado);
    
    return estados.map((est, idx) => ({
      label: getEstadoLabel(est),
      completada: idx <= index,
      activa: idx === index,
    }));
  };

  /**
   * Formatea un monto en formato de pesos colombianos
   * Ejemplo: 20000 -> $20.000
   */
  const formatearMoneda = (monto: number): string => {
    // Redondear sin decimales
    const montoRedondeado = Math.round(monto);
    // Formatear con separador de miles usando punto
    return `$${montoRedondeado.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const pedidosFiltrados = pedidos.filter(pedido => {
    if (filtroEstado && pedido.estado !== filtroEstado) return false;
    if (filtroMesa && pedido.mesaId !== filtroMesa) return false;
    return true;
  });

  const calcularTotal = () => {
    let total = 0;
    itemsForm.forEach(item => {
      const itemMenu = itemsMenu.find(i => i.id === item.itemMenuId);
      if (itemMenu) {
        let subtotal = itemMenu.precio * item.cantidad;
        if (item.adicionesIds && item.adicionesIds.length > 0) {
          item.adicionesIds.forEach(adicionId => {
            const adicion = itemMenu.adiciones?.find(a => a.id === adicionId);
            if (adicion) {
              subtotal += adicion.precio * item.cantidad;
            }
          });
        }
        total += subtotal;
      }
    });
    return total;
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
    <>
      {/* Indicador de conexión WebSocket */}
      {isConnected && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Tiempo Real Activo</span>
        </div>
      )}
      {!isConnected && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-sm font-medium">Reconectando...</span>
        </div>
      )}
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
            <p className="mt-1 text-sm text-gray-500">Gestiona los pedidos de tu restaurante</p>
          </div>
          {!showForm && !selectedPedido && (
            <button
              onClick={() => {
                setShowForm(true);
                resetForm();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Pedido
            </button>
          )}
        </div>
      </div>

      {/* Filtros y selector de vista */}
      {!showForm && !selectedPedido && (
        <div className="mb-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label htmlFor="filtroEstado" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por estado
              </label>
              <select
                id="filtroEstado"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value as EstadoPedido | '')}
                className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white sm:text-sm transition-colors"
              >
                <option value="">Todos los estados</option>
                {ESTADOS_PEDIDO.map((estado) => (
                  <option key={estado.value} value={estado.value}>
                    {estado.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filtroMesa" className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por mesa
              </label>
              <select
                id="filtroMesa"
                value={filtroMesa}
                onChange={(e) => setFiltroMesa(e.target.value)}
                className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white sm:text-sm transition-colors"
                disabled={loadingMesas}
              >
                <option value="">Todas las mesas</option>
                {mesas.map((mesa) => (
                  <option key={mesa.id} value={mesa.id}>
                    {mesa.numero} {mesa.nombre && `- ${mesa.nombre}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="vistaPedidos" className="block text-sm font-medium text-gray-700 mb-2">
                Vista
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVistaPedidos('lista')}
                  className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    vistaPedidos === 'lista'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Vista de lista"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setVistaPedidos('tarjetas')}
                  className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    vistaPedidos === 'tarjetas'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Vista de tarjetas"
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setVistaPedidos('tabla')}
                  className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    vistaPedidos === 'tabla'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Vista de tabla"
                >
                  <Columns className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setVistaPedidos('kanban')}
                  className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    vistaPedidos === 'kanban'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Vista Kanban"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
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

      {/* Vista detallada de pedido */}
      {selectedPedido && !showForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Detalle del Pedido</h2>
            <button
              onClick={() => setSelectedPedido(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Alerta para pedidos pendientes de confirmación */}
          {selectedPedido.estado === 'pendiente_confirmacion' && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-amber-800">Pedido Pendiente de Confirmación</h3>
                  <p className="mt-1 text-sm text-amber-700">
                    Este pedido fue creado por un cliente y requiere confirmación manual antes de enviarlo a cocina.
                    Por favor, verifica la información y confirma el pedido.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Indicador de progreso */}
          {selectedPedido.estado !== 'cancelado' && selectedPedido.estado !== 'pendiente_confirmacion' && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Progreso del Pedido</h3>
                <span className="text-xs text-gray-500">{Math.round(getProgresoPedido(selectedPedido.estado))}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${getProgresoPedido(selectedPedido.estado)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                {getEtapasProgreso(selectedPedido.estado).map((etapa, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center flex-1 ${
                      etapa.completada ? 'text-indigo-600' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mb-1 ${
                        etapa.completada ? 'bg-indigo-600' : 'bg-gray-300'
                      } ${etapa.activa ? 'ring-2 ring-indigo-300 ring-offset-2' : ''}`}
                    />
                    <span className="text-center text-[10px] leading-tight">{etapa.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Información del Pedido</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-gray-500">Estado</dt>
                  <dd>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getEstadoColor(selectedPedido.estado)}`}>
                      {getEstadoIcon(selectedPedido.estado)}
                      <span className="ml-1">{getEstadoLabel(selectedPedido.estado)}</span>
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Mesa</dt>
                  <dd className="text-sm text-gray-900">{selectedPedido.mesaNumero} {selectedPedido.mesaNombre && `- ${selectedPedido.mesaNombre}`}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Monto Total</dt>
                  <dd className="text-sm font-semibold text-gray-900">{formatearMoneda(selectedPedido.montoTotal)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Fecha de Creación</dt>
                  <dd className="text-sm text-gray-900">{new Date(selectedPedido.fechaCreacion).toLocaleString('es-ES')}</dd>
                </div>
                {selectedPedido.meseroNombre && (
                  <div>
                    <dt className="text-xs text-gray-500">Mesero</dt>
                    <dd className="text-sm text-gray-900">{selectedPedido.meseroNombre}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Información del Cliente</h3>
              <dl className="space-y-2">
                {selectedPedido.nombreCliente && (
                  <div>
                    <dt className="text-xs text-gray-500">Nombre</dt>
                    <dd className="text-sm text-gray-900">{selectedPedido.nombreCliente}</dd>
                  </div>
                )}
                {selectedPedido.telefonoCliente && (
                  <div>
                    <dt className="text-xs text-gray-500">Teléfono</dt>
                    <dd className="text-sm text-gray-900">{selectedPedido.telefonoCliente}</dd>
                  </div>
                )}
                {selectedPedido.correoCliente && (
                  <div>
                    <dt className="text-xs text-gray-500">Correo</dt>
                    <dd className="text-sm text-gray-900">{selectedPedido.correoCliente}</dd>
                  </div>
                )}
                {selectedPedido.notas && (
                  <div>
                    <dt className="text-xs text-gray-500">Notas</dt>
                    <dd className="text-sm text-gray-900">{selectedPedido.notas}</dd>
                  </div>
                )}
                {selectedPedido.instruccionesEspeciales && (
                  <div>
                    <dt className="text-xs text-gray-500">Instrucciones Especiales</dt>
                    <dd className="text-sm text-gray-900">{selectedPedido.instruccionesEspeciales}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {selectedPedido.items && selectedPedido.items.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Items del Pedido</h3>
              <div className="space-y-3">
                {selectedPedido.items.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      {/* Imagen del plato */}
                      {item.itemMenuImagenUrl ? (
                        <div className="flex-shrink-0">
                          <img
                            src={item.itemMenuImagenUrl}
                            alt={item.itemMenuNombre || 'Plato'}
                            className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <ChefHat className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">{item.itemMenuNombre}</p>
                            <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEstadoColor(item.estado as EstadoPedido)}`}>
                              {getEstadoIcon(item.estado as EstadoPedido)}
                              <span className="ml-1">{getEstadoLabel(item.estado as EstadoPedido)}</span>
                            </span>
                          </div>
                          {/* Selector de estado para items individuales */}
                          {selectedPedido.estado !== 'cancelado' && selectedPedido.estado !== 'completado' && (
                            <div className="flex items-center gap-2">
                              <select
                                value={item.estado}
                                onChange={(e) => handleCambiarEstadoItem(item.id, e.target.value)}
                                className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="pendiente">Pendiente</option>
                                <option value="preparando">Preparando</option>
                                <option value="listo">Listo</option>
                                <option value="servido">Servido</option>
                                {item.estado !== 'servido' && (
                                  <option value="cancelado">Cancelar</option>
                                )}
                              </select>
                              {getSiguienteEstadoItem(item.estado) && (
                                <button
                                  onClick={() => handleCambiarEstadoItem(item.id, getSiguienteEstadoItem(item.estado)!)}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 transition-colors"
                                  title={`Avanzar a ${getEstadoLabel(getSiguienteEstadoItem(item.estado)! as EstadoPedido)}`}
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          <span>Cantidad: {item.cantidad}</span>
                          <span className="ml-4">Precio unitario: {formatearMoneda(item.precioUnitario)}</span>
                          <span className="ml-4 font-semibold text-gray-900">Subtotal: {formatearMoneda(item.subtotal)}</span>
                        </div>
                        {item.adiciones && item.adiciones.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500">Adiciones:</p>
                            <ul className="mt-1 space-y-1">
                              {item.adiciones.map((adicion) => (
                                <li key={adicion.id} className="text-xs text-gray-600">
                                  • {adicion.adicionNombre} {adicion.modificadorPrecio > 0 && `(+${formatearMoneda(adicion.modificadorPrecio)})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {item.notas && (
                          <p className="mt-2 text-xs text-gray-500">Notas: {item.notas}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historial de cambios de estado */}
          {historial.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Historial de Cambios</h3>
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                <div className="space-y-3">
                  {historial.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-b-0 last:pb-0">
                      <div className="flex-shrink-0 mt-1">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getEstadoColor(item.estadoNuevo as EstadoPedido)}`}>
                          {getEstadoIcon(item.estadoNuevo as EstadoPedido)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {item.itemMenuNombre ? `Item: ${item.itemMenuNombre}` : 'Pedido completo'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.estadoAnterior ? `${getEstadoLabel(item.estadoAnterior as EstadoPedido)} → ${getEstadoLabel(item.estadoNuevo as EstadoPedido)}` : `Estado: ${getEstadoLabel(item.estadoNuevo as EstadoPedido)}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(item.fechaCreacion).toLocaleString('es-ES')}
                            </p>
                          </div>
                        </div>
                        {item.usuarioNombre && (
                          <p className="text-xs text-gray-500 mt-1">
                            Confirmado por: <span className="font-medium">{item.usuarioNombre}</span>
                            {item.rolNombre && <span className="text-gray-400"> ({item.rolNombre})</span>}
                          </p>
                        )}
                        {item.notas && (
                          <p className="text-xs text-gray-600 mt-1 italic">Nota: {item.notas}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex space-x-2">
              {selectedPedido.estado === 'pendiente_confirmacion' && (
                <button
                  onClick={() => handleConfirmarPedido(selectedPedido)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirmar Pedido y Enviar a Cocina
                </button>
              )}
              {getSiguienteEstado(selectedPedido.estado) && selectedPedido.estado !== 'pendiente_confirmacion' && (
                <button
                  onClick={() => handleCambiarEstado(selectedPedido, getSiguienteEstado(selectedPedido.estado)!)}
                  className="inline-flex items-center px-3 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Avanzar a {getEstadoLabel(getSiguienteEstado(selectedPedido.estado)!)}
                </button>
              )}
              {selectedPedido.estado !== 'cancelado' && selectedPedido.estado !== 'completado' && (
                <button
                  onClick={() => handleCambiarEstado(selectedPedido, 'cancelado')}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Cancelar Pedido
                </button>
              )}
            </div>
            <button
              onClick={() => handleDelete(selectedPedido.id)}
              className="inline-flex items-center px-3 py-2 border border-red-300 rounded-lg shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Eliminar
            </button>
          </div>
        </div>
      )}

      {/* Formulario de creación */}
      {showForm && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Nuevo Pedido</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información esencial */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Información del Pedido</h3>
              <div>
                <label htmlFor="mesaId" className="block text-sm font-medium text-gray-700 mb-2">
                  Mesa *
                </label>
                <select
                  name="mesaId"
                  id="mesaId"
                  required
                  value={formData.mesaId}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white sm:text-sm transition-colors"
                  disabled={loadingMesas}
                >
                  <option value="">Selecciona una mesa</option>
                  {mesas.map((mesa) => (
                    <option key={mesa.id} value={mesa.id}>
                      {mesa.numero} {mesa.nombre && `- ${mesa.nombre}`} {mesa.ocupada && '(Ocupada)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Información del cliente (opcional) */}
            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setShowClienteInfo(!showClienteInfo)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
              >
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700">
                    Información del Cliente (Opcional)
                  </span>
                </div>
                {showClienteInfo ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {showClienteInfo && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="nombreCliente" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Cliente
                      </label>
                      <input
                        type="text"
                        name="nombreCliente"
                        id="nombreCliente"
                        value={formData.nombreCliente || ''}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                        placeholder="Nombre del cliente"
                      />
                    </div>

                    <div>
                      <label htmlFor="telefonoCliente" className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        name="telefonoCliente"
                        id="telefonoCliente"
                        value={formData.telefonoCliente || ''}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                        placeholder="+57 300 1234567"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="correoCliente" className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        name="correoCliente"
                        id="correoCliente"
                        value={formData.correoCliente || ''}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                        placeholder="cliente@ejemplo.com"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Items del pedido */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Items del Pedido</h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar Item
                </button>
              </div>

              {itemsForm.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-sm text-gray-500">No hay items agregados</p>
                  <p className="text-xs text-gray-400 mt-1">Haz clic en "Agregar Item" para comenzar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {itemsForm.map((item, index) => {
                    const itemMenu = itemsMenu.find(i => i.id === item.itemMenuId);
                    const adicionesDisponibles = itemMenu?.adiciones || [];
                    const subtotal = itemMenu ? (itemMenu.precio * item.cantidad) + (item.adicionesIds.reduce((sum, adicionId) => {
                      const adicion = adicionesDisponibles.find(a => a.id === adicionId);
                      return sum + (adicion ? adicion.precio * item.cantidad : 0);
                    }, 0)) : 0;

                    return (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-900">Item {index + 1}</h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Item del Menú *
                            </label>
                            <select
                              value={item.itemMenuId}
                              onChange={(e) => handleItemChange(index, 'itemMenuId', e.target.value)}
                              className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 bg-white sm:text-sm transition-colors"
                              required
                              disabled={loadingItems}
                            >
                              <option value="">Selecciona un item</option>
                              {itemsMenu.map((im) => (
                                <option key={im.id} value={im.id}>
                                  {im.nombre} - {formatearMoneda(im.precio)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Cantidad *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                              className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 sm:text-sm transition-colors"
                              required
                            />
                          </div>

                          {itemMenu && adicionesDisponibles.length > 0 && (
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 mb-2">
                                Adiciones
                              </label>
                              <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50 max-h-48 overflow-y-auto">
                                {adicionesDisponibles.map((adicion) => (
                                  <label
                                    key={adicion.id}
                                    className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={item.adicionesIds.includes(adicion.id)}
                                      onChange={(e) => {
                                        const newAdicionesIds = e.target.checked
                                          ? [...item.adicionesIds, adicion.id]
                                          : item.adicionesIds.filter(id => id !== adicion.id);
                                        handleItemChange(index, 'adicionesIds', { target: { value: newAdicionesIds } } as any);
                                      }}
                                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-700 flex-1">
                                      {adicion.nombre}
                                    </span>
                                    {adicion.precio > 0 && (
                                      <span className="text-sm font-medium text-gray-900">
                                        +{formatearMoneda(adicion.precio)}
                                      </span>
                                    )}
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Notas del Item
                            </label>
                            <input
                              type="text"
                              value={item.notas}
                              onChange={(e) => handleItemChange(index, 'notas', e.target.value)}
                              className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                              placeholder="Notas específicas para este item..."
                            />
                          </div>

                          {itemMenu && (
                            <div className="sm:col-span-2 text-right">
                              <p className="text-sm text-gray-500">
                                Subtotal: <span className="font-semibold text-gray-900">{formatearMoneda(subtotal)}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {itemsForm.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Total del Pedido:</span>
                    <span className="text-lg font-bold text-gray-900">{formatearMoneda(calcularTotal())}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Opciones avanzadas (opcional) */}
            <div className="border border-gray-200 rounded-lg">
              <button
                type="button"
                onClick={() => setShowOpcionesAvanzadas(!showOpcionesAvanzadas)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-t-lg"
              >
                <span className="text-sm font-medium text-gray-700">
                  Opciones Avanzadas (Opcional)
                </span>
                {showOpcionesAvanzadas ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>
              {showOpcionesAvanzadas && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-4">
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
                            {nombreCompleto}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-2">
                      Notas Generales
                    </label>
                    <textarea
                      name="notas"
                      id="notas"
                      rows={2}
                      value={formData.notas || ''}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                      placeholder="Notas generales del pedido..."
                    />
                  </div>

                  <div>
                    <label htmlFor="instruccionesEspeciales" className="block text-sm font-medium text-gray-700 mb-2">
                      Instrucciones Especiales
                    </label>
                    <textarea
                      name="instruccionesEspeciales"
                      id="instruccionesEspeciales"
                      rows={2}
                      value={formData.instruccionesEspeciales || ''}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                      placeholder="Instrucciones especiales para la preparación..."
                    />
                  </div>
                </div>
              )}
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
                disabled={saving || itemsForm.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Creando...
                  </>
                ) : (
                  <>
                    Crear Pedido
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de pedidos - Diferentes vistas */}
      {!showForm && !selectedPedido && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
          ) : pedidosFiltrados.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">No hay pedidos</h3>
              <p className="mt-2 text-sm text-gray-500">Comienza creando tu primer pedido.</p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setShowForm(true);
                    resetForm();
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nuevo Pedido
                </button>
              </div>
            </div>
          ) : (
            <>
              {vistaPedidos === 'lista' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {pedidosFiltrados.map((pedido) => (
                      <li
                        key={pedido.id}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedPedido(pedido)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0 mr-4">
                              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${getEstadoColor(pedido.estado)}`}>
                                {getEstadoIcon(pedido.estado)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  Pedido #{pedido.id.substring(0, 8)}
                                </p>
                                <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEstadoColor(pedido.estado)}`}>
                                  {getEstadoLabel(pedido.estado)}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                                <div className="flex items-center">
                                  <Table className="h-4 w-4 mr-1" />
                                  <span>{pedido.mesaNumero} {pedido.mesaNombre && `- ${pedido.mesaNombre}`}</span>
                                </div>
                                <div className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1" />
                                  <span className="font-semibold">{formatearMoneda(pedido.montoTotal)}</span>
                                </div>
                                {pedido.items && (
                                  <span>{pedido.items.length} item(s)</span>
                                )}
                                {pedido.meseroNombre && (
                                  <div className="flex items-center">
                                    <User className="h-4 w-4 mr-1" />
                                    <span className="truncate">{pedido.meseroNombre}</span>
                                  </div>
                                )}
                                {pedido.nombreCliente && (
                                  <div className="flex items-center">
                                    <span className="truncate">{pedido.nombreCliente}</span>
                                  </div>
                                )}
                              </div>
                              {pedido.estado !== 'cancelado' && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                                      style={{ width: `${getProgresoPedido(pedido.estado)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">{Math.round(getProgresoPedido(pedido.estado))}%</span>
                                </div>
                              )}
                              <p className="mt-1 text-xs text-gray-400">
                                {new Date(pedido.fechaCreacion).toLocaleString('es-ES')}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {vistaPedidos === 'tarjetas' && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {pedidosFiltrados.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setSelectedPedido(pedido)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${getEstadoColor(pedido.estado)}`}>
                          {getEstadoIcon(pedido.estado)}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEstadoColor(pedido.estado)}`}>
                          {getEstadoLabel(pedido.estado)}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        Pedido #{pedido.id.substring(0, 8)}
                      </h3>
                      <div className="space-y-2 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Table className="h-3 w-3 mr-1.5" />
                          <span>{pedido.mesaNumero} {pedido.mesaNombre && `- ${pedido.mesaNombre}`}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1.5" />
                          <span className="font-semibold">{formatearMoneda(pedido.montoTotal)}</span>
                        </div>
                        {pedido.items && (
                          <div className="flex items-center">
                            <Package className="h-3 w-3 mr-1.5" />
                            <span>{pedido.items.length} item(s)</span>
                          </div>
                        )}
                        {pedido.meseroNombre && (
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1.5" />
                            <span className="truncate">Mesero: {pedido.meseroNombre}</span>
                          </div>
                        )}
                        {pedido.nombreCliente && (
                          <div className="flex items-center">
                            <span className="truncate">Cliente: {pedido.nombreCliente}</span>
                          </div>
                        )}
                      </div>
                      {pedido.estado !== 'cancelado' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Progreso</span>
                            <span className="text-xs text-gray-500">{Math.round(getProgresoPedido(pedido.estado))}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${getProgresoPedido(pedido.estado)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <p className="mt-3 text-xs text-gray-400 text-center">
                        {new Date(pedido.fechaCreacion).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {vistaPedidos === 'tabla' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesa</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesero</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progreso</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pedidosFiltrados.map((pedido) => (
                          <tr
                            key={pedido.id}
                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setSelectedPedido(pedido)}
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getEstadoColor(pedido.estado)}`}>
                                {getEstadoIcon(pedido.estado)}
                                <span className="ml-1">{getEstadoLabel(pedido.estado)}</span>
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-mono">
                              #{pedido.id.substring(0, 8)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {pedido.mesaNumero} {pedido.mesaNombre && `- ${pedido.mesaNombre}`}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {pedido.nombreCliente || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {pedido.items?.length || 0}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {formatearMoneda(pedido.montoTotal)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {pedido.meseroNombre || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(pedido.fechaCreacion).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {pedido.estado !== 'cancelado' ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${getProgresoPedido(pedido.estado)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500 w-8">{Math.round(getProgresoPedido(pedido.estado))}%</span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {vistaPedidos === 'kanban' && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
                  {['pendiente_confirmacion', 'confirmado', 'preparando', 'listo'].map((estado) => {
                    const pedidosEstado = pedidosFiltrados.filter(p => p.estado === estado);
                    return (
                      <div key={estado} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mr-2 ${getEstadoColor(estado as EstadoPedido)}`}>
                              {getEstadoIcon(estado as EstadoPedido)}
                            </span>
                            {getEstadoLabel(estado as EstadoPedido)}
                          </h3>
                          <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                            {pedidosEstado.length}
                          </span>
                        </div>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto">
                          {pedidosEstado.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No hay pedidos</p>
                          ) : (
                            pedidosEstado.map((pedido) => (
                              <div
                                key={pedido.id}
                                className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all cursor-pointer"
                                onClick={() => setSelectedPedido(pedido)}
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <p className="text-xs font-semibold text-gray-900">
                                    #{pedido.id.substring(0, 8)}
                                  </p>
                                  <span className="text-xs font-semibold text-indigo-600">
                                    {formatearMoneda(pedido.montoTotal)}
                                  </span>
                                </div>
                                <div className="space-y-1 text-xs text-gray-600 mb-2">
                                  <div className="flex items-center">
                                    <Table className="h-3 w-3 mr-1" />
                                    <span>{pedido.mesaNumero}</span>
                                  </div>
                                  {pedido.items && (
                                    <div className="flex items-center">
                                      <Package className="h-3 w-3 mr-1" />
                                      <span>{pedido.items.length} item(s)</span>
                                    </div>
                                  )}
                                  {pedido.meseroNombre && (
                                    <div className="flex items-center">
                                      <User className="h-3 w-3 mr-1" />
                                      <span className="truncate">{pedido.meseroNombre}</span>
                                    </div>
                                  )}
                                  {pedido.nombreCliente && (
                                    <div className="flex items-center">
                                      <span className="truncate text-gray-500">Cliente: {pedido.nombreCliente}</span>
                                    </div>
                                  )}
                                </div>
                                {pedido.estado !== 'cancelado' && (
                                  <div className="mt-2">
                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                      <div
                                        className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                                        style={{ width: `${getProgresoPedido(pedido.estado)}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                                <p className="mt-2 text-xs text-gray-400">
                                  {new Date(pedido.fechaCreacion).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}
      </div>
    </>
  );
}

