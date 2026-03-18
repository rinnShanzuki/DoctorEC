import { useEffect } from 'react';
import echo from '../echo';

/**
 * React hook to listen for real-time broadcast events via Laravel Echo.
 * 
 * @param {string} channel - The channel name to listen on (e.g., 'products')
 * @param {string} event  - The broadcast event name (e.g., '.product.updated')
 * @param {Function} callback - Function called when event is received
 * 
 * Usage:
 *   useRealtime('products', '.product.updated', (data) => {
 *       console.log('Product changed:', data);
 *       refetchProducts(); // re-fetch the data
 *   });
 * 
 * Note: Event names must be prefixed with '.' when using broadcastAs()
 */
export default function useRealtime(channel, event, callback) {
    useEffect(() => {
        const ch = echo.channel(channel);
        ch.listen(event, callback);

        return () => {
            ch.stopListening(event);
            echo.leaveChannel(channel);
        };
    }, [channel, event]); // eslint-disable-line react-hooks/exhaustive-deps
}
