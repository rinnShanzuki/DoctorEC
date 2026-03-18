import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Make Pusher available globally (required by Echo)
window.Pusher = Pusher;

/**
 * Laravel Echo configuration for Reverb WebSocket server.
 * Connects to the local Reverb instance using the Pusher protocol.
 */
const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'dec-app-key',
    wsHost: import.meta.env.VITE_REVERB_HOST || 'localhost',
    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
});

export default echo;
