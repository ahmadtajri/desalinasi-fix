import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VitePWA disabled sementara untuk fix service worker reload loop
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        // VitePWA disabled - akan diaktifkan kembali setelah deployment stabil
    ],
    resolve: {
        // Ensure only one instance of React is used
        dedupe: ['react', 'react-dom']
    },
    server: {
        host: true,
        port: 5173,
    },
})
