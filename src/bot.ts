import { Context, Telegraf } from 'telegraf';
import { config } from './config';
import { configureScenes } from './scenes';
import { configureCommands } from './commands';
import { configureMiddlewares } from './middlewares';
import { configureNotifications } from './services/notification.service';
import { GlobalContext } from './types';
import logger from './utils/logger.utils';

/**
 * Initializes the Telegram bot
 */
export const initBot = (): Telegraf<GlobalContext> => {
    const bot = new Telegraf<GlobalContext>(config.bot.token);

    configureMiddlewares(bot);

    configureErrorHandler(bot);

    configureScenes(bot);

    configureCommands(bot);

    configureNotifications(bot);

    return bot;
};

const configureErrorHandler = (bot: Telegraf<GlobalContext>) => {
    bot.catch((err: any, ctx: Context) => {
        logger.error({
            error: err.message,
            stack: err.stack,
            updateType: ctx.updateType,
            userId: ctx.from?.id,
        }, 'Error processing update');
        ctx.reply('An error occurred while processing your request. Please try again later.');
    });
};