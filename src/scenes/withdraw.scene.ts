import { Scenes, Markup } from 'telegraf';
import { GlobalContext, GlobalSceneSession } from '../types/session.types';
import { transferService } from '../services/transfer.service';
import { accountService } from '../services/account.service';
import { quoteService } from '../services/quote.service';
import logger from '../utils/logger.utils';
import {
    Country,
    CreateAccountRequest,
    OfframpQuoteRequest,
    PurposeCode,
    TransferAccountType,
} from '../types/api.types';
import { formatPurposeCode } from '../utils/formatters.utils';
import { message } from 'telegraf/filters';

// Scene ID
export const WITHDRAW_SCENE_ID = 'withdraw';

interface WithdrawSessionData extends GlobalSceneSession {
    currentStep?: string;
    accountId?: string;
    amount?: string;
    purposeCode?: PurposeCode;
    quotePayload?: string;
    quoteSignature?: string;
    providerId?: string;
    // Bank account creation fields
    bankName?: string;
    bankAddress?: string;
    bankAccountType?: 'savings' | 'checking';
    bankRoutingNumber?: string;
    bankAccountNumber?: string;
    bankBeneficiaryName?: string;
    bankBeneficiaryAddress?: string;
    swiftCode?: string;
}

export type WithdrawContext = GlobalContext<WithdrawSessionData>;

// Initialize purpose codes
const PURPOSE_CODES: PurposeCode[] = [
    'self', 'salary', 'gift', 'income', 'saving',
    'education_support', 'family', 'home_improvement', 'reimbursement'
];

// Create a base scene for the withdraw flow
const withdrawScene = new Scenes.BaseScene<WithdrawContext>(WITHDRAW_SCENE_ID);

/**
 * Scene entry point
 */
withdrawScene.enter(async (ctx) => {
    // Reset scene session
    resetSessionData(ctx);

    await ctx.reply('🏦 *Withdraw to Bank Account*\n\n' +
        'Please wait while we fetch your saved bank accounts...',
        { parse_mode: 'Markdown' }
    );

    // Fetch existing bank accounts
    const bankAccounts = await accountService.getBankAccounts();

    if (bankAccounts && bankAccounts.length > 0) {
        // Show list of existing bank accounts
        const accountButtons = bankAccounts.map(account => {
            if (!account.bankAccount) return null;

            const bankName = account.bankAccount.bankName;
            const accountNumber = account.bankAccount.bankAccountNumber;
            const displayText = `🏦 ${bankName} (${accountNumber.substring(Math.max(0, accountNumber.length - 4))})`;

            return Markup.button.callback(
                displayText,
                `select_account:${account.id}`
            );
        }).filter(button => button !== null);

        // Create keyboard with account buttons (one per row)
        const keyboard = Markup.inlineKeyboard([
            ...accountButtons.map(button => [button]),
            [Markup.button.callback('➕ Add New Bank Account', 'create_account')],
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
                    [Markup.button.callback('➕ Add Bank Account', 'create_account')],
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            }
        );
    }
});

/**
 * Handle account selection
 */
withdrawScene.action(/select_account:(.+)/, async (ctx) => {
    const accountId = ctx.match[1];
    ctx.scene.session.accountId = accountId;
    ctx.scene.session.currentStep = 'enter_amount';
    await ctx.answerCbQuery();

    // Fetch account details to show to the user
    const account = await accountService.getAccount(accountId);
    if (account) {
        const accountInfo = accountService.formatBankAccount(account);
        await ctx.reply(
            `*Selected Bank Account:*\n\n${accountInfo}`,
            { parse_mode: 'Markdown' }
        );
    }

    // Ask for amount
    await ctx.reply(
        '💰 *Enter Withdrawal Amount*\n\n' +
        'Please enter the amount you want to withdraw in USD:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        }
    );
});

/**
 * Handle create new bank account action
 */
withdrawScene.action('create_account', async (ctx) => {
    ctx.scene.session.currentStep = 'select_provider';
    await ctx.answerCbQuery();

    // Get available providers
    const providers = await accountService.getProviders();

    if (!providers || providers.length === 0) {
        await ctx.reply(
            '❌ *No Providers Available*\n\n' +
            'We couldn\'t find any available providers for bank account creation. Please try again later.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );
        return ctx.scene.leave();
    }

    // Create provider selection buttons
    const providerButtons = providers.map(provider => {
        const displayName = `Provider ${provider.providerCode}`;
        return Markup.button.callback(
            displayName,
            `select_provider:${provider.id}`
        );
    });

    // Display provider selection
    await ctx.reply(
        '🏢 *Select Provider*\n\n' +
        'Please select a provider for your bank account:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                ...providerButtons.map(button => [button]),
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        }
    );
});

