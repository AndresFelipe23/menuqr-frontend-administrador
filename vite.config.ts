import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Desactivar crossorigin en los assets
    cssCodeSplit: true,
  },
  base: '/',
  // Desactivar crossorigin
  server: {
    cors: false,
  },
})
