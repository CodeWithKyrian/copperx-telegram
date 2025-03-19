import { Telegraf } from "telegraf";
import logger from "../utils/logger.utils";
import { GlobalContext } from "../types";
import { mainMenuAction, startCommand } from "./start.command";
import { helpCommand, helpAction } from "./help.command";
import { aboutAction, aboutCommand } from "./about.command";
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
import { sendCommand, transferDetailsAction, sendAction, sendBatchAction, sendSingleAction } from "./send.command";
import { historyCommand, historyAction } from "./history.command";
import { message } from "telegraf/filters";
import { withdrawAction, withdrawCommand } from "./withdraw.command";
import { kycCommand, kycStatusAction } from "./kyc.command";
import { testNotificationCommand } from "./notification.command";
import { addPayeeAction, listPayeesAction, noSavePayeeAction, payeesCommand, removePayeeAction, savePayeeAction } from "./payee.command";
import { handleNaturalLanguage } from "./natural-language.command";

import { config } from '../config';

/**
 * Configure the bot commands and handlers
 * @param bot Telegraf bot instance
 */
export const configureCommands = (bot: Telegraf<GlobalContext>): void => {

    setupCommands(bot);

    registerCommandHandlers(bot);

    registerActionHandlers(bot);

    // Catch all handler for unknown commands
    bot.on(message('text'), (ctx) => {
        if (ctx.message.text.startsWith('/')) {
            logger.debug(`Unknown command received`, { command: ctx.message.text });
            ctx.reply('Unknown command. Use /help to see available commands.');
        }

        handleNaturalLanguage(ctx);
    });
};

const setupCommands = (bot: Telegraf<GlobalContext>): void => {
    bot.telegram.setMyCommands([
        { command: 'start', description: 'Start the bot and show main menu' },
        { command: 'login', description: 'Login to your CopperX account' },
        { command: 'profile', description: 'View your account profile' },
        { command: 'wallet', description: 'View your wallet and balances' },
        { command: 'send', description: 'Send funds to email or wallet' },
        { command: 'deposit', description: 'Deposit funds to your wallet' },
        { command: 'withdraw', description: 'Withdraw funds to bank account' },
        { command: 'payees', description: 'View your payees' },
        { command: 'history', description: 'View your transaction history' },
        { command: 'kyc', description: 'Check your KYC verification status' },
        { command: 'help', description: 'Get help with using the bot' },
        { command: 'logout', description: 'Logout from your account' }
    ]);
}

const registerCommandHandlers = (bot: Telegraf<GlobalContext>): void => {
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
    bot.command('payees', payeesCommand);
    bot.command('history', historyCommand);

    if (config.env.isDevelopment) {
        bot.command('test_notifications', testNotificationCommand);
    }
}

const registerActionHandlers = (bot: Telegraf<GlobalContext>): void => {
    bot.action('main_menu', mainMenuAction);
    bot.action('profile', profileAction);
    bot.action('kyc_status', kycStatusAction);
    bot.action('logout', logoutAction);
    bot.action('login', loginAction);
    bot.action('help', helpAction);
    bot.action('about', aboutAction);

    bot.action('view_wallets', viewWalletsAction);
    bot.action('create_wallet', walletCreateAction);
    bot.action('set_default_wallet', walletSetDefaultAction);
    bot.action(/set_default_wallet:(.+)/, walletSetDefaultActionWithWallet);

    bot.action('deposit_funds', depositAction);
    bot.action(/deposit_funds:(.+)/, depositActionWithWallet);
    bot.action('deposit_done', depositDoneAction);

    bot.action('send_funds', sendAction);
    bot.action('send_funds:single', sendSingleAction);
    bot.action('send_funds:batch', sendBatchAction);

    bot.action('withdraw_funds', withdrawAction);
    bot.action('history', historyAction);
    bot.action('transfer_details', transferDetailsAction);

    bot.command('payees', payeesCommand);
    bot.action('list_payees', listPayeesAction);
    bot.action('add_payee', addPayeeAction);
    bot.action('remove_payee', removePayeeAction);
    bot.action(/save_payee:(.+)/, savePayeeAction);
    bot.action('no_save_payee', noSavePayeeAction);

    bot.action('cancel', async (ctx) => {
        await ctx.answerCbQuery();
        await ctx.reply('Operation cancelled.');
    });
}

