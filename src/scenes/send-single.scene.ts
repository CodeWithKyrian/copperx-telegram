import { Scenes, Markup } from 'telegraf';
import { GlobalContext, GlobalSceneSession } from '../types/session.types';
import { transferService } from '../services/transfer.service';
import logger from '../utils/logger';
import { PurposeCode } from '../types/api.types';
import { isValidEmail, isValidWalletAddress } from '../utils/validators';
import { walletService } from '../services/wallet.service';
import { formatHumanAmount, formatPurposeCode, formatWalletBalance } from '../utils/formatters';
import { payeeService } from '../services/payee.service';
import { message } from 'telegraf/filters';

interface SendTransferSessionData extends GlobalSceneSession {
    currentStep?: string;
    recipientType?: 'email' | 'wallet' | 'payee';
    recipient?: string;
    amount?: string;
    purposeCode?: PurposeCode;
    walletId?: string;
    payeeId?: string;
}

export type SendTransferContext = GlobalContext<SendTransferSessionData>;

// Initialize purpose codes
const PURPOSE_CODES: PurposeCode[] = [
    'self', 'salary', 'gift', 'income', 'saving',
    'education_support', 'family', 'home_improvement', 'reimbursement'
];

// Create a base scene for the send transfer flow
const sendSingleScene = new Scenes.BaseScene<SendTransferContext>('send_single');

// Scene entry point
sendSingleScene.enter(async (ctx) => {
    // Reset scene session
    ctx.scene.session.currentStep = 'init';
    ctx.scene.session.recipientType = undefined;
    ctx.scene.session.recipient = undefined;
    ctx.scene.session.amount = undefined;
    ctx.scene.session.purposeCode = undefined;
    ctx.scene.session.walletId = undefined;
    ctx.scene.session.payeeId = undefined;

    const defaultWallet = await walletService.getDefaultWallet();

    if (!defaultWallet) {
        await ctx.reply(
            '❌ *No Default Wallet Set*\n\n' +
            'You need to set a default wallet before you can send funds.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔹 Set Default Wallet', 'set_default_wallet')],
                ])
            }
        );
        return ctx.scene.leave();
    }

    ctx.scene.session.walletId = defaultWallet.id;

    await ctx.reply(
        '💸 *Single Transfer*\n\n' +
        'Please select how you would like to send funds:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback('📧 Send to Email', 'recipient_type:email'),
                    Markup.button.callback('📝 Send to Wallet Address', 'recipient_type:wallet')
                ],
                [
                    Markup.button.callback('👤 Send to Saved Recipient', 'recipient_type:payee')
                ],
                [
                    Markup.button.callback('❌ Cancel', 'cancel')
                ]
            ])
        }
    );
});

// Handle recipient type selection
sendSingleScene.action(/recipient_type:(.+)/, async (ctx) => {
    const recipientType = ctx.match[1] as 'email' | 'wallet' | 'payee';
    ctx.scene.session.recipientType = recipientType;
    await ctx.answerCbQuery();

    if (recipientType === 'email') {
        ctx.scene.session.currentStep = 'enter_recipient';
        await ctx.reply(
            '📧 *Enter Recipient Email*\n\n' +
            'Please enter the email address of the person you want to send funds to:',
            { parse_mode: 'Markdown' }
        );
    } else if (recipientType === 'wallet') {
        ctx.scene.session.currentStep = 'enter_recipient';
        await ctx.reply(
            '📝 *Enter Wallet Address*\n\n' +
            'Please enter the wallet address you want to send funds to:',
            { parse_mode: 'Markdown' }
        );
    } else if (recipientType === 'payee') {
        await showPayeeList(ctx);
    }
});

