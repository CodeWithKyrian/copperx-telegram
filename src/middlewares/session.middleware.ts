import { Markup, Middleware, session, SessionStore } from 'telegraf';
import { Redis } from '@telegraf/session/redis';
import { Mongo } from '@telegraf/session/mongodb';
import { Postgres } from '@telegraf/session/pg';
import { SQLite } from "@telegraf/session/sqlite";
import { GlobalContext, GlobalSession } from '../types/session.types';
import { config } from '../config';
import logger from '../utils/logger.utils';


/**
 * Creates and returns the appropriate session store based on environment configuration
 */
export function createSessionStore(): SessionStore<GlobalSession> {
    const driver = config.session.driver;

    logger.info(`Initializing session store with driver: ${driver}`);

    switch (driver) {
        case 'redis':
            return Redis({
                url: config.redis.url,
            });

        case 'mongo':
            return Mongo({
                url: config.mongo.uri,
                database: config.mongo.database,
            });

        case 'sqlite':
            return SQLite({
                filename: config.sqlite.filename,
                config: { fileMustExist: false }
            });

        case 'postgres':
            return Postgres({
                host: config.postgres.host,
                port: config.postgres.port,
                database: config.postgres.database,
                user: config.postgres.user,
                password: config.postgres.password,
            });

        case 'memory':
        default:
            return new Map();
    }
}

/**
 * Gets the session key for a context
 */
export function getSessionKey(ctx: GlobalContext): string | undefined {
    if (ctx.from?.id) {
        return `user:${ctx.from.id}`;
    }
    return ctx.chat?.id ? `chat:${ctx.chat.id}` : undefined;
}

/**
 * Creates a default empty session with timestamps
 */
function createDefaultSession(): GlobalSession {
    const now = Date.now();
    return {
        createdAt: now,
        updatedAt: now
    };
}

/**
 * Checks if a session has expired and handles the expiration if needed
 * 
 * @param ctx The Telegraf context
 * @param store The session store
 * @param key The session key
 * @param ttl The TTL in milliseconds
 * @returns True if the session was expired and handled, false otherwise
 */
async function checkAndHandleExpiredSession(
    ctx: GlobalContext,
    store: SessionStore<GlobalSession>,
    key: string,
    ttl: number
): Promise<boolean> {
    try {
        const session = await store.get(key) as GlobalSession | undefined;

        // Only check sessions with auth tokens
        if (!session?.updatedAt || !session?.auth?.accessToken) {
            return false;
        }

        const now = Date.now();
        const lastActivity = session.updatedAt;
        const idleTime = now - lastActivity;

        // Check if session has expired based on TTL
        if (idleTime <= ttl) {
            return false;
        }

        // Session has expired - log the expiration
        logger.info({
            userId: session.auth?.userId || 'unknown',
            email: session.auth?.email || 'unknown',
            lastActivity: new Date(lastActivity).toISOString(),
            idleTime: Math.round(idleTime / 1000) + ' seconds'
        }, `Session expired for ${key}`);

        // Clear the session
        await store.delete(key);

        // Inform the user about session expiry
        await ctx.reply(
            'Your session has expired due to inactivity. Please login again.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('🔑 Login to CopperX', 'login')
                ])
            }
        );

        return true;
    } catch (error) {
        logger.error({
            error: error instanceof Error ? error.message : String(error),
            key
        }, 'Error checking session expiration');
        return false;
    }
}

/**
 * Creates a middleware that:
 * 1. Checks for session expiration
 * 2. Initializes the session
 * 3. Updates the session timestamp on each request
 */
export function sessionMiddleware(): Middleware<GlobalContext> {
    const store = createSessionStore();
    const ttl = config.session.ttl * 1000; // Convert TTL from seconds to milliseconds

    logger.info(`Session TTL configured for ${config.session.ttl} seconds`);

    // Create the initial session middleware that will handle session initialization
    const initSessionMiddleware = session({
        store,
        defaultSession: createDefaultSession,
        getSessionKey
    });

    // Return our enhanced middleware that adds expiration and timestamp update
    return async (ctx, next) => {
        // Check for session expiration before processing
        const key = getSessionKey(ctx);
        if (key) {
            await checkAndHandleExpiredSession(ctx, store, key, ttl);
        }

        // Proceed with normal session processing
        await initSessionMiddleware(ctx, async () => {
            // Update the timestamp on every request
            ctx.session.updatedAt = Date.now();
            await next();
        });
    };
}