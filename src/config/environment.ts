import * as dotenv from 'dotenv';

dotenv.config();

export const environment = {
    bot: {
        token: process.env.BOT_TOKEN || '',
        username: process.env.BOT_USERNAME || '',
    },

    api: {
        baseUrl: process.env.API_BASE_URL || 'https://income-api.copperx.io',
        timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    },

    session: {
        driver: process.env.SESSION_DRIVER || 'memory',
        ttl: parseInt(process.env.SESSION_TTL || '604800', 10), // 7days
    },

    security: {
        appKey: process.env.APP_KEY || '',
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

    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
};