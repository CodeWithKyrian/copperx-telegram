import { Telegraf } from "telegraf";
import { startCommand } from "./start.command";
import { GlobalContext } from "../types";
import { helpCommand } from "./help.command";
import { aboutCommand } from "./about.command";
import { loginCommand } from "./login.command";
import { logoutCommand } from "./login.command";
import { meCommand } from "./me.command";
import { walletCommand } from "./wallet.command";
import logger from "../utils/logger";

/**
 * Registry of commands that require authentication
 */
export const PROTECTED_COMMANDS = [
    'me',
    'logout',
    'wallet',
];

/**
 * Checks if a command requires authentication
 */
export const isProtectedCommand = (command: string) => {
    return PROTECTED_COMMANDS.some(c => c === command);
};

/**
 * Registers the commands for the bot
 */
export const registerCommands = (bot: Telegraf<GlobalContext>) => {
    bot.start(startCommand);

    bot.help(helpCommand);

    bot.command('about', aboutCommand);

    bot.command('login', loginCommand);

    bot.command('logout', logoutCommand);

    bot.command('me', meCommand);

    bot.command('wallet', walletCommand);

    bot.on('text', (ctx) => {
        if (ctx.message.text.startsWith('/')) {
            logger.debug(`Unknown command received`, { command: ctx.message.text });
            ctx.reply('Unknown command. Use /help to see available commands.');
        }
    });
};