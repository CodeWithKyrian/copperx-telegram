import Pusher from 'pusher-js';
import { Markup, Telegraf } from 'telegraf';
import { GlobalContext } from '../types';
import notificationApi from '../api/notification.api';
import logger from '../utils/logger.utils';
import { formatDate } from '../utils/formatters.utils';
import { formatNetworkName, getExplorerTxUrl } from '../utils/chain.utils';
import { config } from '../config';

interface DepositEvent {
    title: string;
    message: string;
    amount: string;
    currency: string;
    metadata: {
        network: string;
        txHash: string;
    };
    organizationId: string;
    timestamp: string;
}

export class NotificationService {
    private pusher: Pusher | null = null;
    private bot: Telegraf<GlobalContext> | null = null;
    private subscriptions: Map<string, { channelName: string, userId: number }> = new Map();

    /**
     * Initialize the notification service with the Telegram bot instance
     */
    public initialize(bot: Telegraf<GlobalContext>): void {
        this.bot = bot;

        if (!config.pusher.key || !config.pusher.cluster) {
            logger.warn('Pusher keys not configured, real-time notifications disabled');
            return;
        }

        try {
            this.pusher = new Pusher(config.pusher.key, {
                cluster: config.pusher.cluster,
                authorizer: this.createAuthorizer()
            });

            logger.info('Notification service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Pusher client', { error });
            this.pusher = null;
        }
    }

    /**
     * Create a Pusher authorizer that authenticates with our API
     */
    private createAuthorizer(): (channel: { name: string }) => {
        authorize: (socketId: string, callback: (error: Error | null, authData: any) => void) => void
    } {
        return (channel) => ({
            authorize: async (socketId, callback) => {
                try {
                    const response = await notificationApi.authenticate({
                        socket_id: socketId,
                        channel_name: channel.name
                    });

                    if (response && response.auth) {
                        callback(null, response);
                    } else {
                        callback(new Error('Invalid authentication response'), null);
                    }
                } catch (error) {
                    logger.error('Pusher authorization failed', { error, channel: channel.name });
                    callback(error as Error, null);
                }
            }
        });
    }

    /**
     * Subscribe to deposit notifications for a user
     */
    public subscribeToDeposits(userId: number, organizationId: string): boolean {
        if (!this.pusher) {
            return false;
        }

        const channelName = `private-org-${organizationId}`;
        const subscriptionKey = `${userId}:${organizationId}`;

        // Check if already subscribed
        if (this.subscriptions.has(subscriptionKey)) {
            return true;
        }

        try {
            // Subscribe to the organization's private channel
            const channel = this.pusher.subscribe(channelName);

            // Success handler
            channel.bind('pusher:subscription_succeeded', () => {
                logger.info('Successfully subscribed to deposit notifications', {
                    channel: channelName,
                    userId
                });
                this.subscriptions.set(subscriptionKey, { channelName, userId });
            });

            // Error handler
            channel.bind('pusher:subscription_error', (error: any) => {
                logger.error('Failed to subscribe to deposit notifications', {
                    error,
                    channel: channelName,
                    userId
                });
                this.subscriptions.delete(subscriptionKey);
            });

            // Deposit event handler
            channel.bind('deposit', (data: DepositEvent) => {
                this.handleDepositEvent(userId, data);
            });

            return true;
        } catch (error) {
            logger.error('Error subscribing to deposit notifications', {
                error,
                channel: channelName,
                userId
            });
            return false;
        }
    }

    /**
     * Unsubscribe from deposit notifications for a user
     */
    public unsubscribeFromDeposits(userId: number, organizationId: string): boolean {
        if (!this.pusher) {
            return false;
        }

        const subscriptionKey = `${userId}:${organizationId}`;
        const subscription = this.subscriptions.get(subscriptionKey);

        if (!subscription) {
            return false;
        }

        try {
            this.pusher.unsubscribe(subscription.channelName);
            this.subscriptions.delete(subscriptionKey);
            logger.info('Unsubscribed from deposit notifications', {
                channel: subscription.channelName,
                userId
            });
            return true;
        } catch (error) {
            logger.error('Error unsubscribing from deposit notifications', {
                error,
                channel: subscription.channelName,
                userId
            });
            return false;
        }
    }

