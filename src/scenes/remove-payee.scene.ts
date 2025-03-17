import { Scenes, Markup } from 'telegraf';
import { GlobalContext } from '../types';
import { payeeService } from '../services/payee.service';
import logger from '../utils/logger';
import { message } from 'telegraf/filters';

// Create a base scene for payee removal
const removePayeeScene = new Scenes.BaseScene<GlobalContext>('remove_payee');

// Enter handler
removePayeeScene.enter(async (ctx) => {
    try {
        // Get the first page of payees to show what's available
        const response = await payeeService.getPayees(1, 10);

        if (!response || !response.data || response.data.length === 0) {
            await ctx.reply(
                '📭 *No Recipients to Remove*\n\n' +
                'You don\'t have any saved recipients to remove.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('👥 View Recipients', 'list_payees')]
                    ])
                }
            );
            return ctx.scene.leave();
        }

        // Format available payees for reference
        let message = '🗑️ *Remove Recipient*\n\n';
        message += 'Available recipients:\n\n';

        response.data.forEach((payee, index) => {
            message += `${index + 1}. ${payee.nickName} - ID: \`${payee.id}\`\n`;
            message += `   📧 ${payee.email}\n\n`;
        });

        message += 'Please enter the ID of the recipient you want to remove:';

        await ctx.reply(message, {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('❌ Cancel', 'cancel_remove')]
            ])
        });

    } catch (error) {
        logger.error('Error fetching payees for removal', { error });
        await ctx.reply(
            '❌ *Error Retrieving Recipients*\n\n' +
            'We encountered an error while retrieving your saved recipients. Please try again later.',
            { parse_mode: 'Markdown' }
        );
        return ctx.scene.leave();
    }
});

// Handle text messages (payee ID input)
removePayeeScene.on(message('text'), async (ctx) => {
    const payeeId = ctx.message.text.trim();

    if (!payeeId) {
        await ctx.reply(
            '❌ *Invalid Input*\n\n' +
            'Please enter a valid recipient ID or type /cancel to exit.',
            { parse_mode: 'Markdown' }
        );
        return;
    }

    try {
        // First, try to get the payee to confirm it exists
        const payee = await payeeService.getPayee(payeeId);

        if (!payee) {
            await ctx.reply(
                '❌ *Recipient Not Found*\n\n' +
                'The recipient ID you entered was not found. Please check the ID and try again.',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // Show confirmation
        await ctx.reply(
            '⚠️ *Confirm Removal*\n\n' +
            `Are you sure you want to remove this recipient?\n\n` +
            `*Nickname:* ${payee.nickName}\n` +
            `*Email:* ${payee.email}\n\n` +
            'This action cannot be undone.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('✅ Yes, Remove', `confirm_remove:${payeeId}`),
                        Markup.button.callback('❌ Cancel', 'cancel_remove')
                    ]
                ])
            }
        );

    } catch (error) {
        logger.error('Error fetching payee for removal', { error, payeeId });
        await ctx.reply(
            '❌ *Error Finding Recipient*\n\n' +
            'We encountered an error while finding this recipient. Please try again later.',
            { parse_mode: 'Markdown' }
        );
    }
});

// Handle confirmation of removal
removePayeeScene.action(/confirm_remove:(.+)/, async (ctx) => {
    await ctx.answerCbQuery();

    const payeeId = ctx.match[1];

    try {
        await ctx.reply('🔄 Removing recipient...');

        const success = await payeeService.deletePayee(payeeId);

        if (success) {
            await ctx.reply(
                '✅ *Recipient Removed Successfully*\n\n' +
                'The recipient has been removed from your saved recipients list.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('👥 View Recipients', 'list_payees')],
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                    ])
                }
            );
        } else {
            await ctx.reply(
                '❌ *Failed to Remove Recipient*\n\n' +
                'We encountered an error while removing this recipient. Please try again later.',
                { parse_mode: 'Markdown' }
            );
        }

        return ctx.scene.leave();

    } catch (error) {
        logger.error('Error removing payee', { error, payeeId });
        await ctx.reply(
            '❌ *Failed to Remove Recipient*\n\n' +
            'We encountered an error while removing this recipient. Please try again later.',
            { parse_mode: 'Markdown' }
        );
        return ctx.scene.leave();
    }
});

// Handle cancel action
removePayeeScene.action('cancel_remove', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Recipient removal cancelled.');
    return ctx.scene.leave();
});

// Handle cancel command
removePayeeScene.command('cancel', async (ctx) => {
    await ctx.reply('Recipient removal cancelled.');
    return ctx.scene.leave();
});

export { removePayeeScene }; 