import { Telegraf } from 'telegraf';
import { environment } from './config/environment';
import { startCommand, helpCommand, aboutCommand } from './commands';


/**
 * Initializes the Telegram bot
 */
export const initBot = (): Telegraf => {
    const bot = new Telegraf(environment.bot.token);

    bot.catch((err, ctx) => {
        console.error(`Error for ${ctx.updateType}`, err);
        ctx.reply('An error occurred while processing your request. Please try again later.');
    });

    registerCommands(bot);

    return bot;
};

/**
 * Registers the commands for the bot
 */
const registerCommands = (bot: Telegraf) => {
    bot.start(startCommand.handler);

    bot.help(helpCommand.handler);

    bot.command(aboutCommand.name, aboutCommand.handler);

    bot.on('text', (ctx) => {
        if (ctx.message.text.startsWith('/')) {
            ctx.reply('Unknown command. Use /help to see available commands.');
        }
    });
};

