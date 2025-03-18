import { Markup } from 'telegraf';
import { GlobalContext } from '../types/session.types';
import logger from '../utils/logger.utils';

export const startCommand = async (ctx: GlobalContext): Promise<void> => {
    try {
        const isAuthenticated = !!ctx.session?.auth?.accessToken;
        const username = ctx.from?.username || 'there';

        if (isAuthenticated) {
            // User is authenticated - show welcome message with summary
            await ctx.reply(
                `👋 Welcome to the *CopperX Bot*, ${username}!\n\n` +
                `I'm here to help you manage your CopperX Payout account. You can check your wallet balance, ` +
                `send funds to others, deposit and withdraw USDC, view your transaction history, and manage your saved recipients.`,
                {
                    parse_mode: 'Markdown'
                }
            );

            // Show the main menu after the welcome message
            await showMainMenu(ctx);
        } else {
            // User is not authenticated - show welcome message
            await ctx.reply(
                `👋 Hello, *${username}*!\n\n` +
                'Welcome to the *CopperX Bot*. This bot allows you to manage your CopperX Payout account directly from Telegram. ' +
                'You can check balances, send and receive payments, withdraw funds, and more.\n\n' +
                'Please login to get started:',
                {
                    parse_mode: 'Markdown'
                }
            );

            // Show login options
            await showMainMenu(ctx);
        }
    } catch (error) {
        logger.error('Error handling start command', { error });
        await ctx.reply('Sorry, something went wrong while starting the bot. Please try again.');
    }
};

export const mainMenuAction = async (ctx: GlobalContext): Promise<void> => {
    await ctx.answerCbQuery();
    await showMainMenu(ctx);
};

export const showMainMenu = async (ctx: GlobalContext): Promise<void> => {
    try {
        const isAuthenticated = !!ctx.session?.auth?.accessToken;

        if (isAuthenticated) {
            await ctx.reply(
                `What would you like to do today?`,
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [
                            Markup.button.callback('👤 View Profile', 'profile'),
                            Markup.button.callback('💼 View Wallets', 'view_wallets')
                        ],
                        [
                            Markup.button.callback('💸 Send Funds', 'send_funds'),
                            Markup.button.callback('📥 Deposit Funds', 'deposit_funds')
                        ],
                        [
                            Markup.button.callback('📤 Bank Withdrawal', 'withdraw_funds'),
                            Markup.button.callback('📜 Transactions History', 'history')
                        ],
                        [
                            Markup.button.callback('🔐 KYC Status', 'kyc_status'),
                            Markup.button.callback('👥 Manage Payees', 'list_payees')
                        ],
                        [
                            Markup.button.callback('❓ Help', 'help'),
                            Markup.button.callback('🔑 Logout', 'logout')
                        ]
                    ])
                }
            );
        } else {
            // User is not authenticated - show login options
            await ctx.reply(
                `Please login to access all features:`,
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔑 Login to CopperX', 'login')],
                        [Markup.button.callback('❓ Help', 'help'),
                        Markup.button.callback('ℹ️ About', 'about')]
                    ])
                }
            );
        }
    } catch (error) {
        logger.error('Error showing main menu', { error });
        await ctx.reply('Sorry, something went wrong. Please try again.');
    }
};

