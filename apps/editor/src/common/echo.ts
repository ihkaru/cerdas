
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Define global Pusher for Echo
(window as any).Pusher = Pusher;

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;

let echo: any;

if (!reverbKey) {
    console.warn('[Echo] Reverb App Key is missing. Real-time features will be disabled.');
    // Provide a minimal dummy object to prevent crashes in components
    echo = {
        channel: () => ({ listen: () => ({}), listenForWhisper: () => ({}), whisper: () => ({}) }),
        private: () => ({ listen: () => ({}), notification: () => ({}), listenForWhisper: () => ({}), whisper: () => ({}) }),
        presence: () => ({ listen: () => ({}), here: () => ({}), joining: () => ({}), leaving: () => ({}), listenForWhisper: () => ({}), whisper: () => ({}) }),
        leave: () => ({}),
        leaveChannel: () => ({}),
        socketId: () => null
    };
} else {
    echo = new Echo({
        broadcaster: 'reverb',
        key: reverbKey,
        wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
        wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
        wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        encrypted: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
        disableStats: true,
        cluster: 'mt1',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '')}/api/broadcasting/auth`,
        auth: {
            headers: {
                Accept: 'application/json',
            }
        },
        authorizer: (channel: any, _options: any) => {
            return {
                authorize: (socketId: any, callback: any) => {
                    const token = localStorage.getItem('auth_token');
                    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
                    fetch(`${baseUrl}/api/broadcasting/auth`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify({
                            socket_id: socketId,
                            channel_name: channel.name
                        })
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Auth failed with status ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        callback(false, data);
                    })
                    .catch(error => {
                        callback(true, error);
                    });
                }
            };
        }
    });
}

export default echo;
