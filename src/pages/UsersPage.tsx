import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usuariosService } from '../services';
import type { UsuarioConRol, CrearUsuarioDto, ActualizarUsuarioDto } from '../types/api.types';
import {
  Plus,
  Edit2,
  Trash2,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Phone,
  Shield,
  Building,
  CheckCircle,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';

interface Rol {
  id: string;
  nombre: string;
  descripcion: string | null;
}

export default function UsersPage() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioConRol[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<UsuarioConRol | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState<CrearUsuarioDto & ActualizarUsuarioDto>({
    correo: '',
    password: '',
    nombre: '',
    apellido: '',
    telefono: '',
    avatarUrl: '',
    restauranteId: '',
    rolId: '',
    activo: true,
    correoVerificado: false,
  });

  useEffect(() => {
    if (user?.restauranteId) {
      loadUsuarios();
      loadRoles();
    }
  }, [user?.restauranteId]);

  const loadUsuarios = async () => {
    if (!user?.restauranteId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await usuariosService.obtenerPorRestauranteId(user.restauranteId);
      // Ordenar por fecha de creación (más recientes primero)
      const sorted = data.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
      setUsuarios(sorted);
    } catch (err: any) {
      setError(err.message || 'Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      // Usar el servicio de API para obtener roles
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
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        return { ...prev, [name]: checked };
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
        correo: formData.correo.trim(),
      };

      // Solo incluir password si se está creando o si se está editando y se proporciona
      if (!editingUsuario && formData.password) {
        datosEnviar.password = formData.password;
      } else if (editingUsuario && formData.password && formData.password.trim()) {
        datosEnviar.password = formData.password.trim();
      }

      if (formData.nombre?.trim()) {
        datosEnviar.nombre = formData.nombre.trim();
      }

      if (formData.apellido?.trim()) {
        datosEnviar.apellido = formData.apellido.trim();
      }

      if (formData.telefono?.trim()) {
        datosEnviar.telefono = formData.telefono.trim();
      }

      if (formData.avatarUrl?.trim()) {
        datosEnviar.avatarUrl = formData.avatarUrl.trim();
      }

      // Siempre incluir restauranteId
      datosEnviar.restauranteId = user.restauranteId;

      if (formData.rolId?.trim()) {
        datosEnviar.rolId = formData.rolId.trim();
      }

      // Incluir activo y correoVerificado
      if (formData.activo !== undefined) {
        datosEnviar.activo = formData.activo;
      }

      if (formData.correoVerificado !== undefined) {
        datosEnviar.correoVerificado = formData.correoVerificado;
      }

      if (editingUsuario) {
        // Actualizar - remover restauranteId del objeto para actualizar si no se cambia
        const { restauranteId, ...datosActualizar } = datosEnviar;
        // Si rolId está vacío, enviar null
        if (datosActualizar.rolId === '') {
          datosActualizar.rolId = null;
        }
        await usuariosService.actualizar(editingUsuario.id, datosActualizar);
        setSuccess('Usuario actualizado exitosamente');
      } else {
        // Crear - password es requerido
        if (!datosEnviar.password) {
          setError('La contraseña es requerida');
          return;
        }
        await usuariosService.crear(datosEnviar);
        setSuccess('Usuario creado exitosamente');
      }

      setShowForm(false);
      setEditingUsuario(null);
      resetForm();
      loadUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (usuario: UsuarioConRol) => {
    setEditingUsuario(usuario);
    setFormData({
      correo: usuario.correo,
      password: '', // No mostrar contraseña
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      telefono: usuario.telefono || '',
      avatarUrl: usuario.avatarUrl || '',
      restauranteId: usuario.restauranteId || '',
      rolId: usuario.rolId || '',
      activo: usuario.activo,
      correoVerificado: usuario.correoVerificado,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
      setError(null);
      await usuariosService.eliminar(id);
      setSuccess('Usuario eliminado exitosamente');
      loadUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el usuario');
    }
  };

  const handleToggleActivo = async (usuario: UsuarioConRol) => {
    try {
      setError(null);
      await usuariosService.actualizar(usuario.id, { activo: !usuario.activo });
      setSuccess(`Usuario ${usuario.activo ? 'desactivado' : 'activado'} exitosamente`);
      loadUsuarios();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el usuario');
    }
  };

  const resetForm = () => {
    setFormData({
      correo: '',
      password: '',
      nombre: '',
      apellido: '',
      telefono: '',
      avatarUrl: '',
      restauranteId: user?.restauranteId || '',
      rolId: '',
      activo: true,
      correoVerificado: false,
    });
    setShowPassword(false);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingUsuario(null);
    resetForm();
  };

  const getNombreCompleto = (usuario: UsuarioConRol) => {
    if (usuario.nombre && usuario.apellido) {
      return `${usuario.nombre} ${usuario.apellido}`;
    }
    return usuario.nombre || usuario.apellido || usuario.correo;
  };

  const getTotalActivos = () => {
    return usuarios.filter(u => u.activo).length;
  };

  const getTotalInactivos = () => {
    return usuarios.filter(u => !u.activo).length;
  };

  const getTotalVerificados = () => {
    return usuarios.filter(u => u.correoVerificado).length;
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
                  <Users className="h-7 w-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  Usuarios del Restaurante
                  {usuarios.length > 0 && !loading && (
                    <span className="ml-3 px-3 py-1 text-sm font-semibold bg-green-100 text-green-700 rounded-full">
                      {usuarios.length}
                    </span>
                  )}
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Gestiona los usuarios y permisos de tu restaurante
                </p>
              </div>
            </div>
            {!showForm && (
              <button
                onClick={() => {
                  setShowForm(true);
                  setEditingUsuario(null);
                  resetForm();
                }}
                className="inline-flex items-center px-5 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Usuario
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      {usuarios.length > 0 && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                <p className="text-2xl font-semibold text-gray-900">{usuarios.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Activos</p>
                <p className="text-2xl font-semibold text-gray-900">{getTotalActivos()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Inactivos</p>
                <p className="text-2xl font-semibold text-gray-900">{getTotalInactivos()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Verificados</p>
                <p className="text-2xl font-semibold text-gray-900">{getTotalVerificados()}</p>
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
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  name="correo"
                  id="correo"
                  required
                  value={formData.correo}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="usuario@ejemplo.com"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña {!editingUsuario && '*'}
                  {editingUsuario && <span className="text-xs text-gray-500">(dejar vacío para no cambiar)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    required={!editingUsuario}
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                    placeholder={editingUsuario ? 'Nueva contraseña (opcional)' : 'Mínimo 6 caracteres'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  id="nombre"
                  value={formData.nombre || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Juan"
                />
              </div>

              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  name="apellido"
                  id="apellido"
                  value={formData.apellido || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="Pérez"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  id="telefono"
                  value={formData.telefono || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="+57 300 1234567"
                />
              </div>

              <div>
                <label htmlFor="rolId" className="block text-sm font-medium text-gray-700 mb-2">
                  Rol
                </label>
                <select
                  name="rolId"
                  id="rolId"
                  value={formData.rolId || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white sm:text-sm transition-colors"
                  disabled={loadingRoles}
                >
                  <option value="">Sin rol asignado</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  URL del Avatar
                </label>
                <input
                  type="url"
                  name="avatarUrl"
                  id="avatarUrl"
                  value={formData.avatarUrl || ''}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                  placeholder="https://ejemplo.com/avatar.jpg"
                />
                {formData.avatarUrl && (
                  <div className="mt-2">
                    <img
                      src={formData.avatarUrl}
                      alt="Vista previa"
                      className="h-16 w-16 object-cover rounded-full border border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-end">
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors w-full">
                  <input
                    type="checkbox"
                    name="activo"
                    checked={formData.activo ?? true}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Usuario Activo</span>
                    <span className="block text-xs text-gray-500">Puede iniciar sesión</span>
                  </div>
                </label>
              </div>

              <div className="flex items-end">
                <label className="relative flex items-center p-4 rounded-lg border-2 border-gray-200 hover:border-green-300 cursor-pointer transition-colors w-full">
                  <input
                    type="checkbox"
                    name="correoVerificado"
                    checked={formData.correoVerificado ?? false}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <div className="ml-3">
                    <span className="block text-sm font-medium text-gray-900">Correo Verificado</span>
                    <span className="block text-xs text-gray-500">Correo electrónico verificado</span>
                  </div>
                </label>
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
                    {editingUsuario ? 'Actualizar' : 'Crear'} Usuario
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios - Vista mejorada con cards */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-green-600" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">No hay usuarios</h3>
          <p className="mt-2 text-sm text-gray-500">Comienza agregando tu primer usuario.</p>
          <div className="mt-6">
            <button
              onClick={() => {
                setShowForm(true);
                setEditingUsuario(null);
                resetForm();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Usuario
            </button>
          </div>
        </div>
      ) : (
        <div>
          {/* Grid de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md overflow-hidden ${
                  usuario.activo ? 'border-gray-200' : 'border-gray-300 opacity-75'
                }`}
              >
                <div className="p-5">
                  {/* Header del card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        {usuario.avatarUrl ? (
                          <img
                            src={usuario.avatarUrl}
                            alt={getNombreCompleto(usuario)}
                            className="h-14 w-14 rounded-full object-cover border-2 border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              const parent = (e.target as HTMLImageElement).parentElement;
                              if (parent) {
                                const fallback = parent.querySelector('.avatar-fallback');
                                if (fallback) fallback.classList.remove('hidden');
                              }
                            }}
                          />
                        ) : null}
                        <div className={`h-14 w-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center border-2 border-gray-200 ${usuario.avatarUrl ? 'hidden avatar-fallback' : ''}`}>
                          <span className="text-white font-semibold text-lg">
                            {getNombreCompleto(usuario).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {getNombreCompleto(usuario)}
                          </h3>
                          {usuario.correoVerificado && (
                            <div className="relative group">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                Correo verificado
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate mt-0.5">{usuario.correo}</p>
                      </div>
                    </div>
                    {!usuario.activo && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                        <EyeOff className="h-3 w-3 mr-1" />
                        Inactivo
                      </span>
                    )}
                  </div>

                  {/* Información de contacto */}
                  <div className="space-y-2 mb-4">
                    {usuario.telefono && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{usuario.telefono}</span>
                      </div>
                    )}
                    {usuario.rolNombre && (
                      <div className="flex items-center text-sm">
                        <Shield className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                        <span className="text-purple-600 font-medium">{usuario.rolNombre}</span>
                      </div>
                    )}
                    {usuario.restauranteNombre && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Building className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{usuario.restauranteNombre}</span>
                      </div>
                    )}
                  </div>

                  {/* Último acceso */}
                  {usuario.ultimoAcceso && (
                    <div className="mb-4 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Último acceso: {new Date(usuario.ultimoAcceso).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex items-center justify-end space-x-1 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleToggleActivo(usuario)}
                      className={`p-1.5 transition-colors ${
                        usuario.activo
                          ? 'text-green-600 hover:text-green-700'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title={usuario.activo ? 'Desactivar' : 'Activar'}
                    >
                      {usuario.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(usuario)}
                      className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(usuario.id)}
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
    </div>
  );
}