    /**
     * Handle deposit event and send notification to the user
     */
    private async handleDepositEvent(userId: number, data: DepositEvent): Promise<void> {
        if (!this.bot) {
            return;
        }

        try {
            const message = this.formatDepositNotification(data);
            const keyboard = this.createDepositKeyboard(data);

            // Send notification to the user
            await this.bot.telegram.sendMessage(userId, message, {
                parse_mode: 'Markdown',
                link_preview_options: {
                    is_disabled: true
                },
                ...keyboard
            });

            logger.info('Deposit notification sent to user', {
                userId,
                data
            });
        } catch (error) {
            logger.error('Error sending deposit notification', {
                error,
                userId,
                data
            });
        }
    }

    /**
 * Create inline keyboard for deposit notification
 */
    private createDepositKeyboard(data: DepositEvent): any {
        const buttons: any[] = [
            [
                Markup.button.callback('📜 View History', 'history'),
                Markup.button.callback('💼 Check Wallet', 'view_wallets')
            ]
        ];

        // Add explorer link if transaction hash and network are available
        if (data.metadata?.txHash && data.metadata?.network) {
            const explorerUrl = getExplorerTxUrl(data.metadata.network, data.metadata.txHash);
            if (explorerUrl) {
                buttons.push([
                    Markup.button.url('🔎 View on Explorer', explorerUrl)
                ]);
            }
        }

        return Markup.inlineKeyboard(buttons);
    }

    /**
     * Format deposit notification message
     */
    private formatDepositNotification(data: DepositEvent): string {
        // Format transaction amount
        const amount = data.amount.toString();
        const currency = data.currency || 'USDC';
        const network = data.metadata?.network || 'Unknown Network';
        const timestamp = data.timestamp ? formatDate(data.timestamp) : 'just now';
        const txHash = data.metadata?.txHash;

        // Build the notification message
        let message = `💰 *${data.title || 'Deposit Received'}*\n\n`;
        message += `You've received a deposit of *${amount} ${currency}* on ${formatNetworkName(network)}.\n\n`;

        if (txHash) {
            message += `*Transaction Hash:* \`${txHash}\`\n`;
        }

        message += `*Transaction Time:* ${timestamp}\n\n`;

        // Add custom message if available
        if (data.message && data.message !== `Received deposit of ${amount} ${currency}`) {
            message += `*Note:* ${data.message}\n\n`;
        }

        return message;
    }

    /**
     * Unsubscribe all channels for a specific user
     */
    public unsubscribeAllForUser(userId: number): void {
        if (!this.pusher) {
            return;
        }

        // Find all subscriptions for this user
        const userSubscriptions = Array.from(this.subscriptions.entries())
            .filter(([_, sub]) => sub.userId === userId);

        // Unsubscribe from each channel
        for (const [key, subscription] of userSubscriptions) {
            try {
                this.pusher.unsubscribe(subscription.channelName);
                this.subscriptions.delete(key);
                logger.info('Unsubscribed user from channel', {
                    userId,
                    channel: subscription.channelName
                });
            } catch (error) {
                logger.error('Error unsubscribing from channel', {
                    error,
                    userId,
                    channel: subscription.channelName
                });
            }
        }
    }

    /**
     * Test the notification service
     */
    public async testNotification(ctx: GlobalContext): Promise<boolean> {
        try {
            await notificationApi.testNotifications();
            return true;
        } catch (error) {
            logger.error('Error testing notifications', { error, userId: ctx.from?.id });
            return false;
        }
    }
}

export const notificationService = new NotificationService();


/**
 * Configure real-time notifications with Pusher
 */
export const configureNotifications = (bot: Telegraf<GlobalContext>): void => {
    notificationService.initialize(bot);
    logger.info('Real-time notification system configured');
};


export default notificationService; 