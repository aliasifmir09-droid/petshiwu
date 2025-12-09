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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  },
  server: {
    port: 5173,
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
          'ui-vendor': ['lucide-react'], // Icon library
          'state-vendor': ['zustand'], // State management
          // Payment vendor chunk - lazy loaded, separate for better caching
          'payment-vendor': [
            '@stripe/react-stripe-js',
            '@stripe/stripe-js',
            '@paypal/react-paypal-js'
          ],
          // Feature chunks - split by feature/page
          'checkout': ['./src/pages/Checkout', './src/pages/Cart'],
          'product': ['./src/pages/ProductDetail', './src/pages/Products'],
          'order': ['./src/pages/MyOrders', './src/pages/OrderDetail', './src/pages/TrackOrder'],
        }
      }
    }
  }
});



