import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) {
            return 'vendor-firebase';
          }
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/mammoth')) {
            return 'vendor-mammoth';
          }
          if (id.includes('node_modules/qrcode')) {
            return 'vendor-qrcode';
          }
          if (id.includes('node_modules/lottie-web')) {
            return 'vendor-lottie';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
})
