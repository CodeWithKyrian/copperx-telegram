import { Telegraf } from "telegraf";
import logger from "../utils/logger";
import { GlobalContext } from "../types";
import { startCommand } from "./start.command";
import { helpCommand } from "./help.command";
import { aboutCommand } from "./about.command";
import { loginCommand } from "./login.command";
import { logoutCommand } from "./logout.command";
import { meCommand } from "./me.command";
import {
    viewWalletsAction,
    walletCancelAction,
    walletCommand,
    walletCreateAction,
    walletSetDefaultAction,
    walletSetDefaultActionWithWallet,
} from "./wallet.command";
import {
    transactionsCommand,
    transactionViewDetailsAction,
    transactionPrevPageAction,
    transactionNextPageAction,
    transactionHistoryAction
} from './transactions.command';
import { depositAction, depositActionWithWallet, depositCommand } from "./deposit.command";
import { transferAction, transferCommand, transferDetailsAction, transferHistoryAction } from "./transfer.command";
import { transferHistoryCommand } from "./transfer-history.command";
import { message } from "telegraf/filters";
import { withdrawCommand } from "./withdraw.command";
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
    bot.action('view_wallets', viewWalletsAction);
    bot.action('wallet_create', walletCreateAction);
    bot.action('wallet_set_default', walletSetDefaultAction);
    bot.action(/wallet_set_default:(.+)/, walletSetDefaultActionWithWallet);
    bot.action('wallet_cancel', walletCancelAction);

    // Deposit commands
    bot.command('deposit', depositCommand);
    bot.action('deposit_create', depositAction);
    bot.action(/deposit_create:(.+)/, depositActionWithWallet);

    // Withdraw commands
    bot.command('withdraw', withdrawCommand);

    // Transfer commands
    bot.command('transfer', transferCommand);
    bot.command('history', transferHistoryCommand);
    bot.action('transfer_create', transferAction);
    bot.action('transfer_details', transferDetailsAction);
    bot.action('transfer_history', transferHistoryAction);

    // Transaction commands
    bot.command('transactions', transactionsCommand);
    bot.action('tx_history', transactionHistoryAction);
    bot.action('tx_next_page', transactionNextPageAction);
    bot.action('tx_prev_page', transactionPrevPageAction);
    bot.action('tx_view_details', transactionViewDetailsAction);

    // Catch all
    bot.on(message('text'), (ctx) => {
        if (ctx.message.text.startsWith('/')) {
            logger.debug(`Unknown command received`, { command: ctx.message.text });
            ctx.reply('Unknown command. Use /help to see available commands.');
        }
    });
};

