import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'src': path.resolve(__dirname, './src'),
      // Ajoute ces lignes vitales :
      'components': path.resolve(__dirname, './components'),
      'contexts': path.resolve(__dirname, './contexts'),
      'types': path.resolve(__dirname, './types'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
})