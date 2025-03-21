import { Markup, Scenes } from 'telegraf';
import { CreateSendTransferBatchSingleRequest, PurposeCode } from '../types/api.types';
import { GlobalContext, GlobalSceneSession } from '../types/session.types';
import { formatHumanAmount, formatPurposeCode, formatWalletAddress, formatWalletBalance, toRawAmount } from '../utils/formatters.utils';
import logger from '../utils/logger.utils';
import { walletService } from '../services/wallet.service';
import { transferService } from '../services/transfer.service';
import { payeeService } from '../services/payee.service';
import { isValidEmail, isValidWalletAddress } from '../utils/validators';
import { message } from 'telegraf/filters';

interface Recipient {
    type: 'email' | 'wallet' | 'payee';
    value: string;
    amount: string;
    payeeId?: string;
    payeeName?: string;
}

interface SendBatchSessionData extends GlobalSceneSession {
    currentStep?: 'value' | 'amount';
    recipients: Recipient[];
    purposeCode?: PurposeCode;
    totalAmount: number;
    addingRecipient?: boolean;
    removingRecipient?: boolean;
    currentRecipient?: {
        type?: 'email' | 'wallet' | 'payee';
        value?: string;
        payeeId?: string;
        payeeName?: string;
    };
}

export type SendBatchContext = GlobalContext<SendBatchSessionData>;

const PURPOSE_CODES: PurposeCode[] = [
    'self', 'salary', 'gift', 'income', 'saving',
    'education_support', 'family', 'home_improvement', 'reimbursement'
];

const sendBatchScene = new Scenes.BaseScene<SendBatchContext>('send_batch');

sendBatchScene.enter(async (ctx) => {
    // Reset session data
    ctx.scene.session.recipients = [];
    ctx.scene.session.purposeCode = undefined;
    ctx.scene.session.totalAmount = 0;
    ctx.scene.session.addingRecipient = false;
    ctx.scene.session.removingRecipient = false;
    ctx.scene.session.currentStep = undefined;
    ctx.scene.session.currentRecipient = undefined;

    await promptAddRecipient(ctx);
});

// Function to prompt for adding a recipient
async function promptAddRecipient(ctx: SendBatchContext): Promise<void> {
    ctx.scene.session.addingRecipient = true;
    ctx.scene.session.currentStep = 'value';
    ctx.scene.session.currentRecipient = {};

    await ctx.reply(
        '➕ *Add Recipient*\n\n' +
        'Please select the recipient type:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback('📧 Email Address', 'recipient_type:email'),
                    Markup.button.callback('📝 Wallet Address', 'recipient_type:wallet')
                ],
                [
                    Markup.button.callback('👤 Saved Payee', 'recipient_type:payee')
                ],
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        }
    );
}

// Handle adding new recipient - Select type
sendBatchScene.action('add_recipient', async (ctx) => {
    await ctx.answerCbQuery();
    await promptAddRecipient(ctx);
});

sendBatchScene.action(/recipient_type:(.+)/, async (ctx) => {
    await ctx.answerCbQuery();

    const type = ctx.match[1] as 'email' | 'wallet' | 'payee';
    ctx.scene.session.currentRecipient!.type = type;

    if (type === 'payee') {
        await showPayeeList(ctx);
        return;
    }

    const promptText = type === 'email'
        ? '📧 *Enter Recipient Email*\n\nPlease enter the email address:'
        : '📝 *Enter Wallet Address*\n\nPlease enter the wallet address:';

    await ctx.reply(promptText, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back', 'back_to_type_selection')]
        ])
    });
});

// Function to display payee list
async function showPayeeList(ctx: SendBatchContext, page = 1) {
    try {
        const payees = await payeeService.getPayees(page, 10);

        if (!payees || !payees.data || payees.data.length === 0) {
            await ctx.reply(
                '❌ *No Saved Recipients*\n\n' +
                'You don\'t have any saved recipients yet. Please choose a different method or add a recipient first.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back', 'back_to_type_selection')],
                        [Markup.button.callback('❌ Cancel', 'cancel')]
                    ])
                }
            );
            return;
        }

        // Create buttons for payee selection
        const payeeButtons = payees.data.map(payee =>
            [Markup.button.callback(`${payee.nickName} (${payee.email})`, `select_payee:${payee.id}`)]
        );

        // Add pagination if needed
        if (payees.hasMore) {
            payeeButtons.push([
                Markup.button.callback('⏩ More Recipients', `more_payees:${page + 1}`),
                Markup.button.callback('🔙 Back', 'back_to_type_selection'),
                Markup.button.callback('❌ Cancel', 'cancel')
            ]);
        } else {
            payeeButtons.push([
                Markup.button.callback('🔙 Back', 'back_to_type_selection'),
                Markup.button.callback('❌ Cancel', 'cancel')
            ]);
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
                    [Markup.button.callback('🔙 Back', 'back_to_type_selection'),
                    Markup.button.callback('❌ Cancel', 'cancel')
                    ]
                ])
            }
        );
    }
}

