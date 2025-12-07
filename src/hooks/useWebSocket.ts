/**
 * Hook para usar WebSocket en componentes React
 */
import { useEffect, useRef, useState } from 'react';
import { webSocketService } from '../services/websocket.service';
import { useAuth } from './useAuth';
import { suscripcionesService } from '../services/suscripciones.service';
import type { Suscripcion } from '../types/api.types';

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

export function useWebSocket() {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [hasWebSocketAccess, setHasWebSocketAccess] = useState<boolean | null>(null);
  const listenersRef = useRef<Map<string, Function[]>>(new Map());

  // Verificar si el usuario tiene acceso a WebSockets basado en su plan
  useEffect(() => {
    const checkWebSocketAccess = async () => {
      if (!isAuthenticated || !user?.restauranteId) {
        setHasWebSocketAccess(false);
        webSocketService.disconnect();
        setIsConnected(false);
        return;
      }

      try {
        const suscripcion: Suscripcion = await suscripcionesService.obtenerPorRestauranteId(user.restauranteId);
        // Los planes 'pro' y 'premium' tienen websockets habilitado, 'free' no
        const hasAccess = suscripcion?.tipoPlan === 'pro' || suscripcion?.tipoPlan === 'premium';
        setHasWebSocketAccess(hasAccess);

        if (!hasAccess) {
          // Plan free no tiene acceso a websockets
          webSocketService.disconnect();
          setIsConnected(false);
          return;
        }
      } catch (error) {
        // Si no hay suscripción o hay error, asumir que no tiene acceso (plan free)
        console.warn('Error al verificar suscripción para WebSocket:', error);
        setHasWebSocketAccess(false);
        webSocketService.disconnect();
        setIsConnected(false);
        return;
      }
    };

    checkWebSocketAccess();
  }, [isAuthenticated, user?.restauranteId]);

  useEffect(() => {
    if (!isAuthenticated || !user?.restauranteId) {
      webSocketService.disconnect();
      setIsConnected(false);
      return;
    }

    // Solo conectar si tiene acceso a websockets
    if (hasWebSocketAccess === true) {
      webSocketService.connect();

      // Verificar estado de conexión periódicamente
      const checkConnection = () => {
        setIsConnected(webSocketService.isConnected());
      };

      const interval = setInterval(checkConnection, 1000);
      checkConnection(); // Verificar inmediatamente

      return () => {
        clearInterval(interval);
        // No desconectar aquí, dejar que el servicio maneje la desconexión
      };
    } else if (hasWebSocketAccess === false) {
      // Plan free: no conectar websockets
      webSocketService.disconnect();
      setIsConnected(false);
    }
  }, [isAuthenticated, user?.restauranteId, hasWebSocketAccess]);

  /**
   * Escucha un evento específico
   */
  const on = (event: string, callback: (data: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, []);
    }
    listenersRef.current.get(event)!.push(callback);

    webSocketService.on(event, callback);

    // Cleanup function
    return () => {
      webSocketService.off(event, callback);
      const callbacks = listenersRef.current.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  };

  /**
   * Deja de escuchar un evento
   */
  const off = (event: string, callback?: Function) => {
    if (callback) {
      webSocketService.off(event, callback);
      const callbacks = listenersRef.current.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    } else {
      webSocketService.off(event);
      listenersRef.current.delete(event);
    }
  };

  /**
   * Emite un evento
   */
  const emit = (event: string, data?: any) => {
    webSocketService.emit(event, data);
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      listenersRef.current.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          webSocketService.off(event, callback);
        });
      });
      listenersRef.current.clear();
    };
  }, []);

  return {
    isConnected,
    hasWebSocketAccess, // Exponer si tiene acceso a websockets
    on,
    off,
    emit,
    socketId: webSocketService.getSocketId(),
  };
}

