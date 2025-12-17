/**
 * Página de selección de planes de suscripción
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Crown, Zap, Gift, ArrowUp, Sparkles, Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { suscripcionesService } from '../services/suscripciones.service';
import WompiPaymentOption from '../components/WompiPaymentOption';
import type { PlanType, Suscripcion } from '../types/api.types';

interface Plan {
  id: PlanType;
  name: string;
  description: string;
  priceMonthly: string;
  priceAnnual: string;
  features: string[];
  limitations: string[];
  popular?: boolean;
  icon: typeof Check;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfecto para empezar',
    priceMonthly: '$0',
    priceAnnual: '$0',
    features: [
      'Hasta 15 items en el menú',
      'Hasta 5 mesas',
      '1 usuario (solo administrador)',
      'QR automático por mesa',
      'Soporte por email',
    ],
    limitations: [
      'Sin WebSockets (actualizaciones manuales)',
      'Sin analytics',
      'Sin enlaces sociales',
    ],
    icon: Gift,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Para restaurantes en crecimiento',
    priceMonthly: '$9',
    priceAnnual: '$90',
    features: [
      'Items ilimitados en el menú',
      'Mesas ilimitadas',
      'Usuarios ilimitados',
      'WebSockets (tiempo real)',
      'Personalización completa',
      'Enlaces sociales',
      'Soporte prioritario',
    ],
    limitations: [],
    popular: true,
    icon: Zap,
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Funcionalidades avanzadas',
    priceMonthly: '$14',
    priceAnnual: '$140',
    features: [
      'Todo lo de Pro +',
      'Sistema de reservas de mesas completo',
      'Gestión de horarios y políticas de reservas',
      'Calendario de reservas interactivo',
      'Confirmación automática de reservas',
      'Notificaciones push para clientes',
      'Historial completo de reservas',
      'Analytics y reportes avanzados (próximamente)',
      'Promociones y descuentos (próximamente)',
      'Reseñas y calificaciones (próximamente)',
      'Gestión de stock/inventario (próximamente)',
      'Integración con delivery (próximamente)',
      'API personalizada (próximamente)',
      'Soporte 24/7',
    ],
    limitations: [],
    icon: Crown,
  },
];

export default function PlanesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  // Solo planes mensuales están disponibles por ahora
  const isAnnual = false;
  // Solo Wompi está disponible
  const paymentProvider: 'wompi' = 'wompi';
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [suscripcionActual, setSuscripcionActual] = useState<Suscripcion | null>(null);
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true);
  // Ref para evitar que el callback handler se ejecute múltiples veces
  const callbackProcessedRef = useRef<string | false>(false);

  useEffect(() => {
    // Solo redirigir si ya terminó de cargar y no hay usuario
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Cargar suscripción actual
  useEffect(() => {
    const cargarSuscripcion = async () => {
      if (!user?.restauranteId) {
        setLoadingSuscripcion(false);
        return;
      }

      try {
        const suscripcion = await suscripcionesService.obtenerPorRestauranteId(user.restauranteId);
        setSuscripcionActual(suscripcion);
      } catch (err: any) {
        // Si no hay suscripción, es normal (usuario nuevo)
        setSuscripcionActual(null);
      } finally {
        setLoadingSuscripcion(false);
      }
    };

    if (user?.restauranteId) {
      cargarSuscripcion();
    }
  }, [user?.restauranteId]);

  // Manejar callback de Wompi después del pago
  useEffect(() => {
    // Solo ejecutar si el usuario ya está cargado y la suscripción ya se cargó
    if (!user?.restauranteId || loadingSuscripcion) return;

    const urlParams = new URLSearchParams(window.location.search);
    const wompiCallback = urlParams.get('wompi_callback');
    const status = urlParams.get('status') || urlParams.get('transaction_status');
    const reference = urlParams.get('reference');

    // Limpiar localStorage si no hay callback válido (datos antiguos)
    if (!wompiCallback && !reference && !status) {
      localStorage.removeItem('wompi_payment_reference');
      localStorage.removeItem('wompi_payment_plan');
      return;
    }

    // Solo procesar si hay un callback explícito en la URL
    if (wompiCallback === 'true' || reference || status) {
      // Verificar si ya se procesó este callback (evitar ejecuciones múltiples)
      const callbackKey = `${wompiCallback || ''}_${reference || ''}_${status || ''}`;
      if (callbackProcessedRef.current === callbackKey) {
        return; // Ya se procesó este callback
      }

      // Marcar como procesado para evitar ejecuciones múltiples
      callbackProcessedRef.current = callbackKey;

      // Limpiar localStorage cuando hay un callback válido
      localStorage.removeItem('wompi_payment_reference');
      localStorage.removeItem('wompi_payment_plan');

      const checkSubscriptionStatus = async () => {
        try {
          console.log('🔄 Verificando estado del pago con Wompi...');

          // Esperar un poco más para que el webhook procese (5 segundos en lugar de 3)
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Recargar la suscripción para ver el estado actualizado
          const suscripcionNueva = await suscripcionesService.obtenerPorRestauranteId(user.restauranteId!);
          setSuscripcionActual(suscripcionNueva);

          console.log('📊 Estado de la suscripción después de verificar:', suscripcionNueva?.estado);

          // Verificar el estado basado en la respuesta de Wompi
          if (status === 'APPROVED' || status === 'APPROVED_PARTIAL') {
            // Si Wompi dice que fue aprobado, verificar el estado de la suscripción
            if (suscripcionNueva && suscripcionNueva.estado === 'active') {
              setSuccess(true);
              window.history.replaceState({}, document.title, window.location.pathname);
              setTimeout(() => {
                navigate('/dashboard');
              }, 3000);
            } else {
              // El pago fue aprobado pero la suscripción aún no se actualizó
              // Mostrar mensaje informativo
              setError('El pago fue procesado exitosamente. La suscripción se está activando, por favor espera unos segundos y recarga la página.');
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          } else if (status === 'DECLINED' || status === 'VOIDED' || status === 'ERROR' || status === 'REJECTED') {
            setError('El pago fue rechazado o falló. Por favor, intenta de nuevo.');
            window.history.replaceState({}, document.title, window.location.pathname);
          } else if (status === 'PENDING') {
            // El pago está pendiente, puede tomar unos minutos
            setError('El pago está siendo procesado. Te notificaremos cuando se complete. Puedes cerrar esta ventana.');
            setTimeout(() => {
              window.history.replaceState({}, document.title, window.location.pathname);
            }, 5000);
          } else {
            // Sin estado en URL, verificar si la suscripción está activa
            if (suscripcionNueva && suscripcionNueva.estado === 'active') {
              setSuccess(true);
              window.history.replaceState({}, document.title, window.location.pathname);
              setTimeout(() => {
                navigate('/dashboard');
              }, 3000);
            } else {
              // No se pudo verificar el estado, mostrar mensaje
              console.log('⚠️ No se pudo verificar el estado del pago. Suscripción:', suscripcionNueva?.estado);
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } catch (err) {
          console.error('Error al verificar suscripción después del pago:', err);
          setError('Error al verificar el estado del pago. Por favor, verifica tu suscripción más tarde.');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      checkSubscriptionStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.restauranteId, loadingSuscripcion]);

  const handlePlanSelect = (planId: PlanType) => {
    if (planId === 'free') {
      // El plan FREE no requiere pago
      handleFreePlan();
    } else {
      setSelectedPlan(planId);
      setError(null);
    }
  };

  const handleFreePlan = async () => {
    if (!user?.restauranteId) {
      setError('No se encontró el restaurante');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await suscripcionesService.crear({
        restauranteId: user.restauranteId,
        tipoPlan: 'free',
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al crear la suscripción FREE');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSubmit = async (paymentMethodId: string) => {
    if (!user?.restauranteId || !selectedPlan) {
      setError('Datos incompletos');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await suscripcionesService.crear({
        restauranteId: user.restauranteId,
        tipoPlan: selectedPlan,
        isAnnual,
        paymentProvider,
        paymentMethodId,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al procesar la suscripción');
      throw err; // Re-lanzar para que el formulario de pago lo maneje
    } finally {
      setIsProcessing(false);
    }
  };

  // Comentado: Este useEffect causaba redirecciones innecesarias
  // Si necesitas limpiar el estado de éxito, hazlo manualmente desde los botones

  // Mostrar loading mientras se verifica la autenticación
  if (loading || loadingSuscripcion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  // Si no hay usuario después de cargar, no mostrar nada (ya se redirigió)
  if (!user) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Suscripción activada!
          </h2>
          <p className="text-gray-600">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  // Si ya tiene una suscripción activa, mostrar el plan actual y opciones de actualización
  const planActual = suscripcionActual 
    ? plans.find(p => p.id === suscripcionActual.tipoPlan)
    : null;
  
  // Determinar qué planes mostrar según el estado de la suscripción
  const planesDisponibles = suscripcionActual && suscripcionActual.estado === 'active'
    ? plans.filter(p => {
        // Si tiene una suscripción activa, solo mostrar planes superiores
        // Si tiene FREE, puede ir a PRO o PREMIUM
        if (suscripcionActual.tipoPlan === 'free') {
          return p.id === 'pro' || p.id === 'premium';
        }
        // Si tiene PRO, solo puede ir a PREMIUM
        if (suscripcionActual.tipoPlan === 'pro') {
          return p.id === 'premium';
        }
        // Si tiene PREMIUM, no hay planes superiores
        return false;
      })
    : // Si no hay suscripción activa (null, incomplete, pending), mostrar todos los planes de pago
    plans.filter(p => {
        // Si hay una suscripción incomplete/pending, no mostrar el plan FREE (ya lo tienen)
        if (suscripcionActual && suscripcionActual.estado !== 'active' && suscripcionActual.tipoPlan === 'free') {
          return p.id === 'pro' || p.id === 'premium';
        }
        // Mostrar todos los planes si no hay suscripción o es free
        return true;
      });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con gradiente verde */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-6">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg flex-shrink-0">
              <Sparkles className="h-10 w-10 sm:h-14 sm:w-14 text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {suscripcionActual && suscripcionActual.estado === 'active' 
                  ? 'Tu Plan Actual' 
                  : 'Elige tu Plan'}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                {suscripcionActual && suscripcionActual.estado === 'active'
                  ? 'Gestiona tu suscripción y actualiza a un plan superior'
                  : 'Selecciona el plan que mejor se adapte a las necesidades de tu restaurante'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">

        {/* Mostrar plan actual si tiene suscripción activa */}
        {suscripcionActual && suscripcionActual.estado === 'active' && planActual && (
          <div className="max-w-3xl mx-auto mb-8 sm:mb-12">
            <div className="bg-white rounded-2xl border-2 border-green-500 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-xl flex-shrink-0">
                      {(() => {
                        const Icon = planActual.icon;
                        return <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />;
                      })()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 truncate">
                        Plan {planActual.name}
                      </h2>
                      <p className="text-sm sm:text-base text-green-50 truncate">{planActual.description}</p>
                    </div>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full flex-shrink-0 w-full sm:w-auto">
                    <span className="text-white font-semibold flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                      Activo
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 lg:p-8">
                {suscripcionActual.finPeriodoActual && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600 mb-1 flex-wrap">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Próxima renovación:</span>
                    </div>
                    <p className="text-gray-900 font-semibold text-sm sm:text-base">
                      {new Date(suscripcionActual.finPeriodoActual).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {planActual.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mostrar planes disponibles para actualizar */}
        {suscripcionActual && suscripcionActual.estado === 'active' && planesDisponibles.length > 0 && (
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-green-100 rounded-full mb-3 sm:mb-4">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                Actualizar a un Plan Superior
              </h2>
            </div>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg">
              Mejora tu plan para acceder a más funcionalidades
            </p>
          </div>
        )}


        {/* Grid de Planes */}
        {!selectedPlan && (
          <div className={`grid grid-cols-1 ${planesDisponibles.length === 1 ? 'sm:grid-cols-1 max-w-md mx-auto' : planesDisponibles.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-6 sm:gap-8`}>
            {planesDisponibles.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-4 sm:p-6 lg:p-8 bg-white transition-all cursor-pointer hover:shadow-xl ${
                    plan.popular
                      ? 'border-green-500 shadow-lg sm:scale-105'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 sm:px-5 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg whitespace-nowrap">
                        Más Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg ${
                      plan.popular 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : plan.id === 'free'
                        ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                        : 'bg-gradient-to-br from-green-400 to-emerald-500'
                    }`}>
                      <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">{plan.description}</p>
                    <div className="mb-2">
                      {plan.id === 'free' ? (
                        <>
                          <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                            {plan.priceMonthly}
                          </span>
                          <span className="text-gray-600 text-base sm:text-lg">/mes</span>
                          <span className="text-xs sm:text-sm text-gray-500 ml-1">USD</span>
                        </>
                      ) : (
                        <>
                          <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
                            {plan.id === 'pro' ? '$20,000' : '$35,000'}
                          </span>
                          <span className="text-gray-600 text-base sm:text-lg">/mes</span>
                          <span className="text-xs sm:text-sm text-gray-500 ml-1">COP</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 min-h-[200px]">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start gap-2 opacity-60">
                        <span className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5 text-gray-400 flex items-center justify-center text-sm sm:text-base">
                          ×
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 line-through">
                          {limitation}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                        : plan.id === 'free'
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {suscripcionActual && suscripcionActual.estado === 'active' ? (
                      <>
                        <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="truncate">Actualizar a {plan.name}</span>
                      </>
                    ) : suscripcionActual && suscripcionActual.estado === 'incomplete' ? (
                      plan.id === 'free' ? (
                        'Plan Gratis (Ya tienes)'
                      ) : (
                        `Continuar con ${plan.name}`
                      )
                    ) : plan.id === 'free' ? (
                      'Seleccionar Gratis'
                    ) : (
                      'Seleccionar Plan'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Formulario de Pago */}
        {selectedPlan && selectedPlan !== 'free' && (
          <div className="max-w-2xl mx-auto mt-8 sm:mt-12">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setError(null);
                  }}
                  className="text-white hover:text-green-100 text-sm sm:text-base font-medium mb-3 sm:mb-4 flex items-center gap-2 transition-colors"
                >
                  ← Volver a seleccionar plan
                </button>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  Confirmar Suscripción {selectedPlan.toUpperCase()}
                </h2>
                <p className="text-sm sm:text-base text-green-50">
                  Plan Mensual -{' '}
                  {selectedPlan === 'pro'
                    ? '$20,000/mes COP'
                    : '$35,000/mes COP'}
                </p>
              </div>

              <div className="p-4 sm:p-6 lg:p-8">
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 break-words">
                    {error}
                  </div>
                )}

                {/* Mensaje informativo si el pago fue exitoso pero la suscripción aún no se activó */}
                {!error && !success && suscripcionActual && suscripcionActual.estado === 'incomplete' && (
                  <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6">
                    <p className="mb-3">
                      El pago fue procesado exitosamente. La suscripción se está activando y puede tardar unos segundos.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={async () => {
                          // Recargar la suscripción
                          try {
                            const susc = await suscripcionesService.obtenerPorRestauranteId(user!.restauranteId!);
                            setSuscripcionActual(susc);
                            if (susc && susc.estado === 'active') {
                              setSuccess(true);
                              setTimeout(() => navigate('/dashboard'), 2000);
                            }
                          } catch (err) {
                            console.error('Error al verificar suscripción:', err);
                          }
                        }}
                        className="text-yellow-900 underline font-medium hover:text-yellow-950"
                      >
                        Verificar estado
                      </button>
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Ir al Dashboard
                      </button>
                    </div>
                  </div>
                )}

                <WompiPaymentOption
                  planType={selectedPlan}
                  isAnnual={isAnnual}
                  onSubmit={handlePaymentSubmit}
                  onError={(err) => setError(err)}
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>
        )}

        {/* Procesando plan FREE */}
        {selectedPlan === 'free' && isProcessing && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Activando plan FREE...</p>
          </div>
        )}
      </div>
    </div>
  );
}

