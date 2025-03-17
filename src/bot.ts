import { Context, Telegraf } from 'telegraf';
import { environment } from './config/environment';
import { configureScenes } from './scenes';
import { configureCommands } from './commands';
import { configureMiddlewares } from './middlewares';
import { configureNotifications } from './services/notification.service';
import { GlobalContext } from './types';
import logger from './utils/logger';

/**
 * Initializes the Telegram bot
 */
export const initBot = (): Telegraf<GlobalContext> => {
    const bot = new Telegraf<GlobalContext>(environment.bot.token);

    configureMiddlewares(bot);

    configureErrorHandler(bot);

    configureScenes(bot);

    configureCommands(bot);

    configureNotifications(bot);

    return bot;
};

const configureErrorHandler = (bot: Telegraf<GlobalContext>) => {
    bot.catch((err: any, ctx: Context) => {
        logger.error(`Error processing update`, {
            error: err.message,
            stack: err.stack,
            updateType: ctx.updateType,
            userId: ctx.from?.id,
        });
        ctx.reply('An error occurred while processing your request. Please try again later.');
    });
};

