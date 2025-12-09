/**
 * Componente para el formulario de pago directo de Wompi
 *
 * NOTA: La funcionalidad de Payment Link está comentada temporalmente
 * debido a problemas con la configuración del webhook en desarrollo.
 * Para reactivarla, descomentar las secciones marcadas con "PAYMENT LINK"
 */
// import { useState } from 'react'; // PAYMENT LINK: Descomentar para reactivar
// import { ExternalLink, Loader2 } from 'lucide-react'; // PAYMENT LINK: Descomentar para reactivar
import WompiPaymentForm from './WompiPaymentForm';
import type { PlanType } from '../types/api.types';

interface WompiPaymentOptionProps {
  planType: PlanType;
  isAnnual: boolean;
  onSubmit: (paymentMethodId: string) => Promise<void>;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export default function WompiPaymentOption({
  planType: _planType, // PAYMENT LINK: Remover el _ cuando se reactive
  isAnnual: _isAnnual, // PAYMENT LINK: Remover el _ cuando se reactive
  onSubmit,
  onError,
  disabled,
}: WompiPaymentOptionProps) {
  // PAYMENT LINK: Descomentar estas líneas para reactivar
  // const [paymentMethod, setPaymentMethod] = useState<'form' | 'link'>('link');
  // const [isRedirecting, setIsRedirecting] = useState(false);

  /* PAYMENT LINK: Funcionalidad comentada temporalmente
  const handleRedirectToPaymentLink = async () => {
    setIsRedirecting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5290/api';
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
      }

      // Obtener el link de pago del backend
      const response = await fetch(
        `${baseUrl}/suscripciones/wompi/payment-link?plan=${_planType}&annual=${_isAnnual}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || data.error || 'No se pudo obtener el link de pago';
        console.error('Error al obtener payment link:', data);
        throw new Error(errorMessage);
      }

      if (data.data && data.data.paymentLink) {
        const paymentLinkUrl = data.data.paymentLink;
        const reference = data.data.reference;

        // Log para debugging
        console.log('🔗 Redirigiendo a payment link de Wompi:', paymentLinkUrl);
        console.log('📋 Reference:', reference);

        // Validar que la URL sea válida
        try {
          const url = new URL(paymentLinkUrl);
          console.log('✅ URL válida, dominio:', url.hostname);

          // Intentar agregar parámetros de redirección si Wompi lo soporta
          // Algunos payment links de Wompi permiten redirect_url como parámetro
          const redirectUrl = `${window.location.origin}/dashboard/planes?wompi_callback=true&reference=${encodeURIComponent(reference || '')}`;
          url.searchParams.set('redirect_url', redirectUrl);

          // Guardar la referencia en localStorage para recuperarla después
          if (reference) {
            localStorage.setItem('wompi_payment_reference', reference);
            localStorage.setItem('wompi_payment_plan', _planType);
          }

          console.log('🔗 URL con redirect_url:', url.toString());

          // Redirigir al link de pago de Wompi
          // Nota: Si Wompi no acepta redirect_url como parámetro, el usuario será redirigido
          // a la página por defecto de Wompi después del pago, y deberá volver manualmente
          window.location.href = url.toString();
          // No resetear isRedirecting aquí porque la página se está redirigiendo
        } catch (urlError) {
          console.error('❌ URL de payment link inválida:', paymentLinkUrl);
          throw new Error('La URL del link de pago es inválida');
        }
      } else {
        console.error('❌ Respuesta del servidor no contiene paymentLink:', data);
        throw new Error('El link de pago no está disponible en la respuesta del servidor');
      }
    } catch (error: any) {
      setIsRedirecting(false);
      console.error('Error completo al obtener payment link:', error);
      if (onError) {
        onError(error.message || 'Error al obtener el link de pago');
      }
    }
  };
  */// FIN PAYMENT LINK

  return (
    <div className="space-y-6">
      {/* PAYMENT LINK: Selector de método de pago comentado temporalmente
      <div className="bg-gray-50 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Método de pago con Wompi
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('link')}
            disabled={disabled || isRedirecting}
            className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
              paymentMethod === 'link'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled || isRedirecting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ExternalLink className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium text-sm">Link de Pago</div>
              <div className="text-xs text-gray-500">Redirige a Wompi</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('form')}
            disabled={disabled || isRedirecting}
            className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
              paymentMethod === 'form'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled || isRedirecting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <CreditCard className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium text-sm">Formulario</div>
              <div className="text-xs text-gray-500">Pago directo</div>
            </div>
          </button>
        </div>
      </div>
      */}

      {/* PAYMENT LINK: Opción 1 comentada temporalmente
      {paymentMethod === 'link' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-3">
              <strong>Opción recomendada:</strong> Serás redirigido a la página segura de Wompi para completar tu pago.
            </p>
            <button
              type="button"
              onClick={handleRedirectToPaymentLink}
              disabled={disabled || isRedirecting}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirigiendo...
                </>
              ) : (
                <>
                  <ExternalLink className="h-5 w-5" />
                  Pagar con Wompi
                </>
              )}
            </button>
          </div>
        </div>
      )}
      */}

      {/* Formulario de pago directo - Ahora es la única opción */}
      <WompiPaymentForm
        onSubmit={onSubmit}
        onError={onError}
        disabled={disabled}
      />
    </div>
  );
}

