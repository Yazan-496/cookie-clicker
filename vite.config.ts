import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // @solana/web3.js expects a Node-style global
    global: 'globalThis',
  },
})
