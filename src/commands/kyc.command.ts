import { Markup } from 'telegraf';
import kycService from '../services/kyc.service';
import logger from '../utils/logger.utils';
import { GlobalContext } from '../types/session.types';
import { KycStatus } from '../types/api.types';
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram';

const KYC_APPLICATION_URL = 'https://payout.copperx.io/app/kyc';

/**
 * Handle the /kyc command to check KYC status
 */
export const kycCommand = async (ctx: GlobalContext): Promise<void> => {
    try {
        await ctx.reply('Checking your KYC status...');

        const result = await kycService.getKycStatus(ctx);

        await ctx.reply(result.message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(getInlineKeyboard(result.status))
        });

    } catch (error) {
        logger.error({ error }, 'Error handling KYC command');
        await ctx.reply(
            '❌ Something went wrong while checking your KYC status.\n' +
            'Please try again later or contact support if the issue persists.'
        );
    }
};

/**
 * Handle the kyc_status action (for inline buttons)
 */
export const kycStatusAction = async (ctx: GlobalContext): Promise<void> => {
    await ctx.answerCbQuery();
    await kycCommand(ctx);
};

function getInlineKeyboard(status: KycStatus | null): InlineKeyboardButton[][] {
    switch (status) {
        case 'approved':
            return [
                [Markup.button.callback('💼 View Wallet', 'view_wallets')],
                [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
            ];
        case 'pending':
            return [
                [Markup.button.url('🔐 Start KYC Verification', KYC_APPLICATION_URL)],
                [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
            ];
        case 'initiated':
            return [
                [Markup.button.url('🔐 Complete KYC Verification', KYC_APPLICATION_URL)],
                [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
            ];
        case 'inprogress':
            return [
                [Markup.button.url('🔐 View KYC Verification', KYC_APPLICATION_URL)],
                [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
            ];
        case 'expired':
        case 'rejected':
            return [
                [Markup.button.url('🔐 Start KYC Verification', KYC_APPLICATION_URL)],
                [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
            ];
        case 'review_pending':
        case 'review':
            return [
                [Markup.button.url('🔐 View KYC Verification', KYC_APPLICATION_URL)],
                [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
            ];
        default:
            return [
                [Markup.button.url('🔐 Start KYC Verification', KYC_APPLICATION_URL)],
                [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
            ];
    }
}