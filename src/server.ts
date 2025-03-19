import { fastify, FastifyInstance } from 'fastify';
import { Telegraf } from 'telegraf';
import { config } from './config';
import { GlobalContext } from './types';
import logger from './utils/logger.utils';

/**
 * Setup health check routes for the server
 */
const setupHealthRoutes = (app: FastifyInstance) => {
    // Health check endpoint on root and /health
    app.get('/', async () => {
        return {
            status: 'ok',
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            env: config.env.nodeEnv
        };
    });

    app.get('/health', async () => {
        return {
            status: 'ok',
            message: 'Server is healthy',
            timestamp: new Date().toISOString(),
            env: config.env.nodeEnv
        };
    });
};

/**
 * Get webhook information from Telegram
 * Useful for debugging webhook issues
 * @param bot Telegraf bot instance
 */
export const getWebhookInfo = async (bot: Telegraf<GlobalContext>) => {
    try {
        const webhookInfo = await bot.telegram.getWebhookInfo();
        logger.info('Webhook info', { webhookInfo });
        return webhookInfo;
    } catch (error) {
        logger.error('Failed to get webhook info', { error });
        throw error;
    }
};

/**
 * Configure webhook routes for the bot
 * @param app Fastify app instance
 * @param bot Telegraf bot instance
 * @returns Whether webhook was configured successfully
 */
const configureWebhook = async (app: FastifyInstance, bot: Telegraf<GlobalContext>): Promise<boolean> => {
    try {
        // Get app domain from config
        const appDomain = config.env.app.domain;

        // Create webhook URL
        const webhookPath = config.env.webhook.secretPath || `/telegraf/${bot.secretPathComponent()}`;
        const webhookUrl = `https://${appDomain}${webhookPath}`;

        // Delete any existing webhook first
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });

        // Create webhook handler
        const webhookCallback = bot.webhookCallback(webhookPath, {
            secretToken: config.env.webhook.secretToken
        });

        // Register the webhook route with Fastify
        app.post(webhookPath, (request, reply) => {
            // Use the raw request and reply objects
            webhookCallback(request.raw, reply.raw).catch(err => {
                logger.error('Error in webhook handler', { error: err });
                reply.code(500).send('Webhook Error');
            });

            // Return early since webhookCallback handles the response
            return reply;
        });

        // Set the webhook on Telegram's side
        await bot.telegram.setWebhook(webhookUrl, {
            secret_token: config.env.webhook.secretToken
        });

        logger.info(`Webhook set to ${webhookUrl}`);
        return true;
    } catch (error) {
        logger.error('Failed to set webhook', { error });
        return false;
    }
};

/**
 * Configure long polling for the bot (development mode)
 * @param bot Telegraf bot instance
 * @returns Whether long polling was configured successfully
 */
const configureLongPolling = async (bot: Telegraf<GlobalContext>): Promise<boolean> => {
    try {
        // Delete any existing webhook
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });

        // Start long polling
        bot.launch();
        logger.info('Bot started successfully in long-polling mode');
        return true;
    } catch (error) {
        logger.error('Failed to start long polling', { error });
        return false;
    }
};

/**
 * Initialize the server with bot integration
 * @param bot Telegraf bot instance
 * @returns Fastify app instance
 */
export const initServer = async (bot: Telegraf<GlobalContext>): Promise<FastifyInstance> => {
    // Initialize Fastify
    const app = fastify({
        logger: false
    });

    // Setup health check routes
    setupHealthRoutes(app);

    // Add webhook info endpoint for debugging (only in development)
    if (config.env.isDevelopment) {
        app.get('/webhook-info', async () => {
            const webhookInfo = await getWebhookInfo(bot);
            return { webhookInfo };
        });
    }

    // Configure bot mode based on environment
    if (config.env.isProduction) {
        const success = await configureWebhook(app, bot);
        if (!success) {
            throw new Error('Failed to configure webhook');
        }
    } else {
        const success = await configureLongPolling(bot);
        if (!success) {
            throw new Error('Failed to configure long polling');
        }
    }

    return app;
}; 