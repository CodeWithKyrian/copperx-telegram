import { Middleware } from 'telegraf';
import { authService } from '../services/auth.service';
import logger from '../utils/logger';
import { GlobalContext } from '../types';

/**
 * Middleware to check if user is authenticated
 */
export const authMiddleware = (): Middleware<GlobalContext> => {
    return async (ctx, next) => {
        if (!authService.isAuthenticated(ctx)) {
            logger.info('Unauthenticated access attempt', {
                userId: ctx.from?.id,
                username: ctx.from?.username,
            });

            await ctx.reply(
                '🔒 You need to be logged in to use this feature.\n\n' +
                'Please use /login to authenticate with your CopperX account.'
            );
            return;
        }

        await next();
    };
};