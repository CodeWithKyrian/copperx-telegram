import { Context, Telegraf } from 'telegraf';
import { environment } from './config/environment';
import { startCommand, helpCommand, aboutCommand } from './commands';
import { loggerMiddleware } from './middlewares/logger.middleware';
import logger from './utils/logger';


/**
 * Initializes the Telegram bot
 */
export const initBot = (): Telegraf => {
    const bot = new Telegraf(environment.bot.token);

    bot.use(loggerMiddleware());

    bot.catch((err: any, ctx: Context) => {
        logger.error(`Error processing update`, {
            error: err.message,
            stack: err.stack,
            updateType: ctx.updateType,
            userId: ctx.from?.id,
        });
        ctx.reply('An error occurred while processing your request. Please try again later.');
    });

    registerCommands(bot);

    return bot;
};

/**
 * Registers the commands for the bot
 */
const registerCommands = (bot: Telegraf) => {
    // Start command
    bot.start(startCommand.handler);

    // Help command
    bot.help(helpCommand.handler);

    // About command
    bot.command(aboutCommand.name, aboutCommand.handler);

    // Handle unknown commands
    bot.on('text', (ctx) => {
        if (ctx.message.text.startsWith('/')) {
            logger.debug(`Unknown command received`, { command: ctx.message.text });
            ctx.reply('Unknown command. Use /help to see available commands.');
        }
    });
};