/**
 * Handle provider selection
 */
withdrawScene.action(/select_provider:(.+)/, async (ctx) => {
    const providerId = ctx.match[1];
    ctx.scene.session.providerId = providerId;
    ctx.scene.session.currentStep = 'enter_bank_name';
    await ctx.answerCbQuery();

    // Start collecting bank account information
    await ctx.reply(
        '➕ *Add New Bank Account*\n\n' +
        'Please enter the bank name (e.g., "Chase", "Bank of America"):',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        }
    );
});

/**
 * Handle text input for bank account creation
 */
withdrawScene.on(message('text'), async (ctx) => {
    const input = ctx.message.text.trim();
    const currentStep = ctx.scene.session.currentStep;

    // Handle amount input
    if (currentStep === 'enter_amount') {
        return handleAmountInput(ctx, input);
    }

    // Handle bank account creation steps
    switch (currentStep) {
        case 'enter_bank_name':
            ctx.scene.session.bankName = input;
            ctx.scene.session.currentStep = 'enter_bank_address';

            await ctx.reply('Please enter the bank address:', {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            });
            break;

        case 'enter_bank_address':
            ctx.scene.session.bankAddress = input;
            ctx.scene.session.currentStep = 'select_bank_account_type';

            await ctx.reply(
                'Please select the bank account type:',
                Markup.inlineKeyboard([
                    [Markup.button.callback('Savings', 'bank_type:savings')],
                    [Markup.button.callback('Checking', 'bank_type:checking')]
                ])
            );
            break;

        case 'enter_routing_number':
            // Basic validation for US routing numbers (9 digits)
            if (!/^\d{9}$/.test(input)) {
                await ctx.reply(
                    '❌ *Invalid Routing Number*\n\n' +
                    'Please enter a valid 9-digit routing number:',
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('❌ Cancel', 'cancel')]
                        ])
                    }
                );
                return;
            }

            ctx.scene.session.bankRoutingNumber = input;
            ctx.scene.session.currentStep = 'enter_account_number';

            await ctx.reply('Please enter the bank account number:', {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            });
            break;

        case 'enter_account_number':
            // Basic validation (between 4-17 digits)
            if (!/^\d{4,17}$/.test(input)) {
                await ctx.reply(
                    '❌ *Invalid Account Number*\n\n' +
                    'Please enter a valid bank account number (4-17 digits):',
                    {
                        parse_mode: 'Markdown',
                        ...Markup.inlineKeyboard([
                            [Markup.button.callback('❌ Cancel', 'cancel')]
                        ])
                    }
                );
                return;
            }

            ctx.scene.session.bankAccountNumber = input;
            ctx.scene.session.currentStep = 'enter_beneficiary_name';

            await ctx.reply('Please enter the beneficiary name (full legal name):', {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            });
            break;

        case 'enter_beneficiary_name':
            ctx.scene.session.bankBeneficiaryName = input;
            ctx.scene.session.currentStep = 'enter_beneficiary_address';

            await ctx.reply('Please enter the beneficiary address:', {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            });
            break;

        case 'enter_beneficiary_address':
            ctx.scene.session.bankBeneficiaryAddress = input;
            ctx.scene.session.currentStep = 'enter_swift_code';

            await ctx.reply('Please enter the bank SWIFT code (if applicable, or type "N/A"):', {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            });
            break;

        case 'enter_swift_code':
            ctx.scene.session.swiftCode = input === 'N/A' ? '' : input;
            ctx.scene.session.currentStep = 'confirm_bank_account';

            // Show summary and ask for confirmation
            const summary = formatBankAccountSummary(ctx);

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
            break;

        default:
            await ctx.reply('Please follow the prompts or type /cancel to exit.');
    }
});

/**
 * Handle bank account type selection
 */
