import { Scenes, Markup } from 'telegraf';
import { GlobalContext, GlobalSceneSession } from '../types/session.types';
import { transferService } from '../services/transfer.service';
import logger from '../utils/logger';
import { PurposeCode } from '../types/api.types';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { isValidEmail, isValidWalletAddress } from '../utils/validators';
import { walletService } from '../services/wallet.service';
import { formatPurposeCode } from '../utils/formatters';

interface SendTransferSessionData extends GlobalSceneSession {
    recipientType?: 'email' | 'wallet';
    recipient?: string;
    amount?: string;
    purposeCode?: PurposeCode;
    walletId?: string;
}

export type SendTransferContext = GlobalContext<SendTransferSessionData>;

// Initialize purpose codes
const PURPOSE_CODES: PurposeCode[] = [
    'self', 'salary', 'gift', 'income', 'saving',
    'education_support', 'family', 'home_improvement', 'reimbursement'
];


// Create a wizard scene for the send transfer flow
const transferScene = new Scenes.WizardScene<SendTransferContext>(
    'transfer',

    // Step 1: Choose recipient type (email or wallet address)
    async (ctx) => {
        // Reset scene session
        ctx.scene.session.recipientType = undefined;
        ctx.scene.session.recipient = undefined;
        ctx.scene.session.amount = undefined;
        ctx.scene.session.purposeCode = undefined;

        await ctx.reply(
            '💸 *Transfer Funds*\n\n' +
            'Please select how you would like to transfer funds:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback('📧 Send to Email', 'recipient_type:email'),
                        Markup.button.callback('📝 Send to Wallet Address', 'recipient_type:wallet')
                    ],
                    [
                        Markup.button.callback('❌ Cancel', 'cancel')
                    ]
                ])
            }
        );

        return ctx.wizard.next();
    },

    // Step 2: Handle recipient type selection and ask for recipient
    async (ctx) => {
        // Check for callback query data
        if ('callback_query' in ctx.update) {
            const callbackQuery = ctx.update.callback_query as CallbackQuery.DataQuery;
            const callbackData = callbackQuery.data;

            if (callbackData === 'cancel') {
                await ctx.answerCbQuery();
                await ctx.reply('Transfer cancelled.');
                return ctx.scene.leave();
            }

            if (callbackData.startsWith('recipient_type:')) {
                const recipientType = callbackData.split(':')[1] as 'email' | 'wallet';
                ctx.scene.session.recipientType = recipientType;
                await ctx.answerCbQuery();

                if (recipientType === 'email') {
                    await ctx.reply(
                        '📧 *Enter Recipient Email*\n\n' +
                        'Please enter the email address of the person you want to transfer funds to:',
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    await ctx.reply(
                        '📝 *Enter Wallet Address*\n\n' +
                        'Please enter the wallet address you want to transfer funds to:',
                        { parse_mode: 'Markdown' }
                    );
                }

                return ctx.wizard.next();
            }
        }

        // If we get here, something unexpected happened
        await ctx.reply(
            'Please select an option from the buttons above or type /cancel to exit.',
            Markup.inlineKeyboard([
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        );
    },

    // Step 3: Collect recipient and ask for amount
    async (ctx) => {
        // Ensure we have text input
        if (!ctx.message || !('text' in ctx.message)) {
            await ctx.reply('Please enter a valid recipient or type /cancel to exit.');
            return;
        }

        const input = ctx.message.text.trim();

        // Validate input based on recipient type
        if (ctx.scene.session.recipientType === 'email') {
            if (!isValidEmail(input)) {
                await ctx.reply(
                    '❌ *Invalid Email Format*\n\n' +
                    'Please enter a valid email address:',
                    { parse_mode: 'Markdown' }
                );
            }
        } else {
            if (!isValidWalletAddress(input)) {
                await ctx.reply(
                    '❌ *Invalid Wallet Address*\n\n' +
                    'Please enter a valid wallet address:',
                    { parse_mode: 'Markdown' }
                );
                return;
            }
        }

        // Store the recipient
        ctx.scene.session.recipient = input;

        // Ask for amount
        await ctx.reply(
            '💰 *Enter Amount*\n\n' +
            'Please enter the amount of USDC you want to transfer:',
            { parse_mode: 'Markdown' }
        );

        return ctx.wizard.next();
    },

    // Step 4: Collect amount and ask for purpose
    async (ctx) => {
        // Ensure we have text input
        if (!ctx.message || !('text' in ctx.message)) {
            await ctx.reply('Please enter a valid amount or type /cancel to exit.');
            return;
        }

        const input = ctx.message.text.trim();

        // Validate amount is a number
        const amount = parseFloat(input);
        if (isNaN(amount) || amount <= 0) {
            await ctx.reply(
                '❌ *Invalid Amount*\n\n' +
                'Please enter a valid amount greater than 0:',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // Store the amount
        ctx.scene.session.amount = input;

        // Get balance to verify funds
        const balance = await walletService.getTotalBalance();

        if (balance && parseFloat(balance.balance) < amount) {
            await ctx.reply(
                '❌ *Insufficient Funds*\n\n' +
                `Your current balance is ${balance.balance} ${balance.symbol}, ` +
                `which is less than the requested withdrawal amount of ${amount} ${balance.symbol}. ` +
                'Please enter a smaller amount or deposit more funds.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('❌ Cancel', 'cancel')]
                    ])
                }
            );
            return;
        }

        // Create buttons for purpose codes (in rows of 2)
        const purposeButtons = PURPOSE_CODES.map(code =>
            Markup.button.callback(formatPurposeCode(code), `purpose:${code}`)
        );

        const buttonRows = [];
        for (let i = 0; i < purposeButtons.length; i += 2) {
            buttonRows.push(purposeButtons.slice(i, i + 2));
        }

        // Ask for purpose
        await ctx.reply(
            '🔍 *Select Purpose*\n\n' +
            'Please select the purpose of this transfer:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    ...buttonRows,
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            }
        );

        return ctx.wizard.next();
    },

    // Step 5: Collect purpose and show confirmation
    async (ctx) => {
        // Check for callback query data
        if ('callback_query' in ctx.update) {
            const callbackQuery = ctx.update.callback_query as CallbackQuery.DataQuery;
            const callbackData = callbackQuery.data;

            if (callbackData === 'cancel') {
                await ctx.answerCbQuery();
                await ctx.reply('Transfer cancelled.');
                return ctx.scene.leave();
            }

            if (callbackData.startsWith('purpose:')) {
                const purposeCode = callbackData.split(':')[1] as PurposeCode;
                ctx.scene.session.purposeCode = purposeCode;
                await ctx.answerCbQuery();

                // Show confirmation message
                const recipientType = ctx.scene.session.recipientType === 'email' ? 'Email' : 'Wallet';
                const recipient = ctx.scene.session.recipient;
                const amount = ctx.scene.session.amount;
                const purpose = formatPurposeCode(purposeCode);

                await ctx.reply(
                    '🔍 *Confirm Transfer*\n\n' +
                    `*Recipient Type:* ${recipientType}\n` +
                    `*Recipient:* ${recipient}\n` +
                    `*Amount:* ${amount} USDC\n` +
                    `*Purpose:* ${purpose}\n\n` +
                    'Please confirm this transfer:',
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('✅ Confirm', 'confirm')],
                            [Markup.button.callback('❌ Cancel', 'cancel')]
                        ])
                    }
                );

                return ctx.wizard.next();
            }
        }

        // If we get here, something unexpected happened
        await ctx.reply(
            'Please select a purpose from the buttons above or type /cancel to exit.',
            Markup.inlineKeyboard([
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        );
    },

    // Step 6: Process confirmation and execute transfer
    async (ctx) => {
        // Check for callback query data
        if ('callback_query' in ctx.update) {
            const callbackQuery = ctx.update.callback_query as CallbackQuery.DataQuery;
            const callbackData = callbackQuery.data;

            if (callbackData === 'cancel') {
                await ctx.answerCbQuery();
                await ctx.reply('Transfer cancelled.');
                return ctx.scene.leave();
            }

            if (callbackData === 'confirm') {
                await ctx.answerCbQuery();
                await ctx.reply('🔄 Processing your transfer...');

                try {
                    // Execute the transfer based on recipient type
                    let result;

                    if (ctx.scene.session.recipientType === 'email') {
                        result = await transferService.sendToEmail(
                            ctx.scene.session.recipient!,
                            ctx.scene.session.amount!,
                            ctx.scene.session.purposeCode!
                        );
                    } else {
                        result = await transferService.sendToWallet(
                            ctx.scene.session.recipient!,
                            ctx.scene.session.amount!,
                            ctx.scene.session.purposeCode!
                        );
                    }

                    if (!result) {
                        await ctx.reply(
                            '❌ *Transfer Failed*\n\n' +
                            'We encountered an error processing your transfer. Please try again later.',
                            { parse_mode: 'Markdown' }
                        );
                        return ctx.scene.leave();
                    }

                    // Format and show the transfer details
                    const transferDetails = transferService.formatTransfer(result);

                    await ctx.reply(
                        '✅ *Transfer Initiated*\n\n' +
                        transferDetails,
                        {
                            parse_mode: 'Markdown',
                            ...Markup.inlineKeyboard([
                                [Markup.button.callback('📋 View Transfer History', 'transfer_history')],
                                [Markup.button.callback('💼 Back to Wallet', 'view_wallets')]
                            ])
                        }
                    );

                    return ctx.scene.leave();

                } catch (error) {
                    logger.error('Error processing transfer', {
                        error,
                        recipientType: ctx.scene.session.recipientType,
                        recipient: ctx.scene.session.recipient,
                        amount: ctx.scene.session.amount
                    });

                    await ctx.reply(
                        '❌ *Transfer Failed*\n\n' +
                        'We encountered an error processing your transfer. Please try again later.',
                        { parse_mode: 'Markdown' }
                    );
                    return ctx.scene.leave();
                }
            }
        }

        // If we get here, something unexpected happened
        await ctx.reply(
            'Please confirm or cancel the transfer using the buttons above.',
            Markup.inlineKeyboard([
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        );
    }
);

// Add action handlers for cancel operation
transferScene.action('cancel', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Transfer cancelled.');
    return ctx.scene.leave();
});

// Handle command to exit the scene
transferScene.command('cancel', async (ctx) => {
    await ctx.reply('Transfer cancelled.');
    return ctx.scene.leave();
});

export { transferScene }; 