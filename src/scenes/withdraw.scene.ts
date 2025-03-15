import { Scenes, Markup } from 'telegraf';
import { GlobalContext, GlobalSceneSession } from '../types/session.types';
import { transferService } from '../services/transfer.service';
import { payeeService } from '../services/payee.service';
import { quoteService } from '../services/quote.service';
import logger from '../utils/logger';
import {
    Country,
    CreatePayeeRequest,
    OfframpQuoteRequest,
    PurposeCode
} from '../types/api.types';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { formatPurposeCode } from '../utils/formatters';

interface WithdrawSessionData extends GlobalSceneSession {
    step?: 'select_payee' | 'create_payee' | 'enter_amount' | 'select_purpose' | 'confirm';
    payeeId?: string;
    amount?: string;
    purposeCode?: PurposeCode;
    quotePayload?: string;
    quoteSignature?: string;
    // Bank account creation fields
    bankName?: string;
    bankAddress?: string;
    bankAccountType?: 'savings' | 'checking';
    bankRoutingNumber?: string;
    bankAccountNumber?: string;
    bankBeneficiaryName?: string;
    bankBeneficiaryAddress?: string;
    swiftCode?: string;
    nickName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
}

export type WithdrawContext = GlobalContext<WithdrawSessionData>;

// Initialize purpose codes
const PURPOSE_CODES: PurposeCode[] = [
    'self', 'salary', 'gift', 'income', 'saving',
    'education_support', 'family', 'home_improvement', 'reimbursement'
];

