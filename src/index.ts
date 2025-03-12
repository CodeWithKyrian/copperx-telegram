import { initBot } from './bot';
import { config } from './config';
import { validate } from './utils/validators';
import logger from './utils/logger';

try {
    validate.environment();
    logger.info('Environment validation passed');
} catch (error: any) {
    logger.error('Environment validation failed', { error: error.message });
    process.exit(1);
}

logger.info(`CopperX Telegram Bot starting`, {
    environment: config.env.nodeEnv,
    logLevel: config.env.logging.level,
    sessionDriver: config.env.session.driver,
});

const bot = initBot();

bot.launch(() => logger.info('Bot started successfully'))
    .catch((err: any) => {
        logger.error('Failed to start bot', { error: err.message, stack: err.stack });
        process.exit(1);
    });

// Enable graceful stop
process.once('SIGINT', () => {
    logger.info('Received SIGINT signal, shutting down...');
    bot.stop('SIGINT');
});
process.once('SIGTERM', () => {
    logger.info('Received SIGTERM signal, shutting down...');
    bot.stop('SIGTERM');
});