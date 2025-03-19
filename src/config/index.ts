import * as dotenv from 'dotenv';
import { ensureLeadingSlash } from '../utils/formatters.utils';

dotenv.config();

export const config = {
    env: {
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production',
        isTest: process.env.NODE_ENV === 'test',
    },

    nodeEnv: process.env.NODE_ENV || 'development',

    bot: {
        token: process.env.BOT_TOKEN || '',
        username: process.env.BOT_USERNAME || '',
    },

    api: {
        baseUrl: process.env.API_BASE_URL || 'https://income-api.copperx.io',
        timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    },

    app: {
        port: parseInt(process.env.APP_PORT || process.env.PORT || '3000', 10),
        host: process.env.APP_HOST || '0.0.0.0',
        domain: process.env.APP_DOMAIN || process.env.VERCEL_URL || '',
        key: process.env.APP_KEY || '',
    },

    webhook: {
        secretPath: ensureLeadingSlash(process.env.WEBHOOK_SECRET_PATH),
        secretToken: process.env.WEBHOOK_SECRET_TOKEN || undefined,
    },

    session: {
        driver: process.env.SESSION_DRIVER || 'memory',
        ttl: parseInt(process.env.SESSION_TTL || '604800', 10), // 7days
    },

    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        password: process.env.REDIS_PASSWORD || '',
    },

    mongo: {
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
        database: process.env.MONGO_DB || 'copperx_bot',
        collection: process.env.MONGO_COLLECTION || 'sessions',
    },

    sqlite: {
        filename: process.env.SQLITE_FILENAME || '.sessions.db',
    },

    postgres: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        database: process.env.POSTGRES_DB || 'copperx_bot',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
    },

    pusher: {
        key: process.env.PUSHER_KEY || '',
        cluster: process.env.PUSHER_CLUSTER || '',
        useTLS: process.env.PUSHER_USE_TLS === 'true',
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },

    vercel: {
        url: process.env.VERCEL_URL || '',
        deployed: !!process.env.VERCEL || false
    },
};