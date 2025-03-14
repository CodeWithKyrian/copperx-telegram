import { Markup } from 'telegraf';
import { GlobalContext } from '../types';
import { transactionService } from '../services/transaction.service';
import logger from '../utils/logger';
import { GetTransactionsParams } from '../api/transaction.api';

/**
 * Handles the /transactions command to view transaction history
 */
export const transactionsCommand = async (ctx: GlobalContext): Promise<void> => {
    try {
        await ctx.reply('🔍 Fetching your recent transactions...');

        // Start with page 1, 5 transactions per page
        const params: GetTransactionsParams = { page: 1, limit: 5 };

        // Fetch first page of transactions
        const response = await transactionService.getTransactions(params);

        if (!response || !response.data || response.data.length === 0) {
            await ctx.reply(
                '📭 *No Transactions Found*\n\n' +
                'You don\'t have any transactions yet. Once you make deposits, transfers, or withdrawals, they will appear here.',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // Store pagination info in session for later navigation
        if (!ctx.session.transactions) {
            ctx.session.transactions = {};
        }
        ctx.session.transactions.currentPage = 1;
        ctx.session.transactions.totalPages = Math.ceil(response.count / params.limit!);
        ctx.session.transactions.limit = params.limit;

        // Format the transactions list
        const message = formatTransactionListMessage(response.data, ctx.session.transactions.currentPage, ctx.session.transactions.totalPages);

        // Create navigation buttons
        const keyboard = createPaginationKeyboard(1, ctx.session.transactions.totalPages);

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...keyboard
        });

    } catch (error) {
        logger.error('Error in transactions command', { error });
        await ctx.reply(
            '❌ *Error Retrieving Transactions*\n\n' +
            'We encountered an error while retrieving your transaction history. Please try again later.',
            { parse_mode: 'Markdown' }
        );
    }
};

/**
 * Handles the action to view the next page of transactions
 */
export async function transactionHistoryAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await transactionsCommand(ctx);
}

/**
 * Handles the action to view the next page of transactions
 */
export const transactionNextPageAction = async (ctx: GlobalContext): Promise<void> => {
    try {
        await ctx.answerCbQuery();

        if (!ctx.session.transactions || !ctx.session.transactions.currentPage) {
            await ctx.reply('Session expired. Please run /transactions again.');
            return;
        }

        const nextPage = ctx.session.transactions.currentPage + 1;
        const limit = ctx.session.transactions.limit || 5;

        // Fetch next page of transactions
        const params: GetTransactionsParams = { page: nextPage, limit };
        const response = await transactionService.getTransactions(params);

        if (!response || !response.data || response.data.length === 0) {
            await ctx.answerCbQuery('No more transactions to display');
            return;
        }

        // Update session
        ctx.session.transactions.currentPage = nextPage;

        // Format and send message
        const message = formatTransactionListMessage(response.data, nextPage, ctx.session.transactions.totalPages || 0);
        const keyboard = createPaginationKeyboard(nextPage, ctx.session.transactions.totalPages || 0);

        // Edit the message instead of sending a new one
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...keyboard
        });

    } catch (error) {
        logger.error('Error handling next page', { error });
        await ctx.answerCbQuery('Error loading next page');
    }
};

/**
 * Handles the action to view the previous page of transactions
 */
export const transactionPrevPageAction = async (ctx: GlobalContext): Promise<void> => {
    try {
        await ctx.answerCbQuery();

        if (!ctx.session.transactions || !ctx.session.transactions.currentPage) {
            await ctx.reply('Session expired. Please run /transactions again.');
            return;
        }

        const prevPage = Math.max(1, ctx.session.transactions.currentPage - 1);
        const limit = ctx.session.transactions.limit || 5;

        // Fetch previous page of transactions
        const params: GetTransactionsParams = { page: prevPage, limit };
        const response = await transactionService.getTransactions(params);

        if (!response || !response.data) {
            await ctx.answerCbQuery('Error loading previous page');
            return;
        }

        // Update session
        ctx.session.transactions.currentPage = prevPage;

        // Format and send message
        const message = formatTransactionListMessage(response.data, prevPage, ctx.session.transactions.totalPages || 0);
        const keyboard = createPaginationKeyboard(prevPage, ctx.session.transactions.totalPages || 0);

        // Edit the message instead of sending a new one
        await ctx.editMessageText(message, {
            parse_mode: 'Markdown',
            ...keyboard
        });

    } catch (error) {
        logger.error('Error handling previous page', { error });
        await ctx.answerCbQuery('Error loading previous page');
    }
};

/**
 * Handles the action to view transaction details
 */
export const transactionViewDetailsAction = async (ctx: GlobalContext): Promise<void> => {
    try {
        await ctx.answerCbQuery();

        // Ask user to enter transaction ID
        await ctx.reply(
            '🔍 *View Transaction Details*\n\n' +
            'Please enter the transaction ID from the list:',
            { parse_mode: 'Markdown' }
        );

        // Enter scene to handle the input
        await ctx.scene.enter('transaction_details');

    } catch (error) {
        logger.error('Error handling view transaction details', { error });
        await ctx.answerCbQuery('Error processing request');
    }
};

/**
 * Formats a message showing the list of transactions with pagination info
 */
function formatTransactionListMessage(transactions: any[], currentPage: number, totalPages: number): string {
    let message = `📋 *Your Transaction History* (Page ${currentPage}/${totalPages})\n\n`;

    message += transactionService.formatTransactionsList(transactions);

    message += '\n\n*Tip:* Select a transaction number to view more details, or use the navigation buttons to browse more transactions.';

    return message;
}

/**
 * Creates a keyboard with pagination navigation buttons
 */
function createPaginationKeyboard(currentPage: number, totalPages: number) {
    const buttons = [];

    // Add page navigation
    const navigationRow = [];

    if (currentPage > 1) {
        navigationRow.push(Markup.button.callback('◀️ Previous', 'tx_prev_page'));
    }

    if (currentPage < totalPages) {
        navigationRow.push(Markup.button.callback('▶️ Next', 'tx_next_page'));
    }

    if (navigationRow.length > 0) {
        buttons.push(navigationRow);
    }

    // Add transaction selection buttons
    buttons.push([Markup.button.callback('🔍 View Transaction Details', 'tx_view_details')]);

    return Markup.inlineKeyboard(buttons);
}





