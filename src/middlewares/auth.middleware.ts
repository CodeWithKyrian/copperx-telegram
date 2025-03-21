import { Middleware } from 'telegraf';
import { authService } from '../services/auth.service';
import logger from '../utils/logger.utils';
import { GlobalContext } from '../types';
import { isProtectedAction, isProtectedCommand } from '../config/protected-routes';


/**
 * Creates a middleware that checks authentication for protected commands
 */
export const authMiddleware = (): Middleware<GlobalContext> => {
    return async (ctx, next) => {
        if (ctx.message && 'text' in ctx.message && ctx.message.text.startsWith('/')) {
            // Extract command name without the slash
            const commandWithArgs = ctx.message.text.substring(1); // Remove leading slash
            const commandParts = commandWithArgs.split(' ');
            const commandWithBot = commandParts[0];
            const command = commandWithBot.split('@')[0];

            // Check if this command requires authentication
            if (isProtectedCommand(command)) {
                if (!authService.isAuthenticated(ctx)) {
                    logger.info({ command, userId: ctx.from?.id, username: ctx.from?.username }, 'Unauthenticated access attempt to protected command');

                    await ctx.reply(
                        '🔒 *Authentication Required*\n\n' +
                        'You need to be logged in to use this feature.\n\n' +
                        'Please use /login to authenticate with your CopperX account.',
                        { parse_mode: 'Markdown' }
                    );
                    return; // Stop middleware chain
                }

                logger.debug({ command }, 'Authenticated access to protected command');
            }
        }

        // Handle callback queries (button clicks)
        if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
            const action = ctx.callbackQuery.data;

            // Check if this action requires authentication
            if (isProtectedAction(action)) {
                if (!authService.isAuthenticated(ctx)) {
                    logger.info({ action, userId: ctx.from?.id, username: ctx.from?.username }, 'Unauthenticated access attempt to protected action');

                    // Answer the callback query to stop the loading indicator
                    await ctx.answerCbQuery('Authentication required. Please log in first.');

                    // Send a message about authentication requirement
                    await ctx.reply(
                        '🔒 *Authentication Required*\n\n' +
                        'You need to be logged in to use this feature.\n\n' +
                        'Please use /login to authenticate with your CopperX account.',
                        { parse_mode: 'Markdown' }
                    );
                    return; // Stop middleware chain
                }

                logger.debug({ action }, 'Authenticated access to protected action');
            }
        }

        await next();
    };
};