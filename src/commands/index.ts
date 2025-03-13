import { Telegraf } from "telegraf";
import { startCommand } from "./start.command";
import { GlobalContext } from "../types";
import { helpCommand } from "./help.command";
import { aboutCommand } from "./about.command";
import { loginCommand } from "./login.command";
import { logoutCommand } from "./login.command";
import { meCommand } from "./me.command";
import logger from "../utils/logger";

/**
 * Registry of commands that require authentication
 */
export const PROTECTED_COMMANDS = [
    logoutCommand,
    meCommand,
];

/**
 * Checks if a command requires authentication
 */
export const isProtectedCommand = (command: string) => {
    return PROTECTED_COMMANDS.some(c => c.name === command);
};

/**
 * Registers the commands for the bot
 */
export const registerCommands = (bot: Telegraf<GlobalContext>) => {
    // /start command
    bot.start(startCommand.handler);

    // /help command
    bot.help(helpCommand.handler);

    // /about command
    bot.command(aboutCommand.name, aboutCommand.handler);

    // /login and /logout commands
    bot.command(loginCommand.name, loginCommand.handler);
    bot.command(logoutCommand.name, logoutCommand.handler);

    // /me command
    bot.command(meCommand.name, meCommand.handler);

    // Handle unknown commands
    bot.on('text', (ctx) => {
        if (ctx.message.text.startsWith('/')) {
            logger.debug(`Unknown command received`, { command: ctx.message.text });
            ctx.reply('Unknown command. Use /help to see available commands.');
        }
    });
};