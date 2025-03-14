import { Telegraf } from "telegraf";
import { GlobalContext } from "../types";
import { startCommand } from "./start.command";
import { helpCommand } from "./help.command";
import { aboutCommand } from "./about.command";
import { loginCommand } from "./login.command";
import { logoutCommand } from "./logout.command";
import { meCommand } from "./me.command";
import { walletCommand } from "./wallet.command";
import logger from "../utils/logger";
import { SCENE_IDS } from "../scenes";

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
 * Registers all command handlers with the bot
 * @param bot Telegraf bot instance
 */
export const registerCommands = (bot: Telegraf<GlobalContext>): void => {
    // Basic commands
    bot.command('start', startCommand);
    bot.command('help', helpCommand);
    bot.command('about', aboutCommand);

    // Authentication commands
    bot.command('login', loginCommand);
    bot.command('logout', logoutCommand);
    bot.command('me', meCommand);

    // Wallet commands
    bot.command('wallet', walletCommand);
    bot.command('deposit', (ctx) => ctx.scene.enter(SCENE_IDS.DEPOSIT));

    // Register wallet action handlers
    registerWalletActionHandlers(bot);

    bot.on('text', (ctx) => {
        if (ctx.message.text.startsWith('/')) {
            logger.debug(`Unknown command received`, { command: ctx.message.text });
            ctx.reply('Unknown command. Use /help to see available commands.');
        }
    });
};

/**
 * Registers action handlers for wallet-related actions
 */
function registerWalletActionHandlers(bot: Telegraf<GlobalContext>): void {
    bot.action('view_wallets', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Fetching your wallets...');
        return await walletCommand(ctx);
    });

    bot.action('wallet_create', async (ctx) => {
        await ctx.answerCbQuery();
        return await ctx.scene.enter(SCENE_IDS.WALLET_CREATE);
    });

    bot.action('wallet_deposit', async (ctx) => {
        await ctx.answerCbQuery();
        return await ctx.scene.enter(SCENE_IDS.DEPOSIT);
    });

    bot.action('wallet_set_default', async (ctx) => {
        await ctx.answerCbQuery();
        return await ctx.scene.enter(SCENE_IDS.WALLET_DEFAULT);
    });

    bot.action('wallet_transfer', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('The transfer feature will be available soon.');
        // Will later enter transfer scene
    });

    bot.action('wallet_history', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Transaction history feature will be available soon.');
        // Will later show transaction history
    });

    bot.action('wallet_cancel', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Operation cancelled.');
    });
}

