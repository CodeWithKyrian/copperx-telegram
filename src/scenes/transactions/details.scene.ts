import { Scenes, Markup } from 'telegraf';
import { GlobalContext, GlobalSceneSession } from '../../types/session.types';
import { transactionService } from '../../services/transaction.service';
import logger from '../../utils/logger';
import { message } from 'telegraf/filters';

interface TransactionDetailsSessionData extends GlobalSceneSession {
    transactionId?: string;
}

export type TransactionDetailsContext = GlobalContext<TransactionDetailsSessionData>;

/**
 * Scene for viewing transaction details
 */
const transactionDetailsScene = new Scenes.BaseScene<TransactionDetailsContext>('transaction_details');

transactionDetailsScene.enter(handleSceneEnter);

transactionDetailsScene.command('cancel', handleCancelCommand);

transactionDetailsScene.on(message('text'), async (ctx) => {
    const transactionId = ctx.message.text.trim();

    if (!transactionId) {
        await ctx.reply('Please enter a valid transaction ID.');
        return;
    }

    await showTransactionDetails(ctx, transactionId);
    return ctx.scene.leave();
});

transactionDetailsScene.action('tx_back_to_list', handleBackToTransactionList);


async function handleSceneEnter(ctx: TransactionDetailsContext) {
    if (ctx.scene.session.transactionId) {
        await showTransactionDetails(ctx, ctx.scene.session.transactionId);
        return ctx.scene.leave();
    }

    await ctx.reply(
        '🔍 *View Transaction Details*\n\n' +
        'Please enter the transaction ID you want to view:',
        { parse_mode: 'Markdown' }
    );
}

async function handleCancelCommand(ctx: TransactionDetailsContext) {
    await ctx.reply('Operation cancelled.');
    return ctx.scene.leave();
}

async function handleBackToTransactionList(ctx: TransactionDetailsContext) {
    await ctx.answerCbQuery();
    await ctx.reply('Returning to transaction list...');
    await ctx.reply('Use /transactions to view your transaction history again.');
    return ctx.scene.leave();
}

async function showTransactionDetails(ctx: TransactionDetailsContext, transactionId: string): Promise<void> {
    try {
        await ctx.reply('Fetching transaction details...');

        const transaction = await transactionService.getTransaction(transactionId);

        if (!transaction) {
            await ctx.reply(
                '❌ *Transaction Not Found*\n\n' +
                'We couldn\'t find a transaction with that ID. Please check the ID and try again.',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // Format transaction details
        const message = transactionService.formatTransaction(transaction);

        // Create keyboard with actions
        const keyboard = Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Transaction List', 'tx_back_to_list')],
            transaction.transactionHash
                ? [Markup.button.url('🔍 View on Explorer', getExplorerLink(transaction))]
                : []
        ].filter(row => row.length > 0));

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...keyboard
        });

    } catch (error) {
        logger.error('Error showing transaction details', { error, transactionId });
        await ctx.reply(
            '❌ *Error Retrieving Transaction*\n\n' +
            'We encountered an error while retrieving transaction details. Please try again later.',
            { parse_mode: 'Markdown' }
        );
    }
}

function getExplorerLink(transaction: any): string {
    if (!transaction.transactionHash) return '';

    // If we have the chain utils we made earlier, we can use it
    if (transaction.fromAccount?.network) {
        try {
            // Import dynamically to avoid circular dependencies
            const { getExplorerTxUrl } = require('../../utils/chain.utils');
            return getExplorerTxUrl(transaction.fromAccount.network, transaction.transactionHash);
        } catch (e) {
            // Fallback for common explorers
            const network = transaction.fromAccount.network;
            if (network === '1') return `https://etherscan.io/tx/${transaction.transactionHash}`;
            if (network === '137') return `https://polygonscan.com/tx/${transaction.transactionHash}`;
            if (network === '42161') return `https://arbiscan.io/tx/${transaction.transactionHash}`;
        }
    }

    // Default fallback if we can't determine the explorer
    return `https://etherscan.io/tx/${transaction.transactionHash}`;
}



export { transactionDetailsScene }; 