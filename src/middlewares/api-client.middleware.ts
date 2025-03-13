import { Middleware } from 'telegraf';
import { GlobalContext } from '../types';
import { authService } from '../services/auth.service';

/**
 * Middleware to set up API client with the current user's token
 */
export const apiClientMiddleware = (): Middleware<GlobalContext> => {
    return async (ctx, next) => {
        // Set up API client with user's token if authenticated
        if (authService.isAuthenticated(ctx)) {
            const token = authService.getDecryptedToken(ctx);
            if (token) {
                authService.setupApiClientForRequest(ctx);
            }
        }

        await next();
    };
}; 