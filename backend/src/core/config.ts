import dotenv from 'dotenv';

dotenv.config();

interface Config {
    env: string;
    port: number;
    mongodb: {
        uri: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    websocket: {
        pingInterval: number;
    };
}

const config: Config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/poultry_factory',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    websocket: {
        pingInterval: parseInt(process.env.WS_PING_INTERVAL || '30000', 10),
    },
};

// Validate critical configuration in production
if (config.env === 'production') {
    if (config.jwt.secret === 'default-secret-change-in-production') {
        throw new Error('JWT_SECRET must be set in production environment');
    }

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI must be set in production environment');
    }
}

export default config;
