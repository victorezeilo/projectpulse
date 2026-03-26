import dotenv from 'dotenv';
import part from 'path';

dotenv.config({ path: part.resolve(__dirname, '../../.env') });

export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

    jwt: {
        secret: process.env.JWT_SECRET || 'dev-secret-change-me',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'

    },

    db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/projectpulse?schema=public',
    },

    isDev: process.env.NODE_ENV !== 'production',
    isProd: process.env.NODE_ENV === 'production',
} as const;