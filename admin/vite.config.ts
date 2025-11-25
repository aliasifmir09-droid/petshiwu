import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - split large dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'charts-vendor': ['recharts'], // Large charting library
          'ui-vendor': ['lucide-react'], // Icon library
          // Feature chunks - split by feature/page
          'analytics': ['./src/pages/Analytics'],
          'products': ['./src/pages/Products', './src/components/ProductForm'],
          'orders': ['./src/pages/Orders'],
        }
      }
    }
  }
});



