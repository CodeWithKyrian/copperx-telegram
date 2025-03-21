import { Context, Middleware } from 'telegraf';
import logger from '../utils/logger.utils';

/**
 * Middleware for logging bot interactions
 */
export const loggerMiddleware = (): Middleware<Context> => {
    return async (ctx, next) => {
        const userId = ctx.from?.id;
        const username = ctx.from?.username;
        const updateType = ctx.updateType;

        // Extract message text if available
        let messageText: string | undefined;
        if (ctx.message && 'text' in ctx.message) {
            messageText = ctx.message.text;
        }

        // Log the incoming request
        logger.info({
            userId,
            username,
            messageText,
            updateType,
        }, `Received ${updateType}`);

        await next();
    };
};