// Handle pagination for payees
sendBatchScene.action(/more_payees:(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const page = parseInt(ctx.match[1]);
    await showPayeeList(ctx, page);
});

// Handle payee selection
sendBatchScene.action(/select_payee:([^:]+)/, async (ctx) => {
    await ctx.answerCbQuery();
    const payeeId = ctx.match[1];

    const payee = await payeeService.getPayee(payeeId);

    if (!payee) {
        await ctx.reply('❌ *Payee Not Found*\n\n' +
            'The payee you selected was not found. Please try again or choose a different method.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back', 'back_to_type_selection'),
                    Markup.button.callback('❌ Cancel', 'cancel')
                    ]
                ])
            }
        );

        return;
    }

    ctx.scene.session.currentRecipient!.type = 'payee';
    ctx.scene.session.currentRecipient!.payeeId = payeeId;
    ctx.scene.session.currentRecipient!.payeeName = payee.nickName;
    ctx.scene.session.currentRecipient!.value = payee.email;
    ctx.scene.session.currentStep = 'amount';

    // Get wallet balance for amount prompt
    const balance = await walletService.getDefaultWalletBalance();
    let balanceDisplay = 'Unknown';

    if (balance) {
        balanceDisplay = `${formatWalletBalance(balance)}`;
    }

    await ctx.reply(
        '💰 *Enter Amount*\n\n' +
        `Recipient: *${payee.nickName}* (${payee.email})\n` +
        `Your current balance: *${balanceDisplay}*\n\n` +
        'Please enter the amount of USDC to send to this recipient:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        }
    );
});

// Handle back to type selection
sendBatchScene.action('back_to_type_selection', async (ctx) => {
    await ctx.answerCbQuery();

    ctx.scene.session.currentRecipient = {};
    ctx.scene.session.currentStep = 'value';

    await promptAddRecipient(ctx);
});

// Handle back to main menu
sendBatchScene.action('back_to_main', async (ctx) => {
    await ctx.answerCbQuery();

    ctx.scene.session.addingRecipient = false;
    ctx.scene.session.removingRecipient = false;
    ctx.scene.session.currentStep = undefined;
    ctx.scene.session.currentRecipient = undefined;

    await showMainMenu(ctx);
});

// Handle view batch summary
sendBatchScene.action('view_summary', async (ctx) => {
    await ctx.answerCbQuery();
    await showBatchSummary(ctx);
});

// Handle remove recipient action
sendBatchScene.action('remove_recipient', async (ctx) => {
    await ctx.answerCbQuery();

    if (ctx.scene.session.recipients.length === 0) {
        await ctx.reply(
            '❌ *No Recipients*\n\n' +
            'There are no recipients to remove.',
            { parse_mode: 'Markdown' }
        );
        return showMainMenu(ctx);
    }

    ctx.scene.session.removingRecipient = true;
    await showRecipientRemovalList(ctx);
});

// Show list of recipients for removal
async function showRecipientRemovalList(ctx: SendBatchContext): Promise<void> {
    const recipients = ctx.scene.session.recipients;
    const buttons = recipients.map((recipient, index) => {
        const displayText = formatRecipientForDisplay(recipient);
        return [Markup.button.callback(`${index + 1}. ${displayText}`, `remove_recipient:${index}`)];
    });

    buttons.push([Markup.button.callback('🔙 Back to Summary', 'view_summary')]);

    await ctx.reply(
        '🗑️ *Remove Recipient*\n\n' +
        'Select a recipient to remove from the batch:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        }
    );
}

