import { FastifyInstance } from 'fastify';
import { socketManager } from './socket';

/**
 * Setup WebSocket routes
 */
export async function setupWebSocket(fastify: FastifyInstance) {
    fastify.get('/ws', { websocket: true }, (connection, request) => {
        console.log('📡 New WebSocket connection attempt');

        // Extract token from query parameter
        const token = (request.query as any).token;

        if (!token) {
            connection.socket.send(JSON.stringify({
                error: 'Authentication required. Provide token in query parameter.'
            }));
            connection.socket.close();
            return;
        }

        // Authenticate connection
        socketManager.authenticate(connection, token).then((authenticatedSocket) => {
            if (!authenticatedSocket) {
                connection.socket.send(JSON.stringify({
                    error: 'Invalid or expired token'
                }));
                connection.socket.close();
                return;
            }

            const userId = authenticatedSocket.userId;

            // Send welcome message
            connection.socket.send(JSON.stringify({
                event: 'connected',
                data: {
                    userId,
                    message: 'WebSocket connection established',
                },
            }));

            // Auto-subscribe to relevant channels based on permissions
            const { permissions } = authenticatedSocket;

            if (permissions.includes('SYSTEM_ALL' as any)) {
                socketManager.subscribe(userId, 'system:*');
            }

            // Subscribe to basic channels based on permissions
            if (permissions.some(p => ['USER_VIEW', 'USER_CREATE', 'USER_UPDATE'].includes(p))) {
                socketManager.subscribe(userId, 'users');
            }

            if (permissions.some(p => ['ROLE_VIEW', 'ROLE_CREATE', 'ROLE_UPDATE'].includes(p))) {
                socketManager.subscribe(userId, 'roles');
            }

            // Handle incoming messages
            connection.socket.on('message', (message: Buffer) => {
                try {
                    const data = JSON.parse(message.toString());

                    // Handle subscribe requests
                    if (data.action === 'subscribe' && data.channel) {
                        const success = socketManager.subscribe(userId, data.channel);
                        connection.socket.send(JSON.stringify({
                            event: 'subscription',
                            data: {
                                channel: data.channel,
                                subscribed: success,
                            },
                        }));
                    }

                    // Handle unsubscribe requests
                    if (data.action === 'unsubscribe' && data.channel) {
                        const success = socketManager.unsubscribe(userId, data.channel);
                        connection.socket.send(JSON.stringify({
                            event: 'subscription',
                            data: {
                                channel: data.channel,
                                subscribed: !success,
                            },
                        }));
                    }

                } catch (error) {
                    console.error('Error handling WebSocket message:', error);
                }
            });

            // Handle disconnection
            connection.socket.on('close', () => {
                socketManager.disconnect(userId);
            });

        }).catch((error) => {
            console.error('WebSocket authentication error:', error);
            connection.socket.close();
        });
    });

    console.log('✅ WebSocket routes configured');
}
