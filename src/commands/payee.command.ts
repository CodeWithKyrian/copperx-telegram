import { Markup } from 'telegraf';
import { GlobalContext } from '../types';
import { payeeService } from '../services/payee.service';
import logger from '../utils/logger.utils';

/**
 * Handles the /payees command to list saved payees
 */
export const payeesCommand = async (ctx: GlobalContext): Promise<void> => {
    try {
        await ctx.reply('🔍 Fetching your saved payees...');

        // Get the first page of payees using your existing service
        const response = await payeeService.getPayees(1, 10);

        if (!response || !response.data || response.data.length === 0) {
            await ctx.reply(
                '📭 *No Saved Payees*\n\n' +
                'You haven\'t saved any payees yet. Add a payee to quickly send funds in the future.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('➕ Add Payee', 'add_payee')],
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                    ])
                }
            );
            return;
        }

        // Format payee list using your existing service
        const message = '👥 *Your Saved Payees*\n\n' + formatDetailedPayeeList(response.data);

        // Create send buttons for each payee
        const buttons = [];

        // Add pagination buttons if needed
        if (response.hasMore) {
            buttons.push([
                Markup.button.callback('⏩ Next Page', `payees_page:2`)
            ]);
        }

        // Add new payee and back buttons
        buttons.push([Markup.button.callback('➕ Add New Payee', 'add_payee')]);
        buttons.push([Markup.button.callback('🗑️ Remove Payee', 'remove_payee')]);
        buttons.push([Markup.button.callback('🔙 Back to Menu', 'main_menu')]);

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        });

    } catch (error) {
        logger.error({ error }, 'Error in payees command');
        await ctx.reply(
            '❌ *Error Retrieving Payees*\n\n' +
            'We encountered an error while retrieving your saved payees. Please try again later.',
            { parse_mode: 'Markdown' }
        );
    }
};

/**
 * Action handler for viewing payees list
 */
export async function listPayeesAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await payeesCommand(ctx);
}

/**
 * Action handler for paginating payees
 */
export async function payeesPageAction(ctx: GlobalContext & { match: RegExpExecArray }) {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);

    try {
        const response = await payeeService.getPayees(page, 10);

        if (!response || !response.data || response.data.length === 0) {
            await ctx.reply('No payees found on this page.');
            return;
        }

        // Format payee list
        const message = `👥 *Your Saved Payees (Page ${page})*\n\n` +
            formatDetailedPayeeList(response.data);

        // Create buttons for each payee
        const buttons = [];

        // Add pagination buttons
        const paginationButtons = [];
        if (page > 1) {
            paginationButtons.push(Markup.button.callback('⏪ Previous', `payees_page:${page - 1}`));
        }
        if (response.hasMore) {
            paginationButtons.push(Markup.button.callback('⏩ Next', `payees_page:${page + 1}`));
        }

        if (paginationButtons.length > 0) {
            buttons.push(paginationButtons);
        }

        // Add new payee and back buttons
        buttons.push([Markup.button.callback('➕ Add New Payee', 'add_payee')]);
        buttons.push([Markup.button.callback('🗑️ Remove Payee', 'remove_payee')]);
        buttons.push([Markup.button.callback('🔙 Back to Menu', 'main_menu')]);

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        });

    } catch (error) {
        logger.error({ error, page }, 'Error in payees pagination');
        await ctx.reply(
            '❌ *Error Retrieving Payees*\n\n' +
            'We encountered an error while retrieving your saved payees. Please try again later.',
            { parse_mode: 'Markdown' }
        );
    }
}


export async function addPayeeAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('create_payee');
}

export async function removePayeeAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('remove_payee');
}

export async function savePayeeAction(ctx: GlobalContext & { match: RegExpExecArray }) {
    await ctx.answerCbQuery();
    const email = ctx.match[1];

    if (!email) {
        await ctx.reply('❌ Error: No email address provided.');
        return;
    }

    // Initialize scene state if it doesn't exist
    if (!ctx.scene.state) {
        ctx.scene.state = {};
    }

    (ctx.scene.state as { email: string }).email = email;
    await ctx.scene.enter('create_payee');
}


export async function noSavePayeeAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.reply('👍 No problem! You can add payees later using the /payees command.');
}

function formatDetailedPayeeList(payees: any[]): string {
    if (!payees || payees.length === 0) {
        return 'You don\'t have any saved payees yet.';
    }

    let message = '';
    payees.forEach((payee, index) => {
        message += `*${index + 1}. ${payee.nickName}*\n`;
        message += `   📝 ID: \`${payee.id}\`\n`;
        message += `   📧 Email: ${payee.email}\n`;

        // Show name if available
        if (payee.firstName || payee.lastName) {
            const name = [payee.firstName, payee.lastName].filter(Boolean).join(' ');
            message += `   👤 Name: ${name}\n`;
        }

        // If there's a display name different from nickname, show it
        if (payee.displayName && payee.displayName !== payee.nickName) {
            message += `   🏷️ Display Name: ${payee.displayName}\n`;
        }

        // Show bank account info if available
        if (payee.hasBankAccount) {
            message += `   🏦 Has Bank Account: Yes\n`;
        }

        message += '\n';
    });

    return message;
}