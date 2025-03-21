import { GlobalContext } from '../types/session.types';
import { notificationService } from '../services/notification.service';
import logger from '../utils/logger.utils';

/**
 * Command to test notifications
 */
export const testNotificationCommand = async (ctx: GlobalContext): Promise<void> => {
    if (!ctx.session?.auth?.accessToken) {
        await ctx.reply(
            '❌ *Authentication Required*\n\n' +
            'You need to be logged in to test notifications.',
            { parse_mode: 'Markdown' }
        );
        return;
    }

    await ctx.reply('🔔 Testing notification system...');

    try {
        const success = await notificationService.testNotification(ctx);

        if (success) {
            // Re-subscribe to ensure we're connected
            const subscribed = notificationService.subscribeToDeposits(ctx.from!.id, ctx.session!.auth!.organizationId!);

            if (subscribed) {
                await ctx.reply(
                    '✅ *Notification Test Successful*\n\n' +
                    'You are successfully connected to the real-time notification system.\n\n' +
                    'You will receive notifications when deposits are made to your wallet.',
                    { parse_mode: 'Markdown' }
                );
            } else {
                await ctx.reply(
                    '⚠️ *Notification Connection Error*\n\n' +
                    'We could send a test notification, but couldn\'t establish a real-time connection.\n\n' +
                    'Please try again later or contact support if the problem persists.',
                    { parse_mode: 'Markdown' }
                );
            }
        } else {
            await ctx.reply(
                '❌ *Notification Test Failed*\n\n' +
                'We encountered an error while testing the notification system.\n\n' +
                'Please try again later or contact support if the problem persists.',
                { parse_mode: 'Markdown' }
            );
        }
    } catch (error) {
        logger.error({ error, userId: ctx.from?.id }, 'Error testing notifications');

        await ctx.reply(
            '❌ *Error Testing Notifications*\n\n' +
            'We encountered an unexpected error while testing the notification system.\n\n' +
            'Please try again later or contact support if the problem persists.',
            { parse_mode: 'Markdown' }
        );
    }
};