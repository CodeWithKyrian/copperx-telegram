import { GlobalContext } from "../types";
import { Markup } from 'telegraf';
import { walletService } from '../services/wallet.service';

export const sendCommand = async (ctx: GlobalContext) => {
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
        return;
    }

    // Present transfer options
    await ctx.reply(
        '💸 *Send Funds*\n\n' +
        'How would you like to proceed?',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('👤 Send to Single Recipient', 'send_funds:single')],
                [Markup.button.callback('👥 Send to Multiple Recipients', 'send_funds:batch')],
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        }
    );
}

export async function sendAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await sendCommand(ctx);
}

export async function sendSingleAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('send_single');
}

export async function sendBatchAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('send_batch');
}

export async function transferDetailsAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('transfer_details');
}