// Create a wizard scene for the withdraw flow
const withdrawScene = new Scenes.WizardScene<WithdrawContext>(
    'withdraw',

    // Step 1: Show payee list or create new payee
    async (ctx) => {
        // Reset scene session
        ctx.scene.session.step = 'select_payee';
        ctx.scene.session.payeeId = undefined;
        ctx.scene.session.amount = undefined;
        ctx.scene.session.purposeCode = undefined;
        ctx.scene.session.quotePayload = undefined;
        ctx.scene.session.quoteSignature = undefined;
        ctx.scene.session.bankName = undefined;
        ctx.scene.session.bankAddress = undefined;
        ctx.scene.session.bankAccountType = undefined;
        ctx.scene.session.bankRoutingNumber = undefined;
        ctx.scene.session.bankAccountNumber = undefined;
        ctx.scene.session.bankBeneficiaryName = undefined;
        ctx.scene.session.bankBeneficiaryAddress = undefined;
        ctx.scene.session.swiftCode = undefined;
        ctx.scene.session.nickName = undefined;
        ctx.scene.session.firstName = undefined;
        ctx.scene.session.lastName = undefined;
        ctx.scene.session.email = undefined;

        await ctx.reply('🏦 *Withdraw to Bank Account*\n\n' +
            'Please wait while we fetch your saved bank accounts...',
            { parse_mode: 'Markdown' }
        );

        // Fetch existing payees
        const payees = await payeeService.getPayees(1, 10);

        // Filter payees with bank accounts
        const bankPayees = payees?.data.filter(p => p.hasBankAccount) || [];

        if (bankPayees.length > 0) {
            // Show list of existing bank accounts
            const payeeButtons = bankPayees.map(payee => {
                const displayName = payee.displayName ||
                    `${payee.firstName || ''} ${payee.lastName || ''}`.trim() ||
                    payee.nickName;

                return Markup.button.callback(
                    `🏦 ${displayName}`,
                    `select_payee:${payee.id}`
                );
            });

            // Create keyboard with payee buttons (one per row)
            const keyboard = Markup.inlineKeyboard([
                ...payeeButtons.map(button => [button]),
                [Markup.button.callback('➕ Add New Bank Account', 'create_payee')],
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ]);

            await ctx.reply(
                '🏦 *Select Bank Account*\n\n' +
                'Please select a bank account to withdraw to:',
                {
                    parse_mode: 'Markdown',
                    ...keyboard
                }
            );
        } else {
            // No existing bank accounts, offer to create one
            await ctx.reply(
                '🏦 *No Bank Accounts Found*\n\n' +
                'You don\'t have any saved bank accounts. Let\'s create one now.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('➕ Add Bank Account', 'create_payee')],
                        [Markup.button.callback('❌ Cancel', 'cancel')]
                    ])
                }
            );
        }

        return ctx.wizard.next();
    },

    // Step 2: Handle payee selection or initiate payee creation
    async (ctx) => {
        if (!('callback_query' in ctx.update)) {
            await ctx.reply(
                'Please select an option from the buttons above or type /cancel to exit.',
                Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            );
            return;
        }

        const callbackQuery = ctx.update.callback_query as CallbackQuery.DataQuery;
        const callbackData = callbackQuery.data;

        if (callbackData === 'cancel') {
            await ctx.answerCbQuery();
            await ctx.reply('Withdrawal cancelled.');
            return ctx.scene.leave();
        }

        if (callbackData.startsWith('select_payee:')) {
            // User selected an existing payee
            const payeeId = callbackData.split(':')[1];
            ctx.scene.session.payeeId = payeeId;
            ctx.scene.session.step = 'enter_amount';
            await ctx.answerCbQuery();

            // Fetch payee details to show to the user
            const payee = await payeeService.getPayee(payeeId);
            if (payee) {
                const payeeInfo = payeeService.formatPayee(payee);
                await ctx.reply(
                    `*Selected Bank Account:*\n\n${payeeInfo}`,
                    { parse_mode: 'Markdown' }
                );
            }

            // Ask for amount
            await ctx.reply(
                '💰 *Enter Withdrawal Amount*\n\n' +
                'Please enter the amount you want to withdraw in USD:',
                { parse_mode: 'Markdown' }
            );

            return ctx.wizard.next();
        }

        if (callbackData === 'create_payee') {
            // User wants to create a new payee
            ctx.scene.session.step = 'create_payee';
            await ctx.answerCbQuery();

            // Start collecting bank account information
            await ctx.reply(
                '➕ *Add New Bank Account*\n\n' +
                'Let\'s set up a new bank account for withdrawals. First, let\'s add some basic information.\n\n' +
                'What should we call this bank account? (e.g., "My Bank", "Personal Account")',
                { parse_mode: 'Markdown' }
            );

            // Go to the bank account creation flow
            return startBankAccountCreation(ctx);
        }

        // If we get here, it's an invalid callback
        await ctx.answerCbQuery('Invalid selection');
    },

    // Step 3: Handle amount input or bank account creation
    async (ctx) => {
        // Check what step we're on
        if (ctx.scene.session.step === 'create_payee') {
            // We're in the bank account creation flow
            return handleBankAccountCreation(ctx);
        }

        // We're in the amount input step
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
        ctx.scene.session.step = 'select_purpose';

        // Get a quote for this withdrawal
        await ctx.reply('Getting quote for your withdrawal...');

        const quoteRequest: OfframpQuoteRequest = {
            sourceCountry: 'usa', // Default to USA as source
            destinationCountry: 'usa', // Default to USA as destination
            amount: input,
            currency: 'USD',
            payeeId: ctx.scene.session.payeeId
        };

        const quote = await quoteService.getOfframpQuote(quoteRequest);

        if (!quote || quote.error) {
            await ctx.reply(
                '❌ *Error Getting Quote*\n\n' +
                'We encountered an issue getting a quote for your withdrawal. ' +
                (quote?.error ? `Error: ${quote.error}` : 'Please try again later.'),
                { parse_mode: 'Markdown' }
            );
            return ctx.scene.leave();
        }

        // Store quote information
        ctx.scene.session.quotePayload = quote.quotePayload;
        ctx.scene.session.quoteSignature = quote.quoteSignature;

        // Display quote to user
        const quoteInfo = quoteService.formatQuote(quote, input, 'USD');
        await ctx.reply(quoteInfo, { parse_mode: 'Markdown' });

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
            'Please select the purpose of this withdrawal:',
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

    // Step 4: Handle purpose selection and show confirmation
    async (ctx) => {
        if (!('callback_query' in ctx.update)) {
            await ctx.reply(
                'Please select a purpose from the buttons above or type /cancel to exit.',
                Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            );
            return;
        }

        const callbackQuery = ctx.update.callback_query as CallbackQuery.DataQuery;
        const callbackData = callbackQuery.data;

        if (callbackData === 'cancel') {
            await ctx.answerCbQuery();
            await ctx.reply('Withdrawal cancelled.');
            return ctx.scene.leave();
        }

        if (callbackData.startsWith('purpose:')) {
            const purposeCode = callbackData.split(':')[1] as PurposeCode;
            ctx.scene.session.purposeCode = purposeCode;
            ctx.scene.session.step = 'confirm';
            await ctx.answerCbQuery();

            // Fetch payee details
            let payeeInfo = 'Unknown bank account';
            if (ctx.scene.session.payeeId) {
                const payee = await payeeService.getPayee(ctx.scene.session.payeeId);
                if (payee) {
                    payeeInfo = payeeService.formatPayee(payee);
                }
            }

            // Show confirmation message
            await ctx.reply(
                '🔍 *Confirm Withdrawal*\n\n' +
                `*Amount:* $${ctx.scene.session.amount} USD\n` +
                `*Purpose:* ${formatPurposeCode(purposeCode)}\n\n` +
                `*Bank Account:*\n${payeeInfo}\n\n` +
                '⚠️ Please review the details carefully before confirming this withdrawal.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('✅ Confirm Withdrawal', 'confirm')],
                        [Markup.button.callback('❌ Cancel', 'cancel')]
                    ])
                }
            );

            return ctx.wizard.next();
        }

        // If we get here, it's an invalid callback
        await ctx.answerCbQuery('Invalid selection');
    },

    // Step 5: Process confirmation and execute withdrawal
    async (ctx) => {
        if (!('callback_query' in ctx.update)) {
            await ctx.reply(
                'Please confirm or cancel the withdrawal using the buttons above.',
                Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            );
            return;
        }

        const callbackQuery = ctx.update.callback_query as CallbackQuery.DataQuery;
        const callbackData = callbackQuery.data;

        if (callbackData === 'cancel') {
            await ctx.answerCbQuery();
            await ctx.reply('Withdrawal cancelled.');
            return ctx.scene.leave();
        }

        if (callbackData === 'confirm') {
            await ctx.answerCbQuery();
            await ctx.reply('Processing your withdrawal...');

            // Validate that we have all necessary data
            if (!ctx.scene.session.quotePayload ||
                !ctx.scene.session.quoteSignature ||
                !ctx.scene.session.purposeCode) {
                await ctx.reply(
                    '❌ *Withdrawal Failed*\n\n' +
                    'We encountered an error processing your withdrawal. Some required information is missing.',
                    { parse_mode: 'Markdown' }
                );
                return ctx.scene.leave();
            }

            try {
                // Execute the withdrawal
                const result = await transferService.withdrawToBank(
                    ctx.scene.session.quotePayload,
                    ctx.scene.session.quoteSignature,
                    ctx.scene.session.purposeCode
                );

                if (!result) {
                    await ctx.reply(
                        '❌ *Withdrawal Failed*\n\n' +
                        'We encountered an error processing your withdrawal. Please try again later.',
                        { parse_mode: 'Markdown' }
                    );
                    return ctx.scene.leave();
                }

                // Format and show the transfer details
                const transferDetails = transferService.formatTransfer(result);

                await ctx.reply(
                    '✅ *Withdrawal Initiated*\n\n' +
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
                logger.error('Error processing withdrawal', {
                    error,
                    payeeId: ctx.scene.session.payeeId,
                    amount: ctx.scene.session.amount
                });

                await ctx.reply(
                    '❌ *Withdrawal Failed*\n\n' +
                    'We encountered an error processing your withdrawal. Please try again later.',
                    { parse_mode: 'Markdown' }
                );
                return ctx.scene.leave();
            }
        }

        // If we get here, it's an invalid callback
        await ctx.answerCbQuery('Invalid selection');
    }
);

