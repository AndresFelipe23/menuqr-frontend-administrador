import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usuariosService } from '../services';
import { restaurantsService } from '../services';
import type { ActualizarUsuarioDto, Restaurante } from '../types/api.types';
import ImageUpload from '../components/ImageUpload';
import {
  Settings,
  User,
  Lock,
  Mail,
  Phone,
  Building,
  Shield,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [, setLoadingUser] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>('perfil');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [restaurante, setRestaurante] = useState<Restaurante | null>(null);
  const [userData, setUserData] = useState<ActualizarUsuarioDto & { password?: string; newPassword?: string; confirmPassword?: string }>({
    nombre: '',
    correo: '',
    telefono: '',
    avatarUrl: '',
    password: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      loadUserData();
      if (user.restauranteId) {
        loadRestaurante();
      }
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      setLoadingUser(true);
      // Obtener datos completos del usuario usando obtenerPorId
      try {
        const usuarioCompleto = await usuariosService.obtenerPorId(user.id);
        
        if (usuarioCompleto) {
          setUserData({
            nombre: usuarioCompleto.nombre || '',
            correo: usuarioCompleto.correo || '',
            telefono: usuarioCompleto.telefono || '',
            avatarUrl: usuarioCompleto.avatarUrl || '',
            password: '',
            newPassword: '',
            confirmPassword: '',
          });
        } else {
          throw new Error('Usuario no encontrado');
        }
      } catch (err) {
        // Si falla, intentar obtener desde restaurante
        if (user.restauranteId) {
          try {
            const usuarios = await usuariosService.obtenerPorRestauranteId(user.restauranteId);
            const usuarioCompleto = usuarios.find(u => u.id === user.id);
            
            if (usuarioCompleto) {
              setUserData({
                nombre: usuarioCompleto.nombre || '',
                correo: usuarioCompleto.correo || '',
                telefono: usuarioCompleto.telefono || '',
                avatarUrl: usuarioCompleto.avatarUrl || '',
                password: '',
                newPassword: '',
                confirmPassword: '',
              });
            } else {
              throw new Error('Usuario no encontrado');
            }
          } catch {
            // Fallback a datos básicos
            setUserData({
              nombre: user.nombre || '',
              correo: user.email || '',
              telefono: '',
              avatarUrl: '',
              password: '',
              newPassword: '',
              confirmPassword: '',
            });
          }
        } else {
          // Fallback a datos básicos
          setUserData({
            nombre: user.nombre || '',
            correo: user.email || '',
            telefono: '',
            avatarUrl: '',
            password: '',
            newPassword: '',
            confirmPassword: '',
          });
        }
      }
    } catch (err: any) {
      console.error('Error al cargar datos del usuario:', err);
      // Usar datos básicos del user como fallback
      setUserData({
        nombre: user?.nombre || '',
        correo: user?.email || '',
        telefono: '',
        avatarUrl: '',
        password: '',
        newPassword: '',
        confirmPassword: '',
      });
    } finally {
      setLoadingUser(false);
      setLoading(false);
    }
  };

  const loadRestaurante = async () => {
    if (!user?.restauranteId) return;

    try {
      const data = await restaurantsService.obtenerPorId(user.restauranteId);
      setRestaurante(data);
    } catch (err: any) {
      console.error('Error al cargar restaurante:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSavePerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const datosEnviar: ActualizarUsuarioDto = {
        nombre: userData.nombre?.trim() || undefined,
        correo: userData.correo?.trim() || undefined,
        telefono: userData.telefono?.trim() || undefined,
        avatarUrl: userData.avatarUrl?.trim() || undefined,
      };

      await usuariosService.actualizar(user.id, datosEnviar);
      setSuccess('Perfil actualizado exitosamente');
      
      // Recargar datos
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (!userData.password) {
      setError('Debes ingresar tu contraseña actual');
      return;
    }

    if (!userData.newPassword || userData.newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (userData.newPassword !== userData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await usuariosService.actualizar(user.id, {
        password: userData.newPassword,
      });

      setSuccess('Contraseña actualizada exitosamente');
      setUserData((prev) => ({
        ...prev,
        password: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'perfil', name: 'Perfil', icon: User },
    { id: 'seguridad', name: 'Seguridad', icon: Lock },
    { id: 'restaurante', name: 'Restaurante', icon: Building },
    { id: 'permisos', name: 'Permisos', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header mejorado */}
      <div className="mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-xl border border-green-100 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex-shrink-0 w-fit">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configuración</h1>
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                Gestiona tu perfil, seguridad y preferencias
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes de éxito/error */}
      {error && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-red-800">Error</p>
            <p className="text-xs sm:text-sm text-red-700 break-words">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600 ml-auto flex-shrink-0"
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
          <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-green-800">Éxito</p>
            <p className="text-xs sm:text-sm text-green-700 break-words">{success}</p>
          </div>
          <button
            onClick={() => setSuccess(null)}
            className="text-green-400 hover:text-green-600 ml-auto flex-shrink-0"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar de navegación */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
            <nav className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-center lg:justify-start space-x-2 lg:space-x-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">{section.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            {/* Sección: Perfil */}
            {activeSection === 'perfil' && (
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Información del Perfil</h2>
                </div>

                <form onSubmit={handleSavePerfil} className="space-y-6">
                  {/* Avatar */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Foto de Perfil
                    </label>
                    <ImageUpload
                      value={userData.avatarUrl || null}
                      onChange={(url) => {
                        setUserData(prev => ({ ...prev, avatarUrl: url }));
                      }}
                      onRemove={() => {
                        setUserData(prev => ({ ...prev, avatarUrl: '' }));
                      }}
                      subfolder="perfiles"
                      label=""
                      previewSize="large"
                      shape="circle"
                      allowUrlInput={true}
                    />
                  </div>

                  {/* Nombre */}
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      id="nombre"
                      required
                      value={userData.nombre || ''}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                      placeholder="Tu nombre"
                    />
                  </div>

                  {/* Correo */}
                  <div>
                    <label htmlFor="correo" className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="correo"
                        id="correo"
                        required
                        value={userData.correo || ''}
                        onChange={handleChange}
                        className="block w-full pl-10 px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                        placeholder="usuario@ejemplo.com"
                      />
                    </div>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="telefono"
                        id="telefono"
                        value={userData.telefono || ''}
                        onChange={handleChange}
                        className="block w-full pl-10 px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                        placeholder="+57 300 1234567"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Sección: Seguridad */}
            {activeSection === 'seguridad' && (
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Seguridad</h2>
                </div>

                <form onSubmit={handleSavePassword} className="space-y-6">
                  {/* Contraseña actual */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña Actual *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        id="password"
                        required
                        value={userData.password || ''}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                        placeholder="Tu contraseña actual"
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

                  {/* Nueva contraseña */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="newPassword"
                        id="newPassword"
                        required
                        value={userData.newPassword || ''}
                        onChange={handleChange}
                        className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar contraseña */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Nueva Contraseña *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      required
                      value={userData.confirmPassword || ''}
                      onChange={handleChange}
                      className="block w-full px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-400 sm:text-sm transition-colors"
                      placeholder="Repite la nueva contraseña"
                      minLength={6}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Requisitos de contraseña:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>Mínimo 6 caracteres</li>
                          <li>Se recomienda usar una combinación de letras, números y símbolos</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                          Actualizando...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Actualizar Contraseña
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Sección: Restaurante */}
            {activeSection === 'restaurante' && (
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Building className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Información del Restaurante</h2>
                </div>

                {restaurante ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <p className="text-sm text-gray-900 font-medium">{restaurante.nombre}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                        <p className="text-sm text-gray-900 font-medium">{restaurante.slug}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                        <p className="text-sm text-gray-900">{restaurante.correo}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <p className="text-sm text-gray-900">{restaurante.telefono || 'No especificado'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          restaurante.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {restaurante.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Suscripción</label>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          restaurante.estadoSuscripcion === 'active'
                            ? 'bg-green-100 text-green-800'
                            : restaurante.estadoSuscripcion === 'trial'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {restaurante.estadoSuscripcion}
                        </span>
                      </div>
                    </div>

                    {restaurante.biografia && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Biografía</label>
                        <p className="text-sm text-gray-600">{restaurante.biografia}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <a
                        href="/dashboard/restaurant"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        <span className="whitespace-nowrap">Editar Configuración del Restaurante</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-sm font-medium text-gray-900">No hay restaurante asociado</h3>
                    <p className="mt-2 text-sm text-gray-500">No tienes un restaurante asignado a tu cuenta.</p>
                  </div>
                )}
              </div>
            )}

            {/* Sección: Permisos */}
            {activeSection === 'permisos' && (
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Permisos y Roles</h2>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rol Actual</label>
                    <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-purple-900 truncate">{user?.rolNombre || 'Sin rol'}</p>
                        <p className="text-xs text-purple-700">Tu rol en el sistema</p>
                      </div>
                    </div>
                  </div>

                  {user?.permisos && user.permisos.length > 0 ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Permisos</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {user.permisos.map((permiso, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <p className="text-sm font-medium text-gray-900">{permiso.nombre}</p>
                            {permiso.modulo && (
                              <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                {permiso.modulo}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                      <Shield className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No tienes permisos asignados</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-1">Sobre los permisos:</p>
                        <p className="text-xs">
                          Los permisos son gestionados por los administradores del restaurante. 
                          Si necesitas permisos adicionales, contacta con un administrador.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
