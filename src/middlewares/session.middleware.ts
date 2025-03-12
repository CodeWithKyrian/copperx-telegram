import { Context, Middleware, session, SessionStore } from 'telegraf';
import { Redis } from '@telegraf/session/redis';
import { Mongo } from '@telegraf/session/mongodb';
import { Postgres } from '@telegraf/session/pg';
import { SessionData } from '../types/session.types';
import { environment } from '../config/environment';
import logger from '../utils/logger';


/**
 * Creates and returns the appropriate session store based on environment configuration
 */
export function createSessionStore(): SessionStore<SessionData> {
    const driver = environment.session.driver;

    logger.info(`Initializing session store with driver: ${driver}`);

    switch (driver) {
        case 'redis':
            return Redis({
                url: environment.redis.url,
            });

        case 'mongo':
            return Mongo({
                url: environment.mongo.uri,
                database: environment.mongo.database,
            });

        case 'postgres':
            return Postgres({
                host: environment.postgres.host,
                port: environment.postgres.port,
                database: environment.postgres.database,
                user: environment.postgres.user,
                password: environment.postgres.password,
            });

        case 'memory':
        default:
            return new Map();
    }
}

/**
 * Creates session middleware with the appropriate store
 */
export function createSessionMiddleware(): ReturnType<typeof session> {
    const store = createSessionStore();

    return session({
        store,

        defaultSession: createDefaultSession,

        getSessionKey: (ctx) => {
            if (ctx.from?.id) {
                return `user:${ctx.from.id}`;
            }
            return ctx.chat?.id ? `chat:${ctx.chat.id}` : undefined;
        }
    });
}

export function updateSessionMiddleware(): Middleware<Context> {
    return async (ctx, next) => {
        const session = ctx.session;
        session.updatedAt = Date.now();
        await next();
    };
}

/**
 * Creates a default empty session with timestamps
 */
function createDefaultSession(): SessionData {
    const now = Date.now();
    return {
        createdAt: now,
        updatedAt: now
    };
}