import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The trailing slash forces Vite to resolve the npm "buffer" package
      // instead of externalizing it as a Node builtin.
      buffer: 'buffer/',
    },
  },
  optimizeDeps: {
    include: ['buffer', '@solana/web3.js'],
  },
  define: {
    // @solana/web3.js expects Node-style globals that browsers don't provide
    global: 'globalThis',
    'process.env': '{}',
  },
})
