import { Markup } from 'telegraf';
import { GlobalContext } from '../types';
import { transferService } from '../services/transfer.service';
import logger from '../utils/logger';

/**
 * Handles the /history command to view transfer history
 */
export const historyCommand = async (ctx: GlobalContext): Promise<void> => {
    try {
        await ctx.reply('🔍 Fetching your recent transfers...');

        // Get the last 10 transfers
        const response = await transferService.getTransferHistory(1, 10);

        if (!response || !response.data || response.data.length === 0) {
            await ctx.reply(
                '📭 *No Transfers Found*\n\n' +
                'You haven\'t made any transfers yet. Use /send to send funds to another email or wallet or /withdraw to withdraw funds to a bank account.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        Markup.button.callback('💸 Send', 'send_funds'),
                        Markup.button.callback('📤 Withdraw', 'withdraw_funds'),
                    ])
                }
            );
            return;
        }

        // Format the transfers list
        const message = formatTransferListMessage(response.data);

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📊 View Transfer Details', 'transfer_details')],
                [Markup.button.callback('💼 View Wallets', 'view_wallets')]
            ])
        });

    } catch (error) {
        logger.error('Error in history command', { error });
        await ctx.reply(
            '❌ *Error Retrieving Transfer History*\n\n' +
            'We encountered an error while retrieving your transfer history. Please try again later.',
            { parse_mode: 'Markdown' }
        );
    }
};

export async function historyAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await historyCommand(ctx);
}

/**
 * Formats a message showing the list of transfers
 */
function formatTransferListMessage(transfers: any[]): string {
    let message = `📋 *Your Recent Transfers*\n\n`;

    message += transferService.formatTransferList(transfers);

    message += '\n\n*Note:* To view details of a specific transfer, select "View Transfer Details" below.';

    return message;
}

