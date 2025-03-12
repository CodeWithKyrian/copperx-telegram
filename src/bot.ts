import { Telegraf } from 'telegraf';
import { environment } from './config/environment';

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
    bot.start((ctx) => {
        ctx.reply('Welcome to CopperX Telegram Bot! 🚀\n\nI can help you manage your USDC transactions directly through Telegram.\n\nUse /help to see available commands.');
    });

    bot.help((ctx) => {
        ctx.reply(
            'Here are the available commands:\n\n' +
            '/start - Start the bot\n' +
            '/help - Show this help message\n' +
            '/about - About CopperX\n\n' +
            'More commands will be available after you authenticate.'
        );
    });

    bot.command('about', (ctx) => {
        ctx.reply(
            'CopperX is building a stablecoin bank for individuals and businesses.\n\n' +
            'This bot allows you to deposit, withdraw, and transfer USDC directly through Telegram without visiting our web app.\n\n' +
            'For support, please visit: https://t.me/copperxcommunity/2183'
        );
    });

    bot.command('deposit', (ctx) => {
        ctx.reply('Deposit USDC to your CopperX account.');
    });

    bot.on('text', (ctx) => {
        if (ctx.message.text.startsWith('/')) {
            ctx.reply('Unknown command. Use /help to see available commands.');
        }
    });
};

