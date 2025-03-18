import { GlobalContext } from '../types/session.types';
import { depositCommand } from '../commands/deposit.command';
import { showMainMenu } from '../commands/start.command';
import logger from '../utils/logger.utils';
import { Message } from 'telegraf/typings/core/types/typegram';
import { walletCommand } from './wallet.command';
import { withdrawCommand } from './withdraw.command';

export async function handleNaturalLanguage(ctx: GlobalContext & { message: Message.TextMessage }) {
    try {
        const text = ctx.message.text.toLowerCase();

        // Balance queries
        if (/balance|wallet|funds|how much/i.test(text)) {
            return await walletCommand(ctx);
        }

        // Send money patterns
        if (/send|transfer|pay|payment/i.test(text)) {
            // Extract potential amount and recipient
            const amountMatch = text.match(/\$?(\d+(\.\d+)?)/);
            const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);

            if (amountMatch || emailMatch) {
                await ctx.reply(
                    '💸 *I see you want to send money*\n\n' +
                    `${amountMatch ? `Amount: $${amountMatch[1]}\n` : ''}` +
                    `${emailMatch ? `Recipient: ${emailMatch[1]}\n\n` : '\n'}` +
                    'Would you like to start a transfer?',
                    {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [
                                [{ text: '✅ Yes, send money', callback_data: 'send_funds' }],
                                [{ text: '❌ No, cancel', callback_data: 'cancel' }]
                            ]
                        }
                    }
                );
                return;
            }

            await ctx.reply(
                '💸 *I see you want to send money*\n\n' +
                'Would you like to start a transfer?',
                {
                    parse_mode: 'Markdown',
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: '✅ Yes, send money', callback_data: 'send_funds' }],
                            [{ text: '❌ No, cancel', callback_data: 'cancel' }]
                        ]
                    }
                }
            );
            return;
        }

        // Deposit patterns
        if (/deposit|add money|add funds|top up/i.test(text)) {
            return await depositCommand(ctx);
        }

        // Withdraw patterns
        if (/withdraw|withdraw funds|withdraw money|withdraw to bank|withdraw to account/i.test(text)) {
            return await withdrawCommand(ctx);
        }

        // Help patterns
        if (/help|how to|how do|support|guide/i.test(text)) {
            await ctx.reply(
                '❓ *Need some help?*\n\n' +
                'Here are some things you can ask me about:\n' +
                '• Checking your balance\n' +
                '• Sending money to someone\n' +
                '• Depositing funds\n' +
                '• Withdrawing to your bank\n\n' +
                'Or you can use the menu below:',
                {
                    parse_mode: 'Markdown'
                }
            );
            return await showMainMenu(ctx);
        }

        // Unknown intent - provide helpful response
        await ctx.reply(
            "I'm not sure what you're asking for. Here are some things I can help with:",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '💼 Check Balance', callback_data: 'view_wallets' },
                            { text: '💸 Send Money', callback_data: 'send_funds' }
                        ],
                        [
                            { text: '📥 Deposit', callback_data: 'deposit_funds' },
                            { text: '📤 Withdraw', callback_data: 'withdraw_funds' }
                        ],
                        [
                            { text: '📜 Transaction History', callback_data: 'history' },
                            { text: '❓ Help', callback_data: 'help' }
                        ]
                    ]
                }
            }
        );

    } catch (error) {
        logger.error('Error handling natural language input', { error });
        await ctx.reply('Sorry, I had trouble understanding that. Please try using the menu options.');
        return await showMainMenu(ctx);
    }
}