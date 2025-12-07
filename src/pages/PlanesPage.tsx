/**
 * Página de selección de planes de suscripción
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Crown, Zap, Gift, ArrowUp, CreditCard } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { suscripcionesService } from '../services/suscripciones.service';
import StripePaymentForm from '../components/StripePaymentForm';
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
      'Analytics y reportes avanzados',
      'Reservas de mesas',
      'Promociones y descuentos',
      'Reseñas y calificaciones',
      'Gestión de stock/inventario',
      'Integración con delivery',
      'API personalizada',
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
  const [isAnnual, setIsAnnual] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'wompi'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [suscripcionActual, setSuscripcionActual] = useState<Suscripcion | null>(null);
  const [loadingSuscripcion, setLoadingSuscripcion] = useState(true);

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
    const urlParams = new URLSearchParams(window.location.search);
    const wompiCallback = urlParams.get('wompi_callback');
    const transactionId = urlParams.get('id');
    const status = urlParams.get('status');

    if (wompiCallback === 'true' && transactionId) {
      // El usuario regresó del link de pago de Wompi
      // El webhook de Wompi debería haber procesado el pago, pero verificamos el estado
      if (status === 'APPROVED') {
        setSuccess(true);
        // Recargar la suscripción para ver el estado actualizado
        if (user?.restauranteId) {
          setTimeout(async () => {
            try {
              const suscripcion = await suscripcionesService.obtenerPorRestauranteId(user.restauranteId!);
              setSuscripcionActual(suscripcion);
              // Limpiar los parámetros de la URL
              window.history.replaceState({}, document.title, window.location.pathname);
              setTimeout(() => {
                navigate('/dashboard');
              }, 2000);
            } catch (err) {
              console.error('Error al cargar suscripción después del pago:', err);
            }
          }, 1000);
        }
      } else if (status === 'DECLINED' || status === 'VOIDED' || status === 'ERROR') {
        setError('El pago fue rechazado o falló. Por favor, intenta de nuevo.');
        // Limpiar los parámetros de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [user?.restauranteId, navigate]);

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

  // Mostrar loading mientras se verifica la autenticación
  if (loading || loadingSuscripcion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
  const planesDisponibles = suscripcionActual && suscripcionActual.estado === 'active'
    ? plans.filter(p => {
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
    : plans;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {suscripcionActual && suscripcionActual.estado === 'active' 
              ? 'Tu Plan Actual' 
              : 'Elige tu Plan'}
          </h1>
          <p className="text-xl text-gray-600">
            {suscripcionActual && suscripcionActual.estado === 'active'
              ? 'Gestiona tu suscripción y actualiza a un plan superior'
              : 'Selecciona el plan que mejor se adapte a las necesidades de tu restaurante'}
          </p>
        </div>

        {/* Mostrar plan actual si tiene suscripción activa */}
        {suscripcionActual && suscripcionActual.estado === 'active' && planActual && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-2xl border-2 border-indigo-600 shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {(() => {
                    const Icon = planActual.icon;
                    return <Icon className="h-8 w-8 text-indigo-600" />;
                  })()}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Plan {planActual.name}
                </h2>
                <p className="text-gray-600 mb-4">{planActual.description}</p>
                <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                  Activo
                </div>
                {suscripcionActual.finPeriodoActual && (
                  <p className="text-sm text-gray-500">
                    Renovación: {new Date(suscripcionActual.finPeriodoActual).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>
              <ul className="space-y-3 mb-6">
                {planActual.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Mostrar planes disponibles para actualizar */}
        {suscripcionActual && suscripcionActual.estado === 'active' && planesDisponibles.length > 0 && (
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Actualizar a un Plan Superior
            </h2>
            <p className="text-gray-600">
              Mejora tu plan para acceder a más funcionalidades
            </p>
          </div>
        )}

        {/* Selector de período y método de pago (solo para planes de pago) */}
        {selectedPlan && selectedPlan !== 'free' && (
          <div className="flex flex-col items-center gap-6 mb-8">
            {/* Selector de método de pago */}
            <div className="bg-white rounded-lg p-1 border border-gray-200 inline-flex">
              <button
                type="button"
                onClick={() => setPaymentProvider('stripe')}
                className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                  paymentProvider === 'stripe'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Stripe
              </button>
              <button
                type="button"
                onClick={() => setPaymentProvider('wompi')}
                className={`px-6 py-2 rounded-md font-medium transition-all flex items-center gap-2 ${
                  paymentProvider === 'wompi'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                Wompi
              </button>
            </div>

            {/* Selector de período */}
            <div className="bg-white rounded-lg p-1 border border-gray-200 inline-flex">
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  !isAnnual
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  isAnnual
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                Anual
                <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                  Ahorra
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Grid de Planes */}
        {!selectedPlan && (
          <div className={`grid grid-cols-1 ${planesDisponibles.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' : planesDisponibles.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-8 mb-8`}>
            {planesDisponibles.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border-2 p-8 bg-white ${
                    plan.popular
                      ? 'border-indigo-600 shadow-xl scale-105'
                      : 'border-gray-200 hover:border-indigo-300'
                  } transition-all cursor-pointer`}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                        Más Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    <div className="mb-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.priceMonthly}
                      </span>
                      <span className="text-gray-600">/mes</span>
                      <span className="text-sm text-gray-500 ml-1">USD</span>
                    </div>
                    {plan.priceAnnual !== '$0' && (
                      <div className="text-sm text-gray-500">
                        o {plan.priceAnnual}/año USD
                      </div>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-gray-400">
                          ×
                        </span>
                        <span className="text-gray-500 line-through">
                          {limitation}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                      plan.popular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : plan.id === 'free'
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                  >
                    {suscripcionActual && suscripcionActual.estado === 'active' ? (
                      <>
                        <ArrowUp className="h-5 w-5" />
                        Actualizar a {plan.name}
                      </>
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
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="mb-6">
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setError(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-700 font-medium mb-4"
                >
                  ← Volver a seleccionar plan
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Confirmar Suscripción {selectedPlan.toUpperCase()}
                </h2>
                <p className="text-gray-600">
                  {isAnnual ? 'Plan Anual' : 'Plan Mensual'} -{' '}
                  {paymentProvider === 'wompi' ? (
                    selectedPlan === 'pro'
                      ? isAnnual
                        ? '$360,000/año COP'
                        : '$36,000/mes COP'
                      : isAnnual
                      ? '$560,000/año COP'
                      : '$56,000/mes COP'
                  ) : (
                    selectedPlan === 'pro'
                      ? isAnnual
                        ? '$90/año USD'
                        : '$9/mes USD'
                      : isAnnual
                      ? '$140/año USD'
                      : '$14/mes USD'
                  )}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
              )}

              {paymentProvider === 'stripe' ? (
                <StripePaymentForm
                  onSubmit={handlePaymentSubmit}
                  onError={(err) => setError(err)}
                  disabled={isProcessing}
                />
              ) : (
                <WompiPaymentOption
                  planType={selectedPlan}
                  isAnnual={isAnnual}
                  onSubmit={handlePaymentSubmit}
                  onError={(err) => setError(err)}
                  disabled={isProcessing}
                />
              )}
            </div>
          </div>
        )}

        {/* Procesando plan FREE */}
        {selectedPlan === 'free' && isProcessing && (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Activando plan FREE...</p>
          </div>
        )}
      </div>
    </div>
  );
}

