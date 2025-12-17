/**
 * Servicio de WebSocket para comunicación en tiempo real
 */
import { io, Socket } from 'socket.io-client';
import { authService } from './auth.service';

// Extraer URL base sin path para Socket.io
const getWebSocketURL = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5290/api';
  
  try {
    // Si la URL incluye /api, removerlo ya que Socket.io se conecta al servidor raíz
    const url = new URL(apiUrl);
    // Remover el path y mantener solo el origen (protocolo + host + puerto)
    const baseUrl = `${url.protocol}//${url.host}`;
    
    return baseUrl;
  } catch (error) {
    // Si falla el parsing, intentar extraer manualmente
    console.warn('Error al parsear URL, usando fallback:', error);
    // Remover /api si existe
    const baseUrl = apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
    console.log('🔌 URL WebSocket (fallback):', baseUrl);
    return baseUrl || 'http://localhost:5290';
  }
};

const WS_URL = getWebSocketURL();

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Conecta al servidor WebSocket
   */
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = authService.getAccessToken();
    if (!token) {
      console.warn('No hay token de autenticación, no se puede conectar a WebSocket');
      return;
    }

    

    this.socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.socket.on('connect', () => {
    
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Máximo de intentos de reconexión alcanzado');
      }
    });

    // Re-registrar todos los listeners existentes
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback as any);
      });
    });
  }

  /**
   * Desconecta del servidor WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Escucha un evento
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  /**
   * Deja de escuchar un evento
   */
  off(event: string, callback?: Function): void {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      if (this.socket) {
        this.socket.off(event, callback as any);
      }
    } else {
      this.listeners.delete(event);
      if (this.socket) {
        this.socket.off(event);
      }
    }
  }

  /**
   * Emite un evento al servidor
   */
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket no está conectado, no se puede emitir evento:', event);
    }
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Obtiene el ID del socket
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const webSocketService = new WebSocketService();

