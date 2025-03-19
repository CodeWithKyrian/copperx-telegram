import { Telegraf } from "telegraf";
import { GlobalContext } from "../src/types";
import { logger, validateEnvironment } from "../src/utils";
import { environment } from "../src/config";
import { initBot } from "../src/bot";

const setupWebhookConfig = () => {
    const isOnVercel = !!process.env.VERCEL;
    const vercelUrl = process.env.VERCEL_URL;
    if (isOnVercel && vercelUrl) {
        logger.info(`Using Vercel URL for webhook: ${vercelUrl}`);

        environment.app.domain = `https://${vercelUrl}`;

        if (!environment.webhook.secretPath) {
            environment.webhook.secretPath = 'api/webhook';
        }
    }
};

let bot: Telegraf<GlobalContext> | null = null;

try {
    setupWebhookConfig();

    validateEnvironment();

    logger.info('Environment validation passed');

    logger.info('CopperX Telegram Bot initializing for Vercel', {
        environment: environment.nodeEnv,
        logLevel: environment.logging.level,
        sessionDriver: environment.session.driver,
    });

    bot = initBot();
} catch (error: any) {
    logger.error('Failed to initialize bot', {
        error: error.message,
        stack: error.stack
    });
}

export { bot }