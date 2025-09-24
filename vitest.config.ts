import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom'
  },
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@game': path.resolve(__dirname, './src/game'),
      '@assets': path.resolve(__dirname, './assets'),
      '@data': path.resolve(__dirname, './data')
    }
  }
})