import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  // For GitHub Pages deployment (uncomment if needed)
  // base: '/shift-management/',
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})

