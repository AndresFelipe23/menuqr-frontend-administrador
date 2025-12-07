/**
 * Componente para elegir entre formulario de pago directo o link de pago de Wompi
 */
import { useState } from 'react';
import { ExternalLink, CreditCard, Loader2 } from 'lucide-react';
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
  planType,
  isAnnual,
  onSubmit,
  onError,
  disabled,
}: WompiPaymentOptionProps) {
  const [paymentMethod, setPaymentMethod] = useState<'form' | 'link'>('link');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleRedirectToPaymentLink = async () => {
    setIsRedirecting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5290/api';
      const token = localStorage.getItem('token');
      
      // Obtener el link de pago del backend
      const response = await fetch(
        `${baseUrl}/suscripciones/wompi/payment-link?plan=${planType}&annual=${isAnnual}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo obtener el link de pago');
      }
      
      if (data.data && data.data.paymentLink) {
        // Redirigir al link de pago de Wompi
        window.location.href = data.data.paymentLink;
      } else {
        throw new Error('El link de pago no está disponible');
      }
    } catch (error: any) {
      setIsRedirecting(false);
      if (onError) {
        onError(error.message || 'Error al obtener el link de pago');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Selector de método de pago */}
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

      {/* Opción 1: Link de pago (recomendado) */}
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

      {/* Opción 2: Formulario de pago directo */}
      {paymentMethod === 'form' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Esta opción requiere configuración adicional. Es recomendable usar el Link de Pago.
            </p>
          </div>
          <WompiPaymentForm
            onSubmit={onSubmit}
            onError={onError}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}

