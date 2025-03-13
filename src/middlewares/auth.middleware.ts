import { Middleware } from 'telegraf';
import { authService } from '../services/auth.service';
import logger from '../utils/logger';
import { GlobalContext } from '../types';
import { isProtectedCommand } from '../commands';


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
                    logger.info('Unauthenticated access attempt to protected command', {
                        command,
                        userId: ctx.from?.id,
                        username: ctx.from?.username,
                    });

                    await ctx.reply(
                        '🔒 *Authentication Required*\n\n' +
                        'You need to be logged in to use this feature.\n\n' +
                        'Please use /login to authenticate with your CopperX account.',
                        { parse_mode: 'Markdown' }
                    );
                    return; // Stop middleware chain
                }

                logger.debug('Authenticated access to protected command', { command });
            }
        }

        await next();
    };
};