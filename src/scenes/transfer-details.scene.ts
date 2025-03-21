import { Scenes, Markup } from 'telegraf';
import { GlobalContext, GlobalSceneSession } from '../types/session.types';
import { transferService } from '../services/transfer.service';
import logger from '../utils/logger.utils';
import { message } from 'telegraf/filters';

interface TransferDetailsSessionData extends GlobalSceneSession {
    transferId?: string;
}

export type TransferDetailsContext = GlobalContext<TransferDetailsSessionData>;

/**
 * Scene for viewing transfer details
 */
const transferDetailsScene = new Scenes.BaseScene<TransferDetailsContext>('transfer_details');

// Handler for when the scene is entered
transferDetailsScene.enter(async (ctx) => {
    // If transfer ID was pre-provided, show details immediately
    if (ctx.scene.session.transferId) {
        await showTransferDetails(ctx, ctx.scene.session.transferId);
        return ctx.scene.leave();
    }

    await ctx.reply(
        '🔍 *View Transfer Details*\n\n' +
        'Please enter the transfer ID you want to view:',
        { parse_mode: 'Markdown' }
    );
});

// Handle text input (transfer ID)
transferDetailsScene.on(message('text'), async (ctx) => {
    const transferId = ctx.message.text.trim();

    if (!transferId) {
        await ctx.reply('Please enter a valid transfer ID.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            }
        );
        return;
    }

    await showTransferDetails(ctx, transferId);
    return ctx.scene.leave();
});

// Handle /cancel command
transferDetailsScene.command('cancel', async (ctx) => {
    await ctx.reply('Operation cancelled.', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Transfer History', 'history')]
        ])
    });
    return ctx.scene.leave();
});

/**
 * Fetches and displays transfer details
 */
async function showTransferDetails(ctx: TransferDetailsContext, transferId: string): Promise<void> {
    try {
        await ctx.reply('Fetching transaction details...');

        const transfer = await transferService.getTransferDetails(transferId);

        if (!transfer) {
            await ctx.reply(
                '❌ *Transfer Not Found*\n\n' +
                'We couldn\'t find a transfer with that ID. Please check the ID and try again.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Transfer History', 'history')]
                    ])
                }
            );
            return;
        }

        // Format transfer details
        const message = transferService.formatTransfer(transfer);

        // Create keyboard with actions
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Transfer History', 'history')],
            [Markup.button.callback('💼 View Wallets', 'view_wallets')]
        ]);

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...keyboard
        });

    } catch (error) {
        logger.error({ error, transferId }, 'Error showing transfer details');
        await ctx.reply(
            '❌ *Error Retrieving Transfer*\n\n' +
            'We encountered an error while retrieving transfer details. Please try again later.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back to Transfer History', 'history')]
                ])
            }
        );
    }
}

// Handle back to list action
transferDetailsScene.action('history', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Returning to transfer history...');
    await ctx.reply('Use /history to view your transfer history again.');
    return ctx.scene.leave();
});

// Handle view wallets action
transferDetailsScene.action('view_wallets', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Opening your wallet...');
    await ctx.reply('Use /wallet to view your wallet.');
    return ctx.scene.leave();
});

transferDetailsScene.action('cancel', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Operation cancelled.', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Transfer History', 'history')]
        ])
    });
    return ctx.scene.leave();
});

export { transferDetailsScene };