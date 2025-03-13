import { Telegraf } from "telegraf";
import { startCommand } from "./start.command";
import { GlobalContext } from "../types";
import { helpCommand } from "./help.command";
import { aboutCommand } from "./about.command";
import { loginCommand } from "./login.command";
import { logoutCommand } from "./login.command";
import logger from "../utils/logger";

/**
 * Registers the commands for the bot
 */
export const registerCommands = (bot: Telegraf<GlobalContext>) => {
    // Start command
    bot.start(startCommand.handler);

    // Help command
    bot.help(helpCommand.handler);

    // About command
    bot.command(aboutCommand.name, aboutCommand.handler);

    // Auth commands
    bot.command(loginCommand.name, loginCommand.handler);
    bot.command(logoutCommand.name, logoutCommand.handler);

    // Handle unknown commands
    bot.on('text', (ctx) => {
        if (ctx.message.text.startsWith('/')) {
            logger.debug(`Unknown command received`, { command: ctx.message.text });
            ctx.reply('Unknown command. Use /help to see available commands.');
        }
    });
};