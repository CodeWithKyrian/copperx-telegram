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
• /me - View your profile information

*Wallet Management:*
• /wallet - View your wallets and balances
• /deposit - Start the deposit process

*Coming Soon:*
• /transfer - Send funds to another user or wallet

*Transactions:*
• /transactions - View your transaction history

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