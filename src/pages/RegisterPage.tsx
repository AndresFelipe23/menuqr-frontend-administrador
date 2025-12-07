import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Store, 
  Link as LinkIcon, 
  UserPlus, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    nombreRestaurante: '',
    slugRestaurante: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setFormError(null);

    // Validar fortaleza de contraseña
    if (name === 'password') {
      if (value.length === 0) {
        setPasswordStrength(null);
      } else if (value.length < 6) {
        setPasswordStrength('weak');
      } else if (value.length < 10) {
        setPasswordStrength('medium');
      } else {
        setPasswordStrength('strong');
      }
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNombreRestauranteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nombre = e.target.value;
    setFormData(prev => ({
      ...prev,
      nombreRestaurante: nombre,
      slugRestaurante: generateSlug(nombre),
    }));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validaciones
    if (!formData.email || !formData.password || !formData.nombre || !formData.nombreRestaurante || !formData.slugRestaurante) {
      setFormError('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError('Las contraseñas no coinciden');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(formData.slugRestaurante)) {
      setFormError('El slug solo puede contener letras minúsculas, números y guiones');
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        nombre: formData.nombre,
        nombreRestaurante: formData.nombreRestaurante,
        slugRestaurante: formData.slugRestaurante,
      });
      // Redirigir al dashboard después del registro exitoso
      navigate('/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar. Por favor intenta nuevamente.');
    }
  };

  const getPasswordStrengthColor = () => {
    if (!passwordStrength) return '';
    switch (passwordStrength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
      default:
        return '';
    }
  };

  const getPasswordStrengthText = () => {
    if (!passwordStrength) return '';
    switch (passwordStrength) {
      case 'weak':
        return 'Débil';
      case 'medium':
        return 'Media';
      case 'strong':
        return 'Fuerte';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Botón volver al landing */}
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-600 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al inicio
        </Link>

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Crear Cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Comienza a gestionar tu restaurante en minutos
            </p>
          </div>

          {/* Formulario */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Errores */}
            {(error || formError) && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {error || formError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-indigo-600" />
                  Información Personal
                </h3>
                
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 transition-colors"
                      placeholder="Juan Pérez"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 transition-colors"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Información del Restaurante */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Store className="h-5 w-5 mr-2 text-indigo-600" />
                  Información del Restaurante
                </h3>
                
                <div>
                  <label htmlFor="nombreRestaurante" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Restaurante *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Store className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="nombreRestaurante"
                      name="nombreRestaurante"
                      type="text"
                      required
                      value={formData.nombreRestaurante}
                      onChange={handleNombreRestauranteChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 transition-colors"
                      placeholder="Mi Restaurante"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="slugRestaurante" className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL única) *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LinkIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="slugRestaurante"
                      name="slugRestaurante"
                      type="text"
                      required
                      value={formData.slugRestaurante}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 font-mono text-sm transition-colors"
                      placeholder="mi-restaurante"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Se genera automáticamente. Solo letras minúsculas, números y guiones.
                  </p>
                </div>
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Lock className="h-5 w-5 mr-2 text-indigo-600" />
                Contraseña
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 transition-colors"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                  {passwordStrength && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Fortaleza:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength === 'weak' ? 'text-red-600' :
                          passwordStrength === 'medium' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${getPasswordStrengthColor()}`}
                          style={{
                            width: passwordStrength === 'weak' ? '33%' :
                                   passwordStrength === 'medium' ? '66%' : '100%'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 transition-colors"
                      placeholder="Confirma tu contraseña"
                    />
                  </div>
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="mt-2 flex items-center text-xs text-green-600">
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Las contraseñas coinciden
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 mr-2" />
                  Crear Cuenta
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Información adicional */}
        <p className="mt-6 text-center text-xs text-gray-500">
          Al registrarte, aceptas nuestros términos de servicio y política de privacidad
        </p>
      </div>
    </div>
  );
}
