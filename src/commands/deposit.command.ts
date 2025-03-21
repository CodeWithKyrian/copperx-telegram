import { Markup } from "telegraf";
import { walletService } from "../services/wallet.service";
import { GlobalContext } from "../types";
import { formatNetworkName } from "../utils/chain.utils";
import { formatWalletAddress } from "../utils/formatters.utils";
import logger from "../utils/logger.utils";
import { generateQRCodeWithLogo } from "../utils/qrcode.utils";
import { showLoading } from "../utils/ui.utils";

export const depositCommand = async (ctx: GlobalContext) => {
    try {
        const wallets = await walletService.getWallets();

        if (!wallets || wallets.length === 0) {
            await ctx.reply(
                '❌ *No Wallets Found*\n\n' +
                'You need to create a wallet first before you can deposit funds.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('➕ Create a Wallet', 'create_wallet')],
                        [Markup.button.callback('❌ Cancel', 'cancel')]
                    ])
                }
            );
            return;
        }

        const walletButtons = wallets.map(wallet => {
            const label = wallet.isDefault
                ? `${formatNetworkName(wallet.network)} Wallet (Default)`
                : `${formatNetworkName(wallet.network)} (${formatWalletAddress(wallet.walletAddress || '')})`;
            return Markup.button.callback(label, `deposit_funds:${wallet.id}`);
        });

        await ctx.reply(
            '💸 *Deposit Funds*\n\n' +
            'To deposit funds, you can send USDC to your wallet address. Please select which wallet you want to deposit to:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    ...walletButtons.map(button => [button]),
                    [Markup.button.callback('❌ Cancel', 'cancel')]
                ])
            }
        );
    } catch (error) {
        logger.error({ error }, 'Error in deposit command');
        await ctx.reply(
            '❌ *Error*\n\n' +
            'We encountered an error while trying to process your deposit request. Please try again later.',
            { parse_mode: 'Markdown' }
        );
    }
};

export async function depositAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await depositCommand(ctx);
}

export async function depositActionWithWallet(ctx: GlobalContext & { match: RegExpExecArray }) {
    await ctx.answerCbQuery();
    const walletId = ctx.match[1];

    try {
        // Get the wallet details
        const wallet = await walletService.getWalletById(walletId);

        if (!wallet) {
            await ctx.reply(
                '❌ *Error*\n\n' +
                'We couldn\'t retrieve your wallet information. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')],
                        [Markup.button.callback('🔄 Try Again', 'deposit_funds')]
                    ])
                }
            );
            return;
        }

        const network = formatNetworkName(wallet.network);
        const address = wallet.walletAddress;

        if (!address) {
            await ctx.reply(
                '❌ *Error*\n\n' +
                'This wallet doesn\'t have a deposit address. Please try another wallet or contact support.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')],
                        [Markup.button.callback('📞 Contact Support', 'support')]
                    ])
                }
            );
            return;
        }

        // Send the main deposit information message first
        await ctx.reply(
            `📥 *Deposit to CopperX Wallet*\n\n` +
            `*Step-by-Step Instructions:*\n\n` +
            `1️⃣ *Copy your deposit address:*\n` +
            `\`${address}\`\n\n` +
            `2️⃣ *Select the correct network:*\n` +
            `*${network}*\n\n` +
            `3️⃣ *Send USDC to this address*\n\n` +
            `4️⃣ *Wait for blockchain confirmation*\n\n` +
            `⚠️ *Important Reminders:*\n` +
            `• Only send USDC to this address\n` +
            `• Triple-check the network before sending\n` +
            `• Small test transactions are recommended\n` +
            `• Funds will appear after network confirmation`,
            {
                parse_mode: 'Markdown'
            }
        );

        const loadingMsg = await showLoading(ctx, '🔄 *Generating QR code for your deposit address...*');

        const qrCodeImagePath = await generateQRCodeWithLogo(address, wallet.network!);

        await loadingMsg.complete();

        await ctx.replyWithPhoto({ source: qrCodeImagePath }, {
            caption: `📱 *Scan QR Code to Deposit*\n\nNetwork: *${network}*\n\nUse /history to check your deposit status.`,
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ I\'ve Completed My Deposit', 'deposit_done')],
                [Markup.button.callback('📜 Transaction History', 'history')],
                [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
            ])
        });

    } catch (error) {
        logger.error({ error, walletId }, 'Error in deposit action with wallet');
        await ctx.reply(
            '❌ *Error*\n\n' +
            'We encountered an error while retrieving your deposit information. Please try again later.',
            { parse_mode: 'Markdown' }
        );
    }
}

export async function depositDoneAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.reply('✅ Thank you! Your deposit will be credited to your account once confirmed on the blockchain.');
    return await ctx.scene.leave();
}