import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@game': path.resolve(__dirname, './src/game'),
      '@assets': path.resolve(__dirname, './assets'),
      '@data': path.resolve(__dirname, './data')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
})