import { Telegraf } from "telegraf";
import logger from "../utils/logger";
import { GlobalContext } from "../types";
import { mainMenuAction, startCommand } from "./start.command";
import { helpCommand, helpAction } from "./help.command";
import { aboutCommand } from "./about.command";
import { loginAction, loginCommand } from "./login.command";
import { logoutAction, logoutCommand } from "./logout.command";
import { profileAction, profileCommand } from "./profile.command";
import {
    viewWalletsAction,
    walletCommand,
    walletCreateAction,
    walletSetDefaultAction,
    walletSetDefaultActionWithWallet,
} from "./wallet.command";
import { depositAction, depositActionWithWallet, depositCommand, depositDoneAction } from "./deposit.command";
import { sendCommand, transferDetailsAction, sendAction } from "./send.command";
import { historyCommand, historyAction } from "./history.command";
import { message } from "telegraf/filters";
import { withdrawAction, withdrawCommand } from "./withdraw.command";
import { kycCommand, kycStatusAction } from "./kyc.command";
/**
 * Registers all command handlers with the bot
 * @param bot Telegraf bot instance
 */
export const registerCommands = (bot: Telegraf<GlobalContext>): void => {
    bot.command('start', startCommand);
    bot.command('help', helpCommand);
    bot.command('about', aboutCommand);
    bot.command('login', loginCommand);
    bot.command('logout', logoutCommand);
    bot.command('profile', profileCommand);
    bot.command('kyc', kycCommand);
    bot.command('wallet', walletCommand);
    bot.command('deposit', depositCommand);
    bot.command('send', sendCommand);
    bot.command('withdraw', withdrawCommand);
    bot.command('history', historyCommand);

    // Set up command descriptions in Telegram menu
    bot.telegram.setMyCommands([
        { command: 'start', description: 'Start the bot and show main menu' },
        { command: 'login', description: 'Login to your CopperX account' },
        { command: 'profile', description: 'View your account profile' },
        { command: 'wallet', description: 'View your wallet and balances' },
        { command: 'send', description: 'Send funds to email or wallet' },
        { command: 'deposit', description: 'Deposit funds to your wallet' },
        { command: 'withdraw', description: 'Withdraw funds to bank account' },
        { command: 'history', description: 'View your transaction history' },
        { command: 'kyc', description: 'Check your KYC verification status' },
        { command: 'help', description: 'Get help with using the bot' },
        { command: 'logout', description: 'Logout from your account' }
    ]);

    // Register action handlers
    bot.action('main_menu', mainMenuAction);
    bot.action('profile', profileAction);
    bot.action('kyc_status', kycStatusAction);
    bot.action('logout', logoutAction);
    bot.action('login', loginAction);
    bot.action('help', helpAction);
    bot.action('view_wallets', viewWalletsAction);
    bot.action('create_wallet', walletCreateAction);
    bot.action('set_default_wallet', walletSetDefaultAction);
    bot.action(/set_default_wallet:(.+)/, walletSetDefaultActionWithWallet);
    bot.action('deposit_funds', depositAction);
    bot.action(/deposit_funds:(.+)/, depositActionWithWallet);
    bot.action('deposit_done', depositDoneAction);
    bot.action('send_funds', sendAction);
    bot.action('withdraw_funds', withdrawAction);
    bot.action('history', historyAction);
    bot.action('transfer_details', transferDetailsAction);

    bot.action('cancel', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Operation cancelled.');
    });

    // Catch all handler for unknown commands
    bot.on(message('text'), (ctx) => {
        if (ctx.message.text.startsWith('/')) {
            logger.debug(`Unknown command received`, { command: ctx.message.text });
            ctx.reply('Unknown command. Use /help to see available commands.');
        }
    });
};

