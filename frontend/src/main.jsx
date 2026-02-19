import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Unregister ALL service workers to prevent caching/reload issues
// This runs in all environments (dev + production) to clean up stale PWA workers
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
            registration.unregister();
            console.log('[SW] Unregistered service worker:', registration.scope);
        }
    });
    // Also clear all caches left by old service workers
    if ('caches' in window) {
        caches.keys().then((names) => {
            for (const name of names) {
                caches.delete(name);
                console.log('[SW] Deleted cache:', name);
            }
        });
    }
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
