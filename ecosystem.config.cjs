/**
 * Configuración de PM2 para el frontend administrador
 * 
 * Uso:
 *   npm run build                              # Primero hacer build
 *   pm2 start ecosystem.config.cjs             # Iniciar en modo producción
 *   pm2 start ecosystem.config.cjs --env development  # Iniciar en modo desarrollo
 *   pm2 stop menuqr-frontend-administrador     # Detener
 *   pm2 restart menuqr-frontend-administrador  # Reiniciar
 *   pm2 logs menuqr-frontend-administrador     # Ver logs
 *   pm2 monit                                  # Monitor
 *   pm2 delete menuqr-frontend-administrador   # Eliminar proceso
 * 
 * NOTA: El frontend normalmente se sirve con Nginx en producción.
 * Este archivo es útil si necesitas servirlo con Node.js (por ejemplo, para desarrollo).
 */

module.exports = {
  apps: [
    {
      name: 'menusqr-frontend-administrador',
      script: 'node_modules/.bin/vite',
      args: 'preview',
      cwd: './',
      
      // Variables de entorno
      env: {
        NODE_ENV: 'development',
        PORT: 4321, // Puerto para vite preview
        VITE_API_URL: 'http://localhost:5290/api',
      },
      
      env_production: {
        NODE_ENV: 'production',
        PORT: 4321,
        VITE_API_URL: 'https://apimenusqr.site/api',
      },
      
      // Configuración de instancias
      instances: 1,
      exec_mode: 'fork',
      
      // Auto-reinicio
      autorestart: true,
      watch: false, // En producción siempre false
      max_memory_restart: '500M', // Reiniciar si usa más de 500MB de RAM
      
      // Manejo de errores
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true, // Agregar timestamp a los logs
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Configuración de reinicio
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Señales de sistema
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      
      // Variables adicionales
      source_map_support: true,
      instance_var: 'INSTANCE_ID',
      
      // Ignorar archivos en watch mode (solo si watch: true)
      ignore_watch: [
        'node_modules',
        'logs',
        '*.log',
        '.git',
        'dist',
        'src',
      ],
    },
  ],

  // Configuración de deploy (opcional - para despliegues automatizados)
  deploy: {
    production: {
      user: 'deploy',
      host: ['qrestaurante.site'], // Dominio del frontend administrador
      ref: 'origin/main',
      repo: 'https://github.com/AndresFelipe23/menuqr-frontend-administrador.git', // Actualizar con tu repo
      path: '/cloudclusters/menuqr-frontend-administrador', // Ruta en el servidor
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': '',
    },
  },
};

