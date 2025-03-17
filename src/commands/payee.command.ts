import { Markup } from 'telegraf';
import { GlobalContext } from '../types';
import { payeeService } from '../services/payee.service';
import logger from '../utils/logger';

/**
 * Handles the /payees command to list saved recipients
 */
export const payeesCommand = async (ctx: GlobalContext): Promise<void> => {
    try {
        await ctx.reply('🔍 Fetching your saved recipients...');

        // Get the first page of payees using your existing service
        const response = await payeeService.getPayees(1, 10);

        if (!response || !response.data || response.data.length === 0) {
            await ctx.reply(
                '📭 *No Saved Recipients*\n\n' +
                'You haven\'t saved any recipients yet. Add a recipient to quickly send funds in the future.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('➕ Add Recipient', 'add_payee')],
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                    ])
                }
            );
            return;
        }

        // Format payee list using your existing service
        const message = '👥 *Your Saved Recipients*\n\n' + formatDetailedPayeeList(response.data);

        // Create send buttons for each payee
        const buttons = [];

        // Add pagination buttons if needed
        if (response.hasMore) {
            buttons.push([
                Markup.button.callback('⏩ Next Page', `payees_page:2`)
            ]);
        }

        // Add new recipient and back buttons
        buttons.push([Markup.button.callback('➕ Add New Recipient', 'add_payee')]);
        buttons.push([Markup.button.callback('🗑️ Remove Recipient', 'remove_payee')]);
        buttons.push([Markup.button.callback('🔙 Back to Menu', 'main_menu')]);

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        });

    } catch (error) {
        logger.error('Error in payees command', { error });
        await ctx.reply(
            '❌ *Error Retrieving Recipients*\n\n' +
            'We encountered an error while retrieving your saved recipients. Please try again later.',
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
            await ctx.reply('No recipients found on this page.');
            return;
        }

        // Format payee list
        const message = `👥 *Your Saved Recipients (Page ${page})*\n\n` +
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

        // Add new recipient and back buttons
        buttons.push([Markup.button.callback('➕ Add New Recipient', 'add_payee')]);
        buttons.push([Markup.button.callback('🗑️ Remove Recipient', 'remove_payee')]);
        buttons.push([Markup.button.callback('🔙 Back to Menu', 'main_menu')]);

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        });

    } catch (error) {
        logger.error('Error in payees pagination', { error, page });
        await ctx.reply(
            '❌ *Error Retrieving Recipients*\n\n' +
            'We encountered an error while retrieving your saved recipients. Please try again later.',
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
    }

    // @ts-ignore
    ctx.scene.state.email = email;
    await ctx.scene.enter('create_payee');
}


export async function noSavePayeeAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.reply('👍 No problem! You can add recipients later using the /payees command.');
}

function formatDetailedPayeeList(payees: any[]): string {
    if (!payees || payees.length === 0) {
        return 'You don\'t have any saved recipients yet.';
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