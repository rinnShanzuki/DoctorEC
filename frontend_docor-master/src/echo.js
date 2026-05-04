import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Suppress Pusher's verbose logging in development to avoid console spam
// when the WebSocket server (Reverb) isn't running.
Pusher.logToConsole = false;

// Make Pusher available globally (required by Echo)
window.Pusher = Pusher;

/**
 * Laravel Echo configuration for Reverb WebSocket server.
 * Connects to the local Reverb instance using the Pusher protocol.
 */
let echo;
try {
    echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY || 'dec-app-key',
        wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
        wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
    });

    // Log connection state changes once instead of spamming errors
    echo.connector.pusher.connection.bind('state_change', ({ current }) => {
        if (current === 'unavailable' || current === 'failed') {
            console.warn('[Echo] WebSocket server unavailable – real-time features disabled. Start Reverb to enable.');
        }
    });
} catch (err) {
    console.warn('[Echo] Failed to initialize:', err.message);
    echo = null;
}

export default echo;
