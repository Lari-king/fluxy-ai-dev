import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // L'alias unique et propre : @ pointera vers src/
      // Cela permet d'écrire import { ... } from '@/components/...'
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  // Optimisation pour éviter les flashs d'écran blanc lors du scan des dépendances
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})