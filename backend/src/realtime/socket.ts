import { AuthService } from '../modules/auth/auth.service';
import { Permission } from '../modules/permissions/permission.enum';

export interface AuthenticatedSocket {
    socket: any; // WebSocket connection from @fastify/websocket
    userId: string;
    roleId: string;
    permissions: Permission[];
    channels: Set<string>;
}

/**
 * WebSocket Connection Manager
 * Manages authenticated WebSocket connections and channel subscriptions
 */
export class SocketManager {
    private connections: Map<string, AuthenticatedSocket> = new Map();

    /**
     * Authenticate WebSocket connection using JWT token
     */
    async authenticate(connection: any, token: string): Promise<AuthenticatedSocket | null> {
        try {
            // Verify JWT token
            const payload = AuthService.verifyToken(token);

            // Create authenticated socket
            const authenticatedSocket: AuthenticatedSocket = {
                socket: connection,
                userId: payload.userId,
                roleId: payload.roleId,
                permissions: payload.permissions,
                channels: new Set(),
            };

            // Store connection
            this.connections.set(payload.userId, authenticatedSocket);

            console.log(`✅ WebSocket authenticated: User ${payload.userId}`);

            return authenticatedSocket;

        } catch (error) {
            console.error('WebSocket authentication failed:', error);
            return null;
        }
    }

    /**
     * Subscribe user to a channel based on permissions
     */
    subscribe(userId: string, channel: string): boolean {
        const connection = this.connections.get(userId);

        if (!connection) {
            return false;
        }

        // Check if user has permission to subscribe to this channel
        if (!this.canAccessChannel(connection.permissions, channel)) {
            console.warn(`⚠️  User ${userId} denied access to channel: ${channel}`);
            return false;
        }

        connection.channels.add(channel);
        console.log(`📡 User ${userId} subscribed to channel: ${channel}`);

        return true;
    }

    /**
     * Unsubscribe user from a channel
     */
    unsubscribe(userId: string, channel: string): boolean {
        const connection = this.connections.get(userId);

        if (!connection) {
            return false;
        }

        connection.channels.delete(channel);
        console.log(`📴 User ${userId} unsubscribed from channel: ${channel}`);

        return true;
    }

    /**
     * Remove connection
     */
    disconnect(userId: string): void {
        const connection = this.connections.get(userId);

        if (connection) {
            connection.channels.clear();
            this.connections.delete(userId);
            console.log(`👋 WebSocket disconnected: User ${userId}`);
        }
    }

    /**
     * Broadcast event to a specific channel
     */
    broadcastToChannel(channel: string, event: string, data: any): void {
        const message = JSON.stringify({ event, data });
        let sentCount = 0;

        this.connections.forEach((connection) => {
            if (connection.channels.has(channel)) {
                try {
                    connection.socket.socket.send(message);
                    sentCount++;
                } catch (error) {
                    console.error(`Error sending to user ${connection.userId}:`, error);
                }
            }
        });

        console.log(`📢 Broadcast "${event}" to channel "${channel}": ${sentCount} recipients`);
    }

    /**
     * Send event to a specific user
     */
    sendToUser(userId: string, event: string, data: any): boolean {
        const connection = this.connections.get(userId);

        if (!connection) {
            return false;
        }

        try {
            const message = JSON.stringify({ event, data });
            connection.socket.socket.send(message);
            console.log(`📨 Sent "${event}" to user ${userId}`);
            return true;
        } catch (error) {
            console.error(`Error sending to user ${userId}:`, error);
            return false;
        }
    }

    /**
     * Check if user has permission to access a channel
     */
    private canAccessChannel(permissions: Permission[], channel: string): boolean {
        // SYSTEM_ALL has access to everything
        if (permissions.includes(Permission.SYSTEM_ALL)) {
            return true;
        }

        // Channel-specific permission checks
        if (channel === 'system:*') {
            return permissions.includes(Permission.SYSTEM_ALL);
        }

        if (channel.startsWith('system:section:')) {
            // Manager level access for specific section monitoring
            // Assuming Manager role has DISEASE_READ or MEDICATION_READ, or similar.
            // Using generic SECTION_VIEW as specific permissions might be granular.
            return permissions.includes(Permission.SECTION_VIEW);
        }

        if (channel === 'roles') {
            return permissions.includes(Permission.ROLE_VIEW) ||
                permissions.includes(Permission.ROLE_CREATE) ||
                permissions.includes(Permission.ROLE_UPDATE);
        }

        if (channel === 'users') {
            return permissions.includes(Permission.USER_VIEW) ||
                permissions.includes(Permission.USER_CREATE) ||
                permissions.includes(Permission.USER_UPDATE);
        }

        if (channel.startsWith('section:')) {
            return permissions.includes(Permission.SECTION_VIEW);
        }

        if (channel === 'warehouse') {
            return permissions.includes(Permission.WAREHOUSE_VIEW);
        }

        if (channel === 'attendance') {
            return permissions.includes(Permission.ATTENDANCE_READ);
        }

        if (channel === 'system:inventory:*') {
            return permissions.includes(Permission.INVENTORY_READ);
        }

        if (channel.startsWith('inventory:')) {
            return permissions.includes(Permission.INVENTORY_READ);
        }

        if (channel === 'reports') {
            return permissions.includes(Permission.REPORT_VIEW);
        }

        // Default: deny access
        return false;
    }

    /**
     * Get connection count
     */
    getConnectionCount(): number {
        return this.connections.size;
    }

    /**
     * Get all connected user IDs
     */
    getConnectedUsers(): string[] {
        return Array.from(this.connections.keys());
    }
}

// Global socket manager instance
export const socketManager = new SocketManager();
