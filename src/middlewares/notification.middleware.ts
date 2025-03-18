import { Middleware } from 'telegraf';
import { GlobalContext } from '../types/session.types';
import { notificationService } from '../services/notification.service';
import logger from '../utils/logger.utils';

/**
 * Middleware that handles notification subscriptions
 */
export function notificationMiddleware(): Middleware<GlobalContext> {
    return async (ctx, next) => {
        try {
            // Only process for authenticated users
            if (ctx.session?.auth?.accessToken && ctx.session?.auth?.organizationId) {
                // Check if we have a user ID to send notifications to
                if (ctx.from?.id) {
                    // Subscribe to deposit notifications if not already subscribed
                    notificationService.subscribeToDeposits(ctx.from.id, ctx.session.auth.organizationId);
                }
            }
        } catch (error) {
            logger.error('Error in notification middleware', { error });
        }

        return next();
    };
}