import { Markup } from 'telegraf';
import { GlobalContext } from '../types/session.types';
import logger from '../utils/logger';

export const startCommand = async (ctx: GlobalContext): Promise<void> => {
    try {
        const isAuthenticated = !!ctx.session?.auth?.accessToken;
        const username = ctx.from?.username || 'there';

        if (isAuthenticated) {
            // User is authenticated
            await ctx.reply(
                `👋 Welcome back, *${username}*!\n\n` +
                'What would you like to do today?',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [
                            Markup.button.callback('💼 Wallet', 'view_wallets'),
                            Markup.button.callback('👤 Profile', 'profile')
                        ],
                        [
                            Markup.button.callback('💸 Send', 'send_funds'),
                            Markup.button.callback('📥 Deposit', 'deposit_funds')
                        ],
                        [
                            Markup.button.callback('📤 Withdraw', 'withdraw_funds'),
                            Markup.button.callback('📜 Transactions', 'history')
                        ],
                        [
                            Markup.button.callback('🔐 KYC Status', 'kyc_status'),
                            Markup.button.callback('❓ Help', 'help')
                        ],
                        [
                            Markup.button.callback('🔑 Logout', 'logout')
                        ]
                    ])
                }
            );
        } else {
            // User is not authenticated
            await ctx.reply(
                `👋 Hello, *${username}*!\n\n` +
                'Welcome to the *CopperX Bot*. Please login to access all features.',
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
        logger.error('Error handling start command', { error });
        await ctx.reply('Sorry, something went wrong while starting the bot. Please try again.');
    }
};

export const mainMenuAction = async (ctx: GlobalContext): Promise<void> => {
    try {
        await ctx.answerCbQuery();
        await startCommand(ctx);
    } catch (error) {
        logger.error('Error showing main menu', { error });
        await ctx.answerCbQuery('Error showing menu. Please try again.');
    }
};