// Format recipient details for display
function formatRecipientForDisplay(recipient: Recipient): string {
    switch (recipient.type) {
        case 'email':
            return `📧 ${recipient.value} - ${formatHumanAmount(recipient.amount, 2)} USDC`;
        case 'wallet':
            return `📝 ${formatWalletAddress(recipient.value)} - ${formatHumanAmount(recipient.amount, 2)} USDC`;
        case 'payee':
            return `👤 ${recipient.payeeName} - ${formatHumanAmount(recipient.amount, 2)} USDC`;
    }
}

// Handle remove specific recipient
sendBatchScene.action(/remove_recipient:(\d+)/, async (ctx) => {
    await ctx.answerCbQuery();

    const index = parseInt(ctx.match[1]);
    if (index >= 0 && index < ctx.scene.session.recipients.length) {
        // Subtract amount from total
        const amount = parseFloat(ctx.scene.session.recipients[index].amount);
        ctx.scene.session.totalAmount -= amount;

        // Remove recipient
        ctx.scene.session.recipients.splice(index, 1);

        ctx.scene.session.removingRecipient = false;

        // Show updated summary
        await ctx.reply('✅ Recipient removed successfully.');
        await showBatchSummary(ctx);
    }
});

// Handle proceed to purpose
sendBatchScene.action('proceed_to_purpose', async (ctx) => {
    await ctx.answerCbQuery();

    if (ctx.scene.session.recipients.length === 0) {
        await ctx.reply(
            '❌ *No Recipients Added*\n\n' +
            'Please add at least one recipient to proceed.',
            { parse_mode: 'Markdown' }
        );
        return showMainMenu(ctx);
    }

    await showPurposeSelection(ctx);
});

// Handle purpose selection
sendBatchScene.action(/purpose:(.+)/, async (ctx) => {
    await ctx.answerCbQuery();

    const purposeCode = ctx.match[1] as PurposeCode;
    ctx.scene.session.purposeCode = purposeCode;

    await showBatchConfirmation(ctx);
});

// Handle back to purpose
sendBatchScene.action('back_to_purpose', async (ctx) => {
    await ctx.answerCbQuery();
    await showPurposeSelection(ctx);
});

// Handle back to summary
sendBatchScene.action('back_to_summary', async (ctx) => {
    await ctx.answerCbQuery();
    await showBatchSummary(ctx);
});

// Handle confirm batch
sendBatchScene.action('confirm_batch', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('🔄 Processing your batch transfer...');

    try {
        // Prepare batch requests
        const batchRequests: CreateSendTransferBatchSingleRequest[] = ctx.scene.session.recipients.map((r, index) => {
            if (r.type === 'payee') {
                return {
                    requestId: `transfer-${index + 1}`,
                    request: {
                        payeeId: r.payeeId!,
                        amount: r.amount,
                        purposeCode: ctx.scene.session.purposeCode!,
                    }
                };
            } else {
                return {
                    requestId: `transfer-${index + 1}`,
                    request: {
                        [r.type === 'email' ? 'email' : 'walletAddress']: r.value,
                        amount: toRawAmount(r.amount),
                        purposeCode: ctx.scene.session.purposeCode!,
                    }
                };
            }
        });

        // Execute batch transfer
        const result = await transferService.sendBatch({ requests: batchRequests });

        if (!result || !result.responses || result.responses.length === 0) {
            await ctx.reply(
                '❌ *Batch Transfer Failed*\n\n' +
                'We encountered an error processing your batch transfer. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                    ])
                }
            );
            return ctx.scene.leave();
        }

        // Format batch result
        const successCount = result.responses.filter(r => !r.error).length;
        const failedCount = result.responses.filter(r => r.error).length;

        let resultMessage = '✅ *Batch Transfer Results*\n\n';
        resultMessage += `Successfully processed: *${successCount}/${result.responses.length}*\n`;

        if (failedCount > 0) {
            resultMessage += `Failed transfers: *${failedCount}*\n\n`;
            resultMessage += '*Details of Failed Transfers:*\n';

            result.responses.forEach((resp, index) => {
                if (resp.error) {
                    const recipient = ctx.scene.session.recipients[index];
                    resultMessage += `• ${formatRecipientForDisplay(recipient)} - ${resp.error.message || 'Unknown error'}\n`;
                }
            });
        }

        await ctx.reply(
            resultMessage,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('📋 View Transfer History', 'history')],
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );

        return ctx.scene.leave();
    } catch (error) {
        logger.error('Error processing batch transfer', { error });

        await ctx.reply(
            '❌ *Batch Transfer Failed*\n\n' +
            'We encountered an error processing your batch transfer. Please try again later.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );
        return ctx.scene.leave();
    }
});

