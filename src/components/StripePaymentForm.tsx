/**
 * Componente de formulario de pago con Stripe Elements
 * 
 * NOTA: Este componente está COMENTADO temporalmente.
 * Solo se usa Wompi como método de pago actualmente.
 * Para reactivarlo, descomenta todo el código y actualiza PlanesPage.
 */
/*
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { CreditCard, Loader2 } from 'lucide-react';

// Stripe se inicializará de forma lazy cuando se tenga la clave
let stripePromise: Promise<any> | null = null;

function getStripePromise(publishableKey: string) {
  if (!stripePromise && publishableKey) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}
*/

/*
interface StripePaymentFormProps {
  onSubmit: (paymentMethodId: string) => Promise<void>;
  onError?: (error: string) => void;
  disabled?: boolean;
}

/**
 * Componente interno que maneja el formulario de pago
 */
/*
function PaymentForm({ onSubmit, onError, disabled }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Elemento de tarjeta no encontrado');
      }

      // Crear el método de pago
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (createError) {
        throw new Error(createError.message || 'Error al procesar la tarjeta');
      }

      if (!paymentMethod) {
        throw new Error('No se pudo crear el método de pago');
      }

      // Llamar al callback con el payment method ID
      await onSubmit(paymentMethod.id);
    } catch (err: any) {
      const errorMessage = err.message || 'Error al procesar el pago';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Información de la Tarjeta
        </label>
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing || disabled}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            Confirmar Pago
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        🔒 Tus datos de pago están protegidos por Stripe. No almacenamos información de tarjetas.
      </p>
    </form>
  );
}
*/

/**
 * Componente wrapper que proporciona el contexto de Stripe Elements
 * 
 * COMENTADO: Solo se usa Wompi actualmente. Para reactivar Stripe, descomenta todo el código.
 */
export default function StripePaymentForm(props: any) {
  // Componente comentado - solo retorna null
  return null;
  
  /*
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
        ⚠️ VITE_STRIPE_PUBLISHABLE_KEY no está configurada. Por favor, agrega esta variable en tu archivo .env
      </div>
    );
  }

  const stripePromiseInstance = getStripePromise(publishableKey);

  return (
    <Elements stripe={stripePromiseInstance}>
      <PaymentForm {...props} />
    </Elements>
  );
  */
}

