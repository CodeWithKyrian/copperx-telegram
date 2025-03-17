import { Markup } from 'telegraf';
import { authService } from '../services/auth.service';
import { GlobalContext } from '../types';
import { capitalize, formatUserStatus, formatWalletAddress } from '../utils/formatters';
import logger from '../utils/logger';


/**
 * Handler for the /profile command
 * @param ctx Telegraf context
 */
export const profileCommand = async (ctx: GlobalContext): Promise<void> => {
    await ctx.reply('🔄 Loading profile...');

    try {
        const profile = await authService.getCurrentUser();


        await ctx.reply(
            '👤 *YOUR COPPERX PROFILE*\n\n' +

            '📝 *Account Info*\n' +
            `• Name: ${profile.firstName || 'Not set'}\n` +
            `• Email: ${profile.email || 'Not set'}\n` +
            `• Status: ${formatUserStatus(profile.status)}\n` +
            `• Type: ${capitalize(profile.type)}\n\n` +

            '🏢 *Organization*\n' +
            `• Role: ${capitalize(profile.role)}\n` +
            `• Organization ID: ${profile.organizationId ?
                '`' + profile.organizationId + '`' : 'Not set'}\n\n` +

            '💼 *Wallet Details*\n' +
            `• Wallet ID: ${profile.walletId ? '`' + profile.walletId + '`' : 'Not set'}\n` +
            `• Type: ${capitalize(profile.walletAccountType)}\n` +
            `• Address: ${formatWalletAddress(profile.walletAddress)}\n\n` +

            '_Use /wallet to check your wallet balance._',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('💼 View Wallets', 'view_wallets'),
                        Markup.button.callback('🔐 KYC Status', 'kyc_status')
                    ],
                    [
                        Markup.button.callback('💳 Deposit Funds', 'deposit_funds'),
                        Markup.button.callback('📤 Send Funds', 'send_funds'),
                    ],
                    [
                        Markup.button.callback('📜 Transaction History', 'history'),
                        Markup.button.callback('🔙 Back to Menu', 'main_menu')
                    ],
                    [Markup.button.callback('🚪 Logout', 'logout')]
                ])
            }
        );
    } catch (error) {
        logger.error('Error fetching profile', { error });
        await ctx.reply(
            '❌ *Error Retrieving Profile*\n\n' +
            'There was a problem retrieving your profile. Please try again later.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔄 Try Again', 'profile')],
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );
    }
};

export const profileAction = async (ctx: GlobalContext): Promise<void> => {
    await ctx.answerCbQuery();
    await profileCommand(ctx);
};