// Handle cancel
sendBatchScene.action('cancel', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Batch transfer cancelled.', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
        ])
    });
    return ctx.scene.leave();
});

sendBatchScene.command('cancel', async (ctx) => {
    await ctx.reply('Batch transfer cancelled.', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
        ])
    });
    return ctx.scene.leave();
});

// Handle text messages (for recipient value and amount input)
sendBatchScene.on(message('text'), async (ctx) => {
    const text = ctx.message.text.trim();

    // If not adding a recipient, ignore the message
    if (!ctx.scene.session.addingRecipient) {
        return;
    }

    // Handle recipient value input
    if (ctx.scene.session.currentStep === 'value') {
        const type = ctx.scene.session.currentRecipient?.type;

        if (!type) {
            await ctx.reply('Please select a recipient type first.');
            return;
        }

        // Skip validation for payee type (handled by action)
        if (type === 'payee') return;

        // Validate input based on type
        const isValid = type === 'email' ? isValidEmail(text) : isValidWalletAddress(text);

        if (!isValid) {
            const errorMessage = type === 'email'
                ? '❌ *Invalid Email Format*\n\nPlease enter a valid email address:'
                : '❌ *Invalid Wallet Address*\n\nPlease enter a valid wallet address:';

            await ctx.reply(errorMessage, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            });

            return;
        }

        // Store recipient value and move to amount step
        ctx.scene.session.currentRecipient!.value = text;
        ctx.scene.session.currentStep = 'amount';

        // Get wallet balance
        const balance = await walletService.getDefaultWalletBalance();
        let balanceDisplay = 'Unknown';

        if (balance) {
            balanceDisplay = `${formatWalletBalance(balance)}`;
        }

        await ctx.reply(
            '💰 *Enter Amount*\n\n' +
            `Your current balance: *${balanceDisplay}*\n\n` +
            'Please enter the amount of USDC to send to this recipient:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            }
        );

        return;
    }

    // Handle amount input
    if (ctx.scene.session.currentStep === 'amount') {
        // Validate amount
        const amount = parseFloat(text);

        if (isNaN(amount) || amount < 1) {
            await ctx.reply(
                '❌ *Invalid Amount*\n\n' +
                'Please enter a valid amount of at least 1 USDC:',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        Markup.button.callback('🔙 Back to Summary', 'back_to_summary'),
                        Markup.button.callback('❌ Cancel', 'cancel')
                    ])
                }
            );
            return;
        }

        // Check available balance
        const balance = await walletService.getDefaultWalletBalance();
        const currentTotal = ctx.scene.session.totalAmount + amount;

        if (balance && parseFloat(balance.balance) < currentTotal) {
            await ctx.reply(
                '❌ *Insufficient Funds*\n\n' +
                `Your current balance is ${formatWalletBalance(balance)}.\n` +
                `Total batch amount would be ${formatHumanAmount(currentTotal, 2)} ${balance.symbol}.\n\n` +
                'Please enter a smaller amount:',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Summary', 'back_to_summary')],
                        [Markup.button.callback('❌ Cancel', 'cancel')]
                    ])
                }
            );
            return;
        }

        // Add recipient to the batch
        if (ctx.scene.session.currentRecipient?.type) {
            const newRecipient: Recipient = {
                type: ctx.scene.session.currentRecipient.type,
                value: ctx.scene.session.currentRecipient.value!,
                amount: text
            };

            // Add payee details if applicable
            if (newRecipient.type === 'payee' && ctx.scene.session.currentRecipient.payeeId) {
                newRecipient.payeeId = ctx.scene.session.currentRecipient.payeeId;
                newRecipient.payeeName = ctx.scene.session.currentRecipient.payeeName;
            }

            ctx.scene.session.recipients.push(newRecipient);

            // Update total amount
            ctx.scene.session.totalAmount += amount;

            // Reset current session
            ctx.scene.session.addingRecipient = false;
            ctx.scene.session.currentStep = undefined;
            ctx.scene.session.currentRecipient = undefined;

            let successMessage = '✅ *Recipient Added Successfully*\n\n';
            successMessage += formatRecipientForDisplay(ctx.scene.session.recipients[ctx.scene.session.recipients.length - 1]);

            await ctx.reply(successMessage, { parse_mode: 'Markdown' });

            // Show main menu
            await showMainMenu(ctx);
        }
    }
});

