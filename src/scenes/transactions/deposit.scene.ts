import { Scenes, Markup } from 'telegraf';
import { GlobalContext, GlobalSceneSession } from '../../types';
import { walletService } from '../../services/wallet.service';
import { formatWalletAddress } from '../../utils/formatters';
import { formatNetworkName } from '../../utils/chain.utils';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';

interface DepositSceneSessionData extends GlobalSceneSession {
    walletId?: string;
}

/**
 * Scene for handling wallet deposits
 */
export const depositScene = new Scenes.WizardScene<GlobalContext<DepositSceneSessionData>>(
    'wallet_deposit',

    // Step 1: Select wallet for deposit or use provided walletId
    async (ctx) => {
        // Check if wallet ID was pre-selected
        if (ctx.state.walletId) {
            await showDepositAddress(ctx, ctx.state.walletId);
            return ctx.wizard.next();
        }

        // Otherwise, get user's wallets
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
            return await ctx.scene.leave();
        }

        // Show wallets for selection
        const walletButtons = wallets.map(wallet => {
            const label = wallet.isDefault
                ? `✓ ${formatNetworkName(wallet.network)} Wallet`
                : `${formatNetworkName(wallet.network)} (${formatWalletAddress(wallet.walletAddress || '')})`;
            return Markup.button.callback(label, `deposit_to_wallet:${wallet.id}`);
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

        return ctx.wizard.next();
    },

    // Step 2: Process wallet selection and show deposit address
    async (ctx) => {
        if (!('callback_query' in ctx.update)) {
            return;
        }

        const callbackQuery = ctx.update.callback_query as CallbackQuery.DataQuery;
        const callbackData = callbackQuery.data;

        if (callbackData === 'cancel') {
            await ctx.answerCbQuery();
            await ctx.reply('Deposit cancelled.');
            return await ctx.scene.leave();
        }

        if (callbackData === 'create_wallet') {
            await ctx.answerCbQuery();
            await ctx.scene.leave();
            return await ctx.scene.enter('wallet_create');
        }

        if (callbackData.startsWith('deposit_to_wallet:')) {
            const walletId = callbackData.split(':')[1];
            await ctx.answerCbQuery();
            await showDepositAddress(ctx, walletId);
            return;
        }

        if (callbackData === 'deposit_done') {
            await ctx.answerCbQuery();
            await ctx.reply('✅ Thank you! Your deposit will be credited to your account once confirmed on the blockchain.');
            return await ctx.scene.leave();
        }

        await ctx.answerCbQuery('Invalid selection');
        return;
    }
);

/**
 * Shows the deposit address for the selected wallet
 */
async function showDepositAddress(ctx: GlobalContext, walletId: string): Promise<void> {
    // Get the wallet details
    const wallet = await walletService.getWalletById(walletId);

    if (!wallet) {
        await ctx.reply(
            '❌ *Error*\n\n' +
            'We couldn\'t retrieve your wallet information. Please try again later.',
            { parse_mode: 'Markdown' }
        );
        return await ctx.scene.leave();
    }

    const network = formatNetworkName(wallet.network);
    const address = wallet.walletAddress;

    if (!address) {
        await ctx.reply(
            '❌ *Error*\n\n' +
            'This wallet doesn\'t have a deposit address. Please try another wallet or contact support.',
            { parse_mode: 'Markdown' }
        );
        return await ctx.scene.leave();
    }

    await ctx.reply(
        `💰 *Deposit to ${network} Wallet*\n\n` +
        `Send USDC to the following address on the ${network} network:\n\n` +
        `\`${address}\`\n\n` +
        '⚠️ *Important*: Only send USDC on the correct network. ' +
        'Sending other tokens or using the wrong network may result in lost funds.',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('✅ Done', 'deposit_done')]
            ])
        }
    );
}

// Add action handlers
depositScene.action('cancel', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Deposit cancelled.');
    return await ctx.scene.leave();
});

depositScene.action('deposit_done', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('✅ Thank you! Your deposit will be credited to your account once confirmed on the blockchain.');
    return await ctx.scene.leave();
}); 