// Function to display payee list
async function showPayeeList(ctx: SendTransferContext, page = 1) {
    try {
        const payees = await payeeService.getPayees(page, 10);

        if (!payees || !payees.data || payees.data.length === 0) {
            await ctx.reply(
                '❌ *No Saved Recipients*\n\n' +
                'You don\'t have any saved recipients yet. Please choose a different method or add a recipient first.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('➕ Add Recipient', 'add_payee')],
                        [Markup.button.callback('🔙 Back', 'back_to_recipient_type')]
                    ])
                }
            );
            return;
        }

        // Create buttons for payee selection, only passing the ID
        const payeeButtons = payees.data.map(payee =>
            [Markup.button.callback(`${payee.nickName} (${payee.email})`, `select_payee:${payee.id}`)]
        );

        // Add pagination if needed
        if (payees.hasMore) {
            payeeButtons.push([
                Markup.button.callback('⏩ More Recipients', `more_payees:${page + 1}`),
                Markup.button.callback('🔙 Back', 'back_to_recipient_type')
            ]);
        } else {
            payeeButtons.push([Markup.button.callback('🔙 Back', 'back_to_recipient_type')]);
        }

        await ctx.reply(
            '👤 *Select Recipient*\n\n' +
            'Please select a saved recipient to send funds to:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard(payeeButtons)
            }
        );
    } catch (error) {
        logger.error('Error fetching payees for selection', { error });
        await ctx.reply(
            '❌ *Error Retrieving Recipients*\n\n' +
            'We encountered an error retrieving your saved recipients. Please try again or choose a different method.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back', 'back_to_recipient_type')]
                ])
            }
        );
    }
}

// Handle pagination for payees
sendSingleScene.action(/more_payees:(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    await showPayeeList(ctx, page);
});

// Back to recipient type selection
sendSingleScene.action('back_to_recipient_type', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.scene.session.recipientType = undefined;
    ctx.scene.session.payeeId = undefined;

    // Re-enter the scene to start over
    await ctx.scene.enter('send_single');
});

// Handle payee selection
sendSingleScene.action(/select_payee:(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const payeeId = ctx.match[1];

    // Store only the payee ID
    ctx.scene.session.recipientType = 'payee';
    ctx.scene.session.payeeId = payeeId;

    try {
        // Fetch payee details from API
        const payee = await payeeService.getPayee(payeeId);

        if (!payee) {
            await ctx.reply('❌ *Payee Not Found*\n\n' +
                'We encountered an error processing your transfer. Please try again later.',
                { parse_mode: 'Markdown' }
            );
            return ctx.scene.leave();
        }

        // Get balance to display
        const balance = await walletService.getDefaultWalletBalance();
        const formattedBalance = balance ? formatWalletBalance(balance) : '0 USDC';

        ctx.scene.session.currentStep = 'enter_amount';

        // Ask for amount with payee details
        await ctx.reply(
            '💰 *Enter Transfer Amount*\n\n' +
            `Recipient: *${payee.nickName}* (${payee.email})\n` +
            `Your current balance: *${formattedBalance}*\n\n` +
            'Please enter the amount of USDC you want to transfer:',
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        logger.error('Error fetching payee details', { error, payeeId });
        await ctx.reply(
            '❌ *Error Retrieving Recipient*\n\n' +
            'We encountered an error retrieving the recipient details. Please try again.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back', 'back_to_recipient_type')]
                ])
            }
        );
    }
});

// Handle text input based on state
sendSingleScene.on(message('text'), async (ctx) => {
    const input = ctx.message.text.trim();

    // Handle cancel command anywhere in the flow
    if (input.toLowerCase() === '/cancel') {
        await ctx.reply('Transfer cancelled.');
        return ctx.scene.leave();
    }

    // Handle different states
    switch (ctx.scene.session.currentStep) {
        case 'enter_recipient':
            await handleRecipientInput(ctx, input);
            break;

        case 'enter_amount':
            await handleAmountInput(ctx, input);
            break;

        default:
            await ctx.reply(
                'Please select an option or use /cancel to exit.',
                Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            );
    }
});

