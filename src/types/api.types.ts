/**
 * Tipos e interfaces para las respuestas del API
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: ValidationError[];
  metadata?: ResponseMetadata;
}

export interface ResponseMetadata {
  timestamp?: string;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos de autenticación
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface Permiso {
  codigo: string;
  nombre: string;
  modulo: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  nombre: string;
  restauranteId?: string | null;
  rolId: string;
  rolNombre: string;
  permisos?: Permiso[]; // Opcional para compatibilidad con usuarios existentes
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

// Tipos de restaurante
export interface Restaurante {
  id: string;
  nombre: string;
  slug: string;
  correo: string;
  telefono: string | null;
  biografia: string | null;
  imagenPerfilUrl: string | null;
  imagenPortadaUrl: string | null;
  colorTema: string;
  colorTexto: string;
  colorFondo: string;
  familiaFuente: string;
  mostrarMenu: boolean;
  mostrarEnlaces: boolean;
  mostrarContacto: boolean;
  habilitarPedidos: boolean;
  direccion: string | null;
  ciudad: string | null;
  estadoProvincia: string | null;
  pais: string | null;
  codigoPostal: string | null;
  latitud: number | null;
  longitud: number | null;
  zonaHoraria: string;
  moneda: string;
  idioma: string;
  activo: boolean;
  estadoSuscripcion: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaEliminacion: string | null;
}

// DTOs para crear/actualizar restaurante
export interface CrearRestauranteDto {
  nombre: string;
  slug: string;
  correo: string;
  telefono?: string;
  biografia?: string;
  imagenPerfilUrl?: string;
  imagenPortadaUrl?: string;
  colorTema?: string;
  colorTexto?: string;
  colorFondo?: string;
  familiaFuente?: string;
  mostrarMenu?: boolean;
  mostrarEnlaces?: boolean;
  mostrarContacto?: boolean;
  direccion?: string;
  ciudad?: string;
  estadoProvincia?: string;
  pais?: string;
  codigoPostal?: string;
  latitud?: number;
  longitud?: number;
  zonaHoraria?: string;
  moneda?: string;
  idioma?: string;
}

export interface ActualizarRestauranteDto {
  nombre?: string;
  slug?: string;
  correo?: string;
  telefono?: string;
  biografia?: string;
  imagenPerfilUrl?: string;
  imagenPortadaUrl?: string;
  colorTema?: string;
  colorTexto?: string;
  colorFondo?: string;
  familiaFuente?: string;
  mostrarMenu?: boolean;
  mostrarEnlaces?: boolean;
  mostrarContacto?: boolean;
  habilitarPedidos?: boolean;
  direccion?: string;
  ciudad?: string;
  estadoProvincia?: string;
  pais?: string;
  codigoPostal?: string;
  latitud?: number;
  longitud?: number;
  zonaHoraria?: string;
  moneda?: string;
  idioma?: string;
  activo?: boolean;
  estadoSuscripcion?: string;
}

export interface QueryRestauranteDto {
  page?: number;
  limit?: number;
  nombre?: string;
  slug?: string;
  activo?: boolean;
  estadoSuscripcion?: string;
  ciudad?: string;
  pais?: string;
}

// Tipos de enlaces
export interface EnlaceRestaurante {
  id: string;
  restauranteId: string;
  titulo: string;
  url: string;
  iconoUrl: string | null;
  tipoIcono: string | null;
  ordenVisualizacion: number;
  activo: boolean;
  contadorClics: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CrearEnlaceDto {
  restauranteId: string;
  titulo: string;
  url: string;
  iconoUrl?: string;
  tipoIcono?: string;
  ordenVisualizacion?: number;
  activo?: boolean;
}

export interface ActualizarEnlaceDto {
  titulo?: string;
  url?: string;
  iconoUrl?: string;
  tipoIcono?: string;
  ordenVisualizacion?: number;
  activo?: boolean;
}

export interface QueryEnlaceDto {
  page?: number;
  limit?: number;
  restauranteId?: string;
  titulo?: string;
  tipoIcono?: string;
  activo?: boolean;
  orden?: 'asc' | 'desc';
}

// Tipos de categorías
export interface Categoria {
  id: string;
  restauranteId: string;
  nombre: string;
  descripcion: string | null;
  imagenUrl: string | null;
  ordenVisualizacion: number;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CrearCategoriaDto {
  restauranteId: string;
  nombre: string;
  descripcion?: string;
  imagenUrl?: string;
  ordenVisualizacion?: number;
  activa?: boolean;
}

export interface ActualizarCategoriaDto {
  nombre?: string;
  descripcion?: string;
  imagenUrl?: string;
  ordenVisualizacion?: number;
  activa?: boolean;
}

export interface QueryCategoriaDto {
  page?: number;
  limit?: number;
  restauranteId?: string;
  nombre?: string;
  activa?: boolean;
  orden?: 'asc' | 'desc';
}

// Tipos de mesas
export interface Mesa {
  id: string;
  restauranteId: string;
  numero: string;
  nombre: string | null;
  codigoQr: string | null;
  imagenQrUrl: string | null;
  capacidad: number;
  activa: boolean;
  ocupada: boolean;
  seccion: string | null;
  piso: number;
  meseroAsignadoId: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface MesaConMesero extends Mesa {
  meseroNombre?: string | null;
  meseroEmail?: string | null;
}

export interface CrearMesaDto {
  restauranteId: string;
  numero: string;
  nombre?: string;
  codigoQr?: string;
  imagenQrUrl?: string;
  capacidad?: number;
  seccion?: string;
  piso?: number;
  meseroAsignadoId?: string;
  activa?: boolean;
  ocupada?: boolean;
}

export interface ActualizarMesaDto {
  numero?: string;
  nombre?: string;
  codigoQr?: string;
  imagenQrUrl?: string;
  capacidad?: number;
  seccion?: string;
  piso?: number;
  meseroAsignadoId?: string | null;
  activa?: boolean;
  ocupada?: boolean;
}

export interface QueryMesaDto {
  page?: number;
  limit?: number;
  restauranteId?: string;
  numero?: string;
  seccion?: string;
  activa?: boolean;
  ocupada?: boolean;
  meseroAsignadoId?: string;
  orden?: 'asc' | 'desc';
}

// Tipos de usuarios
export interface Usuario {
  id: string;
  correo: string;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  avatarUrl: string | null;
  restauranteId: string | null;
  correoVerificado: boolean;
  activo: boolean;
  ultimoAcceso: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaEliminacion: string | null;
}

export interface UsuarioConRol extends Usuario {
  rolId?: string | null;
  rolNombre?: string | null;
  restauranteNombre?: string | null;
}

export interface CrearUsuarioDto {
  correo: string;
  password: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  avatarUrl?: string;
  restauranteId?: string | null;
  rolId?: string;
  activo?: boolean;
  correoVerificado?: boolean;
}

export interface ActualizarUsuarioDto {
  correo?: string;
  password?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string;
  avatarUrl?: string;
  restauranteId?: string | null;
  rolId?: string | null;
  activo?: boolean;
  correoVerificado?: boolean;
}

export interface QueryUsuarioDto {
  page?: number;
  limit?: number;
  restauranteId?: string;
  correo?: string;
  nombre?: string;
  rolId?: string;
  activo?: boolean;
  correoVerificado?: boolean;
  orden?: 'asc' | 'desc';
}

// Tipos de items del menú
export interface ItemMenu {
  id: string;
  restauranteId: string;
  categoriaId: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  imagenUrl: string | null;
  calorias: number | null;
  alergenos: string | null; // JSON array como string
  disponible: boolean;
  destacado: boolean;
  ordenVisualizacion: number;
  tiempoPreparacion: number | null;
  esVegetariano: boolean;
  esVegano: boolean;
  sinGluten: boolean;
  esPicante: boolean;
  nivelPicante: number;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaEliminacion: string | null;
}

export interface AdicionSimple {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
}

export interface ItemMenuConAdiciones extends ItemMenu {
  adiciones?: AdicionSimple[];
}

export interface CrearItemMenuDto {
  restauranteId: string;
  categoriaId: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagenUrl?: string;
  calorias?: number;
  alergenos?: string[];
  disponible?: boolean;
  destacado?: boolean;
  ordenVisualizacion?: number;
  tiempoPreparacion?: number;
  esVegetariano?: boolean;
  esVegano?: boolean;
  sinGluten?: boolean;
  esPicante?: boolean;
  nivelPicante?: number;
  adicionesIds?: string[];
}

export interface ActualizarItemMenuDto {
  categoriaId?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  imagenUrl?: string;
  calorias?: number;
  alergenos?: string[];
  disponible?: boolean;
  destacado?: boolean;
  ordenVisualizacion?: number;
  tiempoPreparacion?: number;
  esVegetariano?: boolean;
  esVegano?: boolean;
  sinGluten?: boolean;
  esPicante?: boolean;
  nivelPicante?: number;
  adicionesIds?: string[];
}

export interface QueryItemMenuDto {
  page?: number;
  limit?: number;
  restauranteId?: string;
  categoriaId?: string;
  nombre?: string;
  disponible?: boolean;
  destacado?: boolean;
  esVegetariano?: boolean;
  esVegano?: boolean;
  sinGluten?: boolean;
  esPicante?: boolean;
  orden?: 'asc' | 'desc';
}

// Tipos de adiciones
export interface Adicion {
  id: string;
  restauranteId: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  esObligatorio: boolean;
  maximoSelecciones: number;
  ordenVisualizacion: number;
  activa: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CrearAdicionDto {
  restauranteId: string;
  nombre: string;
  descripcion?: string;
  precio?: number;
  esObligatorio?: boolean;
  maximoSelecciones?: number;
  ordenVisualizacion?: number;
  activa?: boolean;
}

export interface ActualizarAdicionDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  esObligatorio?: boolean;
  maximoSelecciones?: number;
  ordenVisualizacion?: number;
  activa?: boolean;
}

export interface QueryAdicionDto {
  page?: number;
  limit?: number;
  restauranteId?: string;
  nombre?: string;
  activa?: boolean;
  orden?: 'asc' | 'desc';
}

// Tipos de pedidos
export type EstadoPedido = 'pendiente' | 'pendiente_confirmacion' | 'confirmado' | 'preparando' | 'listo' | 'servido' | 'completado' | 'cancelado';

export interface ItemPedido {
  id: string;
  pedidoId: string;
  itemMenuId: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  estado: string;
  notas: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface AdicionItemPedido {
  id: string;
  adicionId: string;
  adicionNombre: string;
  modificadorPrecio: number;
}

export interface ItemPedidoConDetalles extends ItemPedido {
  itemMenuNombre?: string;
  itemMenuPrecio?: number;
  itemMenuImagenUrl?: string;
  adiciones?: AdicionItemPedido[];
}

export interface Pedido {
  id: string;
  restauranteId: string;
  mesaId: string;
  nombreCliente: string | null;
  telefonoCliente: string | null;
  correoCliente: string | null;
  estado: EstadoPedido;
  montoTotal: number;
  notas: string | null;
  instruccionesEspeciales: string | null;
  meseroAsignadoId: string | null;
  fechaCreacion: string;
  fechaConfirmacion: string | null;
  fechaPreparacion: string | null;
  fechaListo: string | null;
  fechaServido: string | null;
  fechaCompletado: string | null;
}

export interface PedidoCompleto extends Pedido {
  mesaNumero?: string;
  mesaNombre?: string;
  meseroNombre?: string;
  meseroEmail?: string;
  items?: ItemPedidoConDetalles[];
}

export interface CrearItemPedidoDto {
  itemMenuId: string;
  cantidad: number;
  notas?: string;
  adicionesIds?: string[];
}

export interface CrearPedidoDto {
  restauranteId: string;
  mesaId: string;
  nombreCliente?: string;
  telefonoCliente?: string;
  correoCliente?: string;
  notas?: string;
  instruccionesEspeciales?: string;
  meseroAsignadoId?: string;
  items: CrearItemPedidoDto[];
}

export interface ActualizarPedidoDto {
  nombreCliente?: string;
  telefonoCliente?: string;
  correoCliente?: string;
  estado?: EstadoPedido;
  notas?: string;
  instruccionesEspeciales?: string;
  meseroAsignadoId?: string | null;
}

export interface QueryPedidoDto {
  page?: number;
  limit?: number;
  restauranteId?: string;
  mesaId?: string;
  meseroAsignadoId?: string;
  estado?: EstadoPedido;
  nombreCliente?: string;
  orden?: 'asc' | 'desc';
}

export interface HistorialEstadoPedido {
  id: string;
  pedidoId: string;
  itemPedidoId: string | null;
  estadoAnterior: string | null;
  estadoNuevo: string;
  cambiadoPorId: string | null;
  usuarioNombre: string | null;
  usuarioEmail: string | null;
  rolNombre: string | null;
  itemMenuNombre: string | null;
  notas: string | null;
  fechaCreacion: string;
}

// Tipos de suscripción
export type PlanType = 'free' | 'pro' | 'premium';

export interface Suscripcion {
  id: string;
  restauranteId: string;
  tipoPlan: PlanType;
  estado: string; // 'active' | 'cancelled' | 'past_due' | 'trialing'
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  inicioPeriodoActual: string | null;
  finPeriodoActual: string | null;
  cancelarAlFinPeriodo: boolean;
  fechaCancelacion: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface CrearSuscripcionDto {
  restauranteId: string;
  tipoPlan: PlanType;
  isAnnual?: boolean;
  paymentProvider?: 'stripe' | 'wompi';
  paymentMethodId?: string;
}

export interface ActualizarSuscripcionDto {
  tipoPlan?: PlanType;
  estado?: string;
  cancelarAlFinPeriodo?: boolean;
  paymentMethodId?: string;
}

export interface LimitesPlan {
  items: number | null; // null = ilimitado
  mesas: number | null;
  usuarios: number | null;
  websockets: boolean;
  analytics: boolean;
  enlacesSociales: boolean;
  rolesAdicionales: boolean;
  marcaAgua: boolean;
}

// Tipos de comentarios
export type TipoComentario = 'comentario' | 'queja' | 'solicitud' | 'sugerencia' | 'pregunta';
export type EstadoComentario = 'pendiente' | 'en_proceso' | 'resuelto' | 'cerrado';
export type PrioridadComentario = 'baja' | 'normal' | 'alta' | 'urgente';

export interface Comentario {
  id: string;
  restauranteId: string | null;
  usuarioId: string | null;
  tipo: TipoComentario;
  asunto: string;
  mensaje: string;
  estado: EstadoComentario;
  respuesta: string | null;
  usuarioRespuestaId: string | null;
  prioridad: PrioridadComentario;
  fechaCreacion: string;
  fechaActualizacion: string;
  fechaRespuesta: string | null;
  fechaEliminacion: string | null;
  nombreUsuario?: string;
  correoUsuario?: string;
  nombreRestaurante?: string;
  nombreUsuarioRespuesta?: string;
}

// Alias para compatibilidad
export type ComentarioConUsuario = Comentario;

export interface CrearComentarioDto {
  restauranteId?: string;
  usuarioId?: string;
  tipo: TipoComentario;
  asunto: string;
  mensaje: string;
  prioridad?: PrioridadComentario;
}

export interface ActualizarComentarioDto {
  tipo?: TipoComentario;
  asunto?: string;
  mensaje?: string;
  estado?: EstadoComentario;
  respuesta?: string;
  prioridad?: PrioridadComentario;
}

export interface QueryComentarioDto {
  page?: number;
  limit?: number;
  restauranteId?: string;
  usuarioId?: string;
  tipo?: TipoComentario;
  estado?: EstadoComentario;
  prioridad?: PrioridadComentario;
  asunto?: string;
  orden?: 'asc' | 'desc';
}