// Helper functions for UI

async function showMainMenu(ctx: SendBatchContext): Promise<void> {
    const recipientCount = ctx.scene.session.recipients.length;

    let message = '👥 *Batch Transfer*\n\n';

    if (recipientCount > 0) {
        message += `You have added *${recipientCount}* ${recipientCount === 1 ? 'recipient' : 'recipients'} to this batch.\n`;
        message += `Total amount: *${formatHumanAmount(ctx.scene.session.totalAmount, 2)} USDC*\n\n`;
        message += 'You can add more recipients, view the summary, or proceed to the next step.';
    } else {
        message += 'You have not added any recipients yet. Please add at least one recipient to proceed.';
    }

    const buttons = [
        [Markup.button.callback('➕ Add Recipient', 'add_recipient')]
    ];

    if (recipientCount > 0) {
        buttons.push([Markup.button.callback('📋 View Batch Summary', 'view_summary')]);
        buttons.push([Markup.button.callback('▶️ Proceed', 'proceed_to_purpose')]);
    }

    buttons.push([Markup.button.callback('❌ Cancel', 'cancel')]);

    await ctx.reply(
        message,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttons)
        }
    );
}

async function showBatchSummary(ctx: SendBatchContext): Promise<void> {
    const recipients = ctx.scene.session.recipients;

    if (recipients.length === 0) {
        await ctx.reply(
            '❌ *No Recipients Added*\n\n' +
            'Please add at least one recipient to view the summary.',
            { parse_mode: 'Markdown' }
        );
        return showMainMenu(ctx);
    }

    let message = `📋 *Batch Transfer Summary*\n\n`;
    message += `*Recipients:* ${recipients.length}\n`;
    message += `*Total Amount:* ${formatHumanAmount(ctx.scene.session.totalAmount, 2)} USDC\n\n`;
    message += '*Recipient Details:*\n';

    recipients.forEach((recipient, index) => {
        message += `${index + 1}. ${formatRecipientForDisplay(recipient)}\n`;
    });

    await ctx.reply(
        message,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('➕ Add More', 'add_recipient')],
                [
                    Markup.button.callback('🗑️ Remove Recipient', 'remove_recipient'),
                    Markup.button.callback('▶️ Proceed', 'proceed_to_purpose')
                ],
                [Markup.button.callback('🔙 Back', 'back_to_main')]
            ])
        }
    );
}

async function showPurposeSelection(ctx: SendBatchContext): Promise<void> {
    const purposeButtons = PURPOSE_CODES.map(code =>
        Markup.button.callback(formatPurposeCode(code), `purpose:${code}`)
    );

    const buttonRows = [];
    for (let i = 0; i < purposeButtons.length; i += 2) {
        buttonRows.push(purposeButtons.slice(i, i + 2));
    }

    buttonRows.push([
        Markup.button.callback('🔙 Back to Summary', 'back_to_summary')
    ]);

    await ctx.reply(
        '🔍 *Select Purpose*\n\n' +
        `You are sending *${formatHumanAmount(ctx.scene.session.totalAmount, 2)} USDC* to *${ctx.scene.session.recipients.length}* recipients.\n\n` +
        'Please select the purpose for all transfers in this batch:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard(buttonRows)
        }
    );
}

async function showBatchConfirmation(ctx: SendBatchContext): Promise<void> {
    const recipients = ctx.scene.session.recipients;
    const purpose = formatPurposeCode(ctx.scene.session.purposeCode!);

    let message = `🔍 *Confirm Batch Transfer*\n\n`;
    message += `*Number of Recipients:* ${recipients.length}\n`;
    message += `*Total Amount:* ${formatHumanAmount(ctx.scene.session.totalAmount, 2)} USDC\n`;
    message += `*Purpose:* ${purpose}\n\n`;
    message += '*Recipients:*\n';

    // List all recipients with details
    recipients.forEach((recipient, index) => {
        message += `${index + 1}. ${formatRecipientForDisplay(recipient)}\n`;
    });

    message += '\nPlease review carefully and confirm to process all transfers:';

    await ctx.reply(
        message,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Confirm Batch Transfer', 'confirm_batch')],
                [Markup.button.callback('🔙 Back to Purpose', 'back_to_purpose')],
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        }
    );
}

export { sendBatchScene };

