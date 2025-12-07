/**
 * Hook para usar WebSocket en componentes React
 */
import { useEffect, useRef, useState } from 'react';
import { webSocketService } from '../services/websocket.service';
import { useAuth } from './useAuth';

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

export function useWebSocket() {
  const { isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Map<string, Function[]>>(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      webSocketService.disconnect();
      setIsConnected(false);
      return;
    }

    // Conectar cuando el usuario está autenticado
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
  }, [isAuthenticated]);

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
    on,
    off,
    emit,
    socketId: webSocketService.getSocketId(),
  };
}