// Function to handle recipient input
async function handleRecipientInput(ctx: SendTransferContext, input: string) {
    // Validate input based on recipient type
    if (ctx.scene.session.recipientType === 'email') {
        if (!isValidEmail(input)) {
            await ctx.reply(
                '❌ *Invalid Email Format*\n\n' +
                'Please enter a valid email address:',
                { parse_mode: 'Markdown' }
            );
            return;
        }
    } else if (ctx.scene.session.recipientType === 'wallet') {
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
    ctx.scene.session.currentStep = 'enter_amount';

    // Get balance to display
    const balance = await walletService.getDefaultWalletBalance();
    const formattedBalance = balance ? formatWalletBalance(balance) : '0 USDC';

    // Ask for amount
    await ctx.reply(
        '💰 *Enter Transfer Amount*\n\n' +
        `Your current balance: *${formattedBalance}*\n\n` +
        'Please enter the amount of USDC you want to transfer:',
        { parse_mode: 'Markdown' }
    );
}

// Function to handle amount input
async function handleAmountInput(ctx: SendTransferContext, input: string) {
    // Validate amount is a number
    const amount = parseFloat(input);
    if (isNaN(amount) || amount < 1) {
        await ctx.reply(
            '❌ *Invalid Amount*\n\n' +
            'Please enter a valid amount of at least 1 USDC:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            }
        );
        return;
    }

    // Store the amount
    ctx.scene.session.amount = input;
    ctx.scene.session.currentStep = 'select_purpose';

    await ctx.reply('🔄 Verifying available funds...');

    // Get balance to verify funds
    const balance = await walletService.getDefaultWalletBalance();

    if (balance && parseFloat(balance.balance) < amount) {
        await ctx.reply(
            '❌ *Insufficient Funds*\n\n' +
            `Your current balance is ${formatWalletBalance(balance)}, ` +
            `which is less than the requested withdrawal amount of ${formatHumanAmount(amount, 2)} ${balance.symbol}.\n\n` +
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
}

// Handle purpose selection
sendSingleScene.action(/purpose:(.+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const purposeCode = ctx.match[1] as PurposeCode;
    ctx.scene.session.purposeCode = purposeCode;
    ctx.scene.session.currentStep = 'confirm';

    let recipientText = '';

    if (ctx.scene.session.recipientType === 'payee' && ctx.scene.session.payeeId) {
        const payee = await payeeService.getPayee(ctx.scene.session.payeeId);
        recipientText = `*${payee!.nickName}* (${payee!.email})`;

    } else {
        const recipientType = ctx.scene.session.recipientType === 'email' ? 'Email' : 'Wallet';
        recipientText = `*${recipientType}:* ${ctx.scene.session.recipient}`;
    }

    // Show confirmation message
    await ctx.reply(
        '🔍 *Confirm Transfer*\n\n' +
        `*Recipient:* ${recipientText}\n` +
        `*Amount:* ${ctx.scene.session.amount} USDC\n` +
        `*Purpose:* ${formatPurposeCode(purposeCode)}\n\n` +
        'Please confirm this transfer:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Confirm', 'confirm')],
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        }
    );
});

// Handle transfer confirmation
sendSingleScene.action('confirm', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🔄 Processing your transfer...');

    try {
        let result;

        if (ctx.scene.session.recipientType === 'payee' && ctx.scene.session.payeeId) {
            result = await transferService.sendToPayee(
                ctx.scene.session.payeeId,
                ctx.scene.session.amount!,
                ctx.scene.session.purposeCode!
            );
        }
        else if (ctx.scene.session.recipientType === 'email') {
            result = await transferService.sendToEmail(
                ctx.scene.session.recipient!,
                ctx.scene.session.amount!,
                ctx.scene.session.purposeCode!
            );
        }
        else {
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
                    [Markup.button.callback('📋 View Transfer History', 'history')],
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );

        // Add payee saving prompt only for email transfers
        if (ctx.scene.session.recipientType === 'email') {
            const email = ctx.scene.session.recipient!;

            await ctx.reply(
                '💾 *Save Recipient*\n\n' +
                'Would you like to save this recipient for faster transfers in the future?',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('✅ Save Recipient', `save_payee:${email}`)],
                        [Markup.button.callback('❌ No Thanks', 'no_save_payee')]
                    ])
                }
            );
        }

        return ctx.scene.leave();

    } catch (error) {
        logger.error('Error processing transfer', {
            error,
            recipientType: ctx.scene.session.recipientType,
            recipient: ctx.scene.session.recipient || ctx.scene.session.payeeId
        });

        await ctx.reply(
            '❌ *Transfer Failed*\n\n' +
            'We encountered an error processing your transfer. Please try again later.',
            { parse_mode: 'Markdown' }
        );
        return ctx.scene.leave();
    }
});

// Cancel action handler
sendSingleScene.action('cancel', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Transfer cancelled.');
    return ctx.scene.leave();
});

// Cancel command handler
sendSingleScene.command('cancel', async (ctx) => {
    await ctx.reply('Transfer cancelled.');
    return ctx.scene.leave();
});

export { sendSingleScene }; 