withdrawScene.action(/bank_type:(.+)/, async (ctx) => {
    const type = ctx.match[1] as 'savings' | 'checking';
    ctx.scene.session.bankAccountType = type;
    await ctx.answerCbQuery();

    await ctx.reply(
        `You selected: ${type === 'savings' ? 'Savings' : 'Checking'}\n\n` +
        'Please enter the bank routing number (9 digits):',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        }
    );

    ctx.scene.session.currentStep = 'enter_routing_number';
});

/**
 * Handle purpose code selection
 */
withdrawScene.action(/purpose:(.+)/, async (ctx) => {
    const purposeCode = ctx.match[1] as PurposeCode;
    ctx.scene.session.purposeCode = purposeCode;
    ctx.scene.session.currentStep = 'confirm';
    await ctx.answerCbQuery();

    // Fetch account details
    let accountInfo = 'Unknown bank account';
    if (ctx.scene.session.accountId) {
        const account = await accountService.getAccount(ctx.scene.session.accountId);
        if (account) {
            accountInfo = accountService.formatBankAccount(account);
        }
    }

    // Show confirmation message
    await ctx.reply(
        '🔍 *Confirm Withdrawal*\n\n' +
        `*Amount:* $${ctx.scene.session.amount} USD\n` +
        `*Purpose:* ${formatPurposeCode(purposeCode)}\n\n` +
        `*Bank Account:*\n${accountInfo}\n\n` +
        '⚠️ Please review the details carefully before confirming this withdrawal.',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Confirm Withdrawal', 'confirm')],
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        }
    );
});

/**
 * Handle bank account creation confirmation
 */
withdrawScene.action('confirm_bank_account', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Creating your bank account...');

    try {
        if (!ctx.scene.session.providerId ||
            !ctx.scene.session.bankName ||
            !ctx.scene.session.bankAddress ||
            !ctx.scene.session.bankAccountType ||
            !ctx.scene.session.bankRoutingNumber ||
            !ctx.scene.session.bankAccountNumber ||
            !ctx.scene.session.bankBeneficiaryName ||
            !ctx.scene.session.bankBeneficiaryAddress) {

            await ctx.reply(
                '❌ *Error Creating Bank Account*\n\n' +
                'Some required information is missing. Please try again.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                    ])
                }
            );
            return ctx.scene.leave();
        }

        // Create the account
        const accountData: CreateAccountRequest = {
            country: 'usa' as Country, // Default to USA
            network: '', // Not relevant for bank accounts
            walletAddress: '', // Not relevant for bank accounts
            isDefault: false,
            providerId: ctx.scene.session.providerId,
            bankAccount: {
                bankName: ctx.scene.session.bankName,
                bankAddress: ctx.scene.session.bankAddress,
                method: 'bank_wire' as TransferAccountType, // Default to wire
                bankAccountType: ctx.scene.session.bankAccountType,
                bankRoutingNumber: ctx.scene.session.bankRoutingNumber,
                bankAccountNumber: ctx.scene.session.bankAccountNumber,
                bankBeneficiaryName: ctx.scene.session.bankBeneficiaryName,
                swiftCode: ctx.scene.session.swiftCode || ''
            }
        };

        const account = await accountService.createBankAccount(accountData);

        if (!account) {
            await ctx.reply(
                '❌ *Error Creating Bank Account*\n\n' +
                'We encountered an issue while creating your bank account. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                    ])
                }
            );
            return ctx.scene.leave();
        }

        // Save account ID and move to amount entry
        ctx.scene.session.accountId = account.id;
        ctx.scene.session.currentStep = 'enter_amount';

        await ctx.reply(
            '✅ *Bank Account Created Successfully!*\n\n' +
            'Now, let\'s proceed with your withdrawal.',
            { parse_mode: 'Markdown' }
        );

        // Ask for amount
        await ctx.reply(
            '💰 *Enter Withdrawal Amount*\n\n' +
            'Please enter the amount you want to withdraw in USD:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            }
        );

    } catch (error) {
        logger.error({ error }, 'Error creating bank account');
        await ctx.reply(
            '❌ *Error Creating Bank Account*\n\n' +
            'We encountered an error while creating your bank account. Please try again later.',
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

/**
 * Handle withdrawal confirmation
 */
withdrawScene.action('confirm', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Processing your withdrawal...');

    // Validate that we have all necessary data
    if (!ctx.scene.session.quotePayload ||
        !ctx.scene.session.quoteSignature ||
        !ctx.scene.session.purposeCode) {
        await ctx.reply(
            '❌ *Withdrawal Failed*\n\n' +
            'We encountered an error processing your withdrawal. Some required information is missing.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
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
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                    ])
                }
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
                    [Markup.button.callback('📋 View Transfer History', 'history')],
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );

        return ctx.scene.leave();

    } catch (error) {
        logger.error({
            error,
            accountId: ctx.scene.session.accountId,
            amount: ctx.scene.session.amount
        }, 'Error processing withdrawal');

        await ctx.reply(
            '❌ *Withdrawal Failed*\n\n' +
            'We encountered an error processing your withdrawal. Please try again later.',
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

/**
 * Handle withdrawal cancellation
 */
withdrawScene.action('cancel', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Withdrawal cancelled.', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
        ])
    });
    return ctx.scene.leave();
});

/**
 * Handle /cancel command
 */
withdrawScene.command('cancel', async (ctx) => {
    await ctx.reply('Withdrawal cancelled.', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
        ])
    });
    return ctx.scene.leave();
});

/**
 * Handle history action
 */
withdrawScene.action('history', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Taking you to transfer history...');
    // Leave this scene and navigate to transfer history
    ctx.scene.leave();
    return ctx.scene.enter('transfer_details');
});

/**
 * Handle main menu action
 */
withdrawScene.action('main_menu', async (ctx) => {
    await ctx.answerCbQuery();
    // Leave this scene and go back to main menu
    return ctx.scene.leave();
});

/**
 * Reset session data
 */
function resetSessionData(ctx: WithdrawContext): void {
    ctx.scene.session.currentStep = 'select_account';
    ctx.scene.session.accountId = undefined;
    ctx.scene.session.amount = undefined;
    ctx.scene.session.purposeCode = undefined;
    ctx.scene.session.quotePayload = undefined;
    ctx.scene.session.quoteSignature = undefined;
    ctx.scene.session.providerId = undefined;
    ctx.scene.session.bankName = undefined;
    ctx.scene.session.bankAddress = undefined;
    ctx.scene.session.bankAccountType = undefined;
    ctx.scene.session.bankRoutingNumber = undefined;
    ctx.scene.session.bankAccountNumber = undefined;
    ctx.scene.session.bankBeneficiaryName = undefined;
    ctx.scene.session.bankBeneficiaryAddress = undefined;
    ctx.scene.session.swiftCode = undefined;
}

/**
 * Format bank account summary
 */
function formatBankAccountSummary(ctx: WithdrawContext): string {
    return `
🏦 *Bank Account Summary*

*Bank Details:*
Bank: ${ctx.scene.session.bankName}
Address: ${ctx.scene.session.bankAddress}
Account Type: ${ctx.scene.session.bankAccountType || 'Not specified'}
Routing Number: ${ctx.scene.session.bankRoutingNumber}
Account Number: XXXX${ctx.scene.session.bankAccountNumber?.substring(Math.max(0, ctx.scene.session.bankAccountNumber.length - 4))}
Beneficiary: ${ctx.scene.session.bankBeneficiaryName}
Beneficiary Address: ${ctx.scene.session.bankBeneficiaryAddress}
SWIFT: ${ctx.scene.session.swiftCode || 'Not provided'}
`;
}

/**
 * Handle amount input
 */
async function handleAmountInput(ctx: WithdrawContext, input: string): Promise<void> {
    // Validate amount is a number
    const amount = parseFloat(input);
    if (isNaN(amount) || amount <= 0) {
        await ctx.reply(
            '❌ *Invalid Amount*\n\n' +
            'Please enter a valid amount greater than 0:',
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

    // Get a quote for this withdrawal
    await ctx.reply('Getting quote for your withdrawal...');

    const quoteRequest: OfframpQuoteRequest = {
        sourceCountry: 'usa', // Default to USA as source
        destinationCountry: 'usa', // Default to USA as destination
        amount: input,
        currency: 'USD',
        preferredBankAccountId: ctx.scene.session.accountId
    };

    const quote = await quoteService.getOfframpQuote(quoteRequest);

    if (!quote || quote.error) {
        await ctx.reply(
            '❌ *Error Getting Quote*\n\n' +
            'We encountered an issue getting a quote for your withdrawal. ' +
            (quote?.error ? `Error: ${quote.error}` : 'Please try again later.'),
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
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
}

export { withdrawScene };