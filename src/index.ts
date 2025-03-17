import { initBot } from './bot';
import { config } from './config';
import { validateEnvironment } from './utils/validators';
import logger from './utils/logger';

try {
    validateEnvironment();
    logger.info('Environment validation passed');

    logger.info('CopperX Telegram Bot starting', {
        environment: config.env.nodeEnv,
        logLevel: config.env.logging.level,
        sessionDriver: config.env.session.driver,
    });

    const bot = initBot();

    if (config.env.nodeEnv === 'production') {
        bot.launch({
            webhook: {
                domain: config.env.webhook.domain,
                port: config.env.webhook.port,
                path: config.env.webhook.secretPath || bot.secretPathComponent(),
                secretToken: config.env.webhook.secretToken
            }
        });

        logger.info('Bot started successfully in webhook mode', {
            domain: config.env.webhook.domain,
            port: config.env.webhook.port,
        });
    } else {
        bot.launch(() => {
            logger.info('Bot started successfully in long-polling mode');
        });
    }

    // Enable graceful stop
    process.once('SIGINT', () => {
        logger.info('Received SIGINT signal, shutting down...');
        bot.stop('SIGINT');
        process.exit(0);
    });

    process.once('SIGTERM', () => {
        logger.info('Received SIGTERM signal, shutting down...');
        bot.stop('SIGTERM');
        process.exit(0);
    });
} catch (error: any) {
    logger.error('Failed to start bot', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
}