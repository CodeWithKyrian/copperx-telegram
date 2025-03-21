import { Scenes, Markup } from 'telegraf';
import { GlobalContext, GlobalSceneSession } from '../types';
import { payeeService } from '../services/payee.service';
import logger from '../utils/logger.utils';
import { isValidEmail } from '../utils/validators';
import { message } from 'telegraf/filters';

interface CreatePayeeSessionData extends GlobalSceneSession {
    currentStep: 'email' | 'nickname' | 'firstName' | 'lastName' | 'confirmation';
    payeeData: {
        email: string;
        nickName: string;
        firstName: string;
        lastName: string;
    };
}

export type CreatePayeeContext = GlobalContext<CreatePayeeSessionData>;

const createPayeeScene = new Scenes.BaseScene<CreatePayeeContext>('create_payee');

createPayeeScene.enter(async (ctx) => {
    let providedEmail = '';
    if ('email' in ctx.scene.state) {
        providedEmail = ctx.scene.state.email as string;
    }

    ctx.scene.session.currentStep = providedEmail ? 'nickname' : 'email';
    ctx.scene.session.payeeData = {
        email: providedEmail || '',
        nickName: '',
        firstName: '',
        lastName: ''
    };

    // If email is already provided, ask for nickname directly
    if (providedEmail) {
        await askForNickname(ctx);
    } else {
        // Otherwise, ask for email first
        await ctx.reply(
            '📧 *Add New Payee*\n\n' +
            'Please enter the email address of the payee:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel_payee')]
                ])
            }
        );
    }
});

// Handle all text messages based on current step
createPayeeScene.on(message('text'), async (ctx) => {
    const text = ctx.message.text.trim();

    switch (ctx.scene.session.currentStep) {
        case 'email':
            // Validate email
            if (!isValidEmail(text)) {
                await ctx.reply(
                    '❌ *Invalid Email Format*\n\n' +
                    'Please enter a valid email address:',
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            // Save email and move to nickname step
            ctx.scene.session.payeeData.email = text;
            ctx.scene.session.currentStep = 'nickname';
            await askForNickname(ctx);
            break;

        case 'nickname':
            // Validate nickname (simple length check)
            if (text.length < 2) {
                await ctx.reply(
                    '❌ *Invalid Nickname*\n\n' +
                    'Please enter a nickname with at least 2 characters:',
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            // Save nickname and move to first name step
            ctx.scene.session.payeeData.nickName = text;
            ctx.scene.session.currentStep = 'firstName';
            await askForFirstName(ctx);
            break;

        case 'firstName':
            // Save first name and move to last name step
            ctx.scene.session.payeeData.firstName = text;
            ctx.scene.session.currentStep = 'lastName';
            await askForLastName(ctx);
            break;

        case 'lastName':
            // Save last name and show confirmation
            ctx.scene.session.payeeData.lastName = text;
            ctx.scene.session.currentStep = 'confirmation';
            await showConfirmation(ctx);
            break;

        default:
            // Handle unexpected state
            await ctx.reply(
                'Something went wrong. Please try again or type /cancel to exit.',
                Markup.inlineKeyboard([
                    [Markup.button.callback('❌ Cancel', 'cancel_payee')]
                ])
            );
    }
});

createPayeeScene.action('skip_first_name', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.scene.session.payeeData.firstName = '';
    ctx.scene.session.currentStep = 'lastName';
    await askForLastName(ctx);
});

createPayeeScene.action('skip_last_name', async (ctx) => {
    await ctx.answerCbQuery();
    ctx.scene.session.payeeData.lastName = '';
    ctx.scene.session.currentStep = 'confirmation';
    await showConfirmation(ctx);
});

createPayeeScene.action('confirm_payee', async (ctx) => {
    await ctx.answerCbQuery();
    await createPayee(ctx);
});

createPayeeScene.action('cancel_payee', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Payee creation cancelled.', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
        ])
    });
    return ctx.scene.leave();
});

createPayeeScene.command('cancel', async (ctx) => {
    await ctx.reply('Payee creation cancelled.', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
        ])
    });
    return ctx.scene.leave();
});

// Helper functions
async function askForNickname(ctx: CreatePayeeContext): Promise<void> {
    await ctx.reply(
        '👤 *Add New Payee*\n\n' +
        `Email: *${ctx.scene.session.payeeData.email}*\n\n` +
        'Please enter a nickname for this payee:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('❌ Cancel', 'cancel_payee')]
            ])
        }
    );
}

async function askForFirstName(ctx: CreatePayeeContext): Promise<void> {
    await ctx.reply(
        '👤 *First Name (Optional)*\n\n' +
        'Please enter the first name of the payee or click Skip:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('⏩ Skip', 'skip_first_name')],
                [Markup.button.callback('❌ Cancel', 'cancel_payee')]
            ])
        }
    );
}

async function askForLastName(ctx: CreatePayeeContext): Promise<void> {
    await ctx.reply(
        '👤 *Last Name (Optional)*\n\n' +
        'Please enter the last name of the payee or click Skip:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('⏩ Skip', 'skip_last_name')],
                [Markup.button.callback('❌ Cancel', 'cancel_payee')]
            ])
        }
    );
}

async function showConfirmation(ctx: CreatePayeeContext): Promise<void> {
    const { email, nickName, firstName, lastName } = ctx.scene.session.payeeData;

    let message = '🔍 *Confirm Payee Details*\n\n';
    message += `*Email:* ${email}\n`;
    message += `*Nickname:* ${nickName}\n`;

    if (firstName) {
        message += `*First Name:* ${firstName}\n`;
    }

    if (lastName) {
        message += `*Last Name:* ${lastName}\n`;
    }

    message += '\nPlease confirm these details:';

    await ctx.reply(
        message,
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [
                    Markup.button.callback('✅ Confirm', 'confirm_payee'),
                    Markup.button.callback('❌ Cancel', 'cancel_payee')
                ]
            ])
        }
    );
}

async function createPayee(ctx: CreatePayeeContext): Promise<void> {
    await ctx.reply('🔄 Creating payee...');

    try {
        const { email, nickName, firstName, lastName } = ctx.scene.session.payeeData;

        const result = await payeeService.createPayee({
            email,
            nickName,
            firstName: firstName || undefined,
            lastName: lastName || undefined
        });

        if (!result) {
            await ctx.reply(
                '❌ *Failed to Create Payee*\n\n' +
                'We encountered an error creating this payee. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                    ])
                }
            );
            return ctx.scene.leave();
        }

        await ctx.reply(
            '✅ *Payee Created Successfully*\n\n' +
            `*Nickname:* ${result.nickName}\n` +
            `*Email:* ${result.email}\n\n` +
            'You can now quickly send funds to this payee using the /send command.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('👥 View All Payees', 'list_payees')],
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );

        return ctx.scene.leave();
    } catch (error) {
        logger.error({ error }, 'Error creating payee');

        await ctx.reply(
            '❌ *Failed to Create Payee*\n\n' +
            'We encountered an error creating this payee. Please try again later.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );
        return ctx.scene.leave();
    }
}

export { createPayeeScene }; 