/**
 * Start the bank account creation flow
 */
async function startBankAccountCreation(ctx: WithdrawContext) {
    // Set up state for current step
    ctx.scene.session.bankName = undefined;
    ctx.scene.session.bankAddress = undefined;
    ctx.scene.session.bankAccountType = undefined;
    ctx.scene.session.bankRoutingNumber = undefined;
    ctx.scene.session.bankAccountNumber = undefined;
    ctx.scene.session.bankBeneficiaryName = undefined;
    ctx.scene.session.bankBeneficiaryAddress = undefined;
    ctx.scene.session.swiftCode = undefined;
    ctx.scene.session.nickName = undefined;
    ctx.scene.session.firstName = undefined;
    ctx.scene.session.lastName = undefined;
    ctx.scene.session.email = undefined;

    return ctx.wizard.selectStep(2);
}

/**
 * Handle inputs for bank account creation
 */
async function handleBankAccountCreation(ctx: WithdrawContext): Promise<any> {
    if (!ctx.message || !('text' in ctx.message)) {
        await ctx.reply('Please enter the requested information or type /cancel to exit.');
        return;
    }

    const input = ctx.message.text.trim();

    // Process input based on which field we're collecting
    if (!ctx.scene.session.nickName) {
        // Collecting nickname
        ctx.scene.session.nickName = input;

        await ctx.reply(
            'Please enter the first name for this bank account:'
        );
        return;
    }

    if (!ctx.scene.session.firstName) {
        // Collecting first name
        ctx.scene.session.firstName = input;

        await ctx.reply(
            'Please enter the last name for this bank account:'
        );
        return;
    }

    if (!ctx.scene.session.lastName) {
        // Collecting last name
        ctx.scene.session.lastName = input;

        await ctx.reply(
            'Please enter the email address for this bank account:'
        );
        return;
    }

    if (!ctx.scene.session.email) {
        // Collecting email
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
            await ctx.reply(
                '❌ *Invalid Email Format*\n\n' +
                'Please enter a valid email address:',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        ctx.scene.session.email = input;

        await ctx.reply(
            'Please enter the bank name (e.g., "Chase", "Bank of America"):'
        );
        return;
    }

    if (!ctx.scene.session.bankName) {
        // Collecting bank name
        ctx.scene.session.bankName = input;

        await ctx.reply(
            'Please enter the bank address:'
        );
        return;
    }

    if (!ctx.scene.session.bankAddress) {
        // Collecting bank address
        ctx.scene.session.bankAddress = input;

        await ctx.reply(
            'Please select the bank account type:',
            Markup.inlineKeyboard([
                [Markup.button.callback('Savings', 'bank_type:savings')],
                [Markup.button.callback('Checking', 'bank_type:checking')]
            ])
        );
        return;
    }

    if (!ctx.scene.session.bankRoutingNumber) {
        // Collecting routing number
        // Basic validation for US routing numbers (9 digits)
        if (!/^\d{9}$/.test(input)) {
            await ctx.reply(
                '❌ *Invalid Routing Number*\n\n' +
                'Please enter a valid 9-digit routing number:',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        ctx.scene.session.bankRoutingNumber = input;

        await ctx.reply(
            'Please enter the bank account number:'
        );
        return;
    }

    if (!ctx.scene.session.bankAccountNumber) {
        // Collecting account number
        // Basic validation (between 4-17 digits)
        if (!/^\d{4,17}$/.test(input)) {
            await ctx.reply(
                '❌ *Invalid Account Number*\n\n' +
                'Please enter a valid bank account number (4-17 digits):',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        ctx.scene.session.bankAccountNumber = input;

        await ctx.reply(
            'Please enter the beneficiary name (full legal name):'
        );
        return;
    }

    if (!ctx.scene.session.bankBeneficiaryName) {
        // Collecting beneficiary name
        ctx.scene.session.bankBeneficiaryName = input;

        await ctx.reply(
            'Please enter the beneficiary address:'
        );
        return;
    }

    if (!ctx.scene.session.bankBeneficiaryAddress) {
        // Collecting beneficiary address
        ctx.scene.session.bankBeneficiaryAddress = input;

        await ctx.reply(
            'Please enter the bank SWIFT code (if applicable, or type "N/A"):'
        );
        return;
    }

    if (!ctx.scene.session.swiftCode) {
        // Collecting SWIFT code
        ctx.scene.session.swiftCode = input === 'N/A' ? '' : input;

        // Show summary and ask for confirmation
        const summary = `
🏦 *Bank Account Summary*

*Account Name:* ${ctx.scene.session.nickName}
*Account Holder:* ${ctx.scene.session.firstName} ${ctx.scene.session.lastName}
*Email:* ${ctx.scene.session.email}

*Bank Details:*
Bank: ${ctx.scene.session.bankName}
Address: ${ctx.scene.session.bankAddress}
Account Type: ${ctx.scene.session.bankAccountType || 'Not specified'}
Routing Number: ${ctx.scene.session.bankRoutingNumber}
Account Number: XXXX${ctx.scene.session.bankAccountNumber.substring(Math.max(0, ctx.scene.session.bankAccountNumber.length - 4))}
Beneficiary: ${ctx.scene.session.bankBeneficiaryName}
SWIFT: ${ctx.scene.session.swiftCode || 'Not provided'}
`;

        await ctx.reply(
            summary + '\n\nIs this information correct?',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('✅ Yes, Create Bank Account', 'confirm_bank_account')],
                    [Markup.button.callback('❌ No, Cancel', 'cancel')]
                ])
            }
        );

        return;
    }

    // If we get here, something went wrong
    await ctx.reply('Please follow the prompts to create your bank account or type /cancel to exit.');
}

// Handle bank account creation confirmation
withdrawScene.action('confirm_bank_account', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Creating your bank account...');

    try {
        // Create the payee
        const payeeData: CreatePayeeRequest = {
            nickName: ctx.scene.session.nickName!,
            firstName: ctx.scene.session.firstName,
            lastName: ctx.scene.session.lastName,
            email: ctx.scene.session.email!,
            bankAccount: {
                country: 'usa' as Country, // Default to USA
                bankName: ctx.scene.session.bankName!,
                bankAddress: ctx.scene.session.bankAddress!,
                type: 'bank_wire', // Default to wire
                bankAccountType: ctx.scene.session.bankAccountType || 'checking',
                bankRoutingNumber: ctx.scene.session.bankRoutingNumber!,
                bankAccountNumber: ctx.scene.session.bankAccountNumber!,
                bankBeneficiaryName: ctx.scene.session.bankBeneficiaryName!,
                bankBeneficiaryAddress: ctx.scene.session.bankBeneficiaryAddress!,
                swiftCode: ctx.scene.session.swiftCode || ''
            }
        };

        const payee = await payeeService.createPayee(payeeData);

        if (!payee) {
            await ctx.reply(
                '❌ *Error Creating Bank Account*\n\n' +
                'We encountered an issue while creating your bank account. Please try again later.',
                { parse_mode: 'Markdown' }
            );
            return ctx.scene.leave();
        }

        // Save payee ID and move to amount entry
        ctx.scene.session.payeeId = payee.id;
        ctx.scene.session.step = 'enter_amount';

        await ctx.reply(
            '✅ *Bank Account Created Successfully!*\n\n' +
            'Now, let\'s proceed with your withdrawal.',
            { parse_mode: 'Markdown' }
        );

        // Ask for amount
        await ctx.reply(
            '💰 *Enter Withdrawal Amount*\n\n' +
            'Please enter the amount you want to withdraw in USD:',
            { parse_mode: 'Markdown' }
        );

        return ctx.wizard.selectStep(3);

    } catch (error) {
        logger.error('Error creating bank account', { error });
        await ctx.reply(
            '❌ *Error Creating Bank Account*\n\n' +
            'We encountered an error while creating your bank account. Please try again later.',
            { parse_mode: 'Markdown' }
        );
        return ctx.scene.leave();
    }
});

// Handle bank account type selection
withdrawScene.action(/bank_type:(.+)/, async (ctx) => {
    const type = ctx.match[1] as 'savings' | 'checking';
    ctx.scene.session.bankAccountType = type;
    await ctx.answerCbQuery();

    await ctx.reply(
        `You selected: ${type === 'savings' ? 'Savings' : 'Checking'}\n\n` +
        'Please enter the bank routing number (9 digits):'
    );
});

// Add cancellation handlers
withdrawScene.action('cancel', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Withdrawal cancelled.');
    return ctx.scene.leave();
});

withdrawScene.command('cancel', async (ctx) => {
    await ctx.reply('Withdrawal cancelled.');
    return ctx.scene.leave();
});


export { withdrawScene };