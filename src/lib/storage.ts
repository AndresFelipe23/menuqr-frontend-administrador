/**
 * Utilidades para manejo de localStorage con tipado
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

export const storage = {
  /**
   * Guarda un valor en localStorage
   */
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error al guardar en localStorage:', error);
    }
  },

  /**
   * Obtiene un valor de localStorage
   */
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error al leer de localStorage:', error);
      return null;
    }
  },

  /**
   * Elimina un valor de localStorage
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error al eliminar de localStorage:', error);
    }
  },

  /**
   * Limpia todo el localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error al limpiar localStorage:', error);
    }
  },

  /**
   * Guarda un objeto JSON en localStorage
   */
  setJSON<T>(key: string, value: T): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error al guardar JSON en localStorage:', error);
    }
  },

  /**
   * Obtiene y parsea un objeto JSON de localStorage
   */
  getJSON<T>(key: string): T | null {
    try {
      const item = this.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error al leer JSON de localStorage:', error);
      return null;
    }
  },

  /**
   * Acceso directo a las claves comunes
   */
  keys: STORAGE_KEYS,
};

