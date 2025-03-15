import { GlobalContext } from '../types';

/**
 * Handles the /help command
 */
export const helpCommand = async (ctx: GlobalContext): Promise<void> => {
    const message = `
🤖 *CopperX Telegram Bot Help*

*Basic Commands:*
• /start - Start the bot and get welcome information
• /help - Show this help message

*Authentication:*
• /login - Sign in with your CopperX account
• /logout - Sign out from your account

*Account Management:*
• /kyc - Check your KYC status
• /profile - View your profile information

*Wallet Management:*
• /wallet - View your wallets and balances
• /deposit - Start the deposit process
• /send - Send funds to an email or wallet address
• /withdraw - Withdraw funds to a bank account
• /history - View your transfer history


*Support:*
If you need further assistance, please contact [CopperX Support](https://t.me/copperxcommunity/2183).
    `;

    await ctx.reply(message, {
        parse_mode: 'Markdown',
        link_preview_options: {
            is_disabled: true
        }
    });
};

export const helpAction = async (ctx: GlobalContext): Promise<void> => {
    await ctx.answerCbQuery();
    await helpCommand(ctx);
};
