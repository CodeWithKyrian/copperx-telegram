import { FastifyInstance } from 'fastify';
import { Telegraf } from 'telegraf';
import { initBot } from './bot';
import { initServer } from './server';
import { config } from './config';
import { validateEnvironment } from './utils/validators';
import logger from './utils/logger.utils';
import { GlobalContext } from './types';

/**
 * Bootstrap the application
 */
const bootstrap = async () => {
    try {
        validateEnvironment();

        logger.info('Environment validation passed');

        logger.info({
            environment: config.nodeEnv,
            logLevel: config.logging.level,
            sessionDriver: config.session.driver,
        }, 'CopperX Telegram Bot starting');

        const bot = initBot();

        const app = await initServer(bot);

        const host = config.app.host;
        const port = config.app.port;

        await app.listen({ host, port });

        logger.info(`Server started on ${host}:${port}`);

        setupGracefulShutdown(app, bot);
    } catch (error: any) {
        logger.error({
            error: error.message,
            stack: error.stack
        }, 'Failed to start bot');
        process.exit(1);
    }
};

/**
 * Setup graceful shutdown handlers
 */
const setupGracefulShutdown = (app: FastifyInstance, bot: Telegraf<GlobalContext>) => {
    const gracefulShutdown = async () => {
        logger.info('Shutting down...');

        try {
            await app.close();
            logger.info('Fastify server closed');

            bot.stop();
            logger.info('Bot stopped');

            process.exit(0);
        } catch (err) {
            logger.error({ error: err }, 'Error during shutdown');
            process.exit(1);
        }
    };

    process.once('SIGINT', gracefulShutdown);
    process.once('SIGTERM', gracefulShutdown);
};

bootstrap();