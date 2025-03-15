import { Markup } from 'telegraf';
import { GlobalContext } from '../types';
import { walletService } from '../services/wallet.service';
import logger from '../utils/logger';
import { WalletBalance, Wallet } from '../types/api.types';
import { formatBalance, formatWalletAddress } from '../utils/formatters';
import { formatNetworkName } from '../utils/chain.utils';
import { SCENE_IDS } from '../scenes';

/**
 * Handles the /wallet command - shows wallet information and options
 */
export const walletCommand = async (ctx: GlobalContext): Promise<void> => {
    try {
        // Check if user has any wallets
        const wallets = await walletService.getWallets();

        if (!wallets || wallets.length === 0) {
            // No wallets found, offer to create one
            return await handleNoWallets(ctx);
        }

        // User has wallets, get and format balances
        const balances = await walletService.getWalletBalances();

        if (!balances) {
            await ctx.reply(
                '❌ *Error retrieving wallet balances*\n\n' +
                'We encountered an issue while retrieving your wallet balances. Please try again later.',
                { parse_mode: 'Markdown' }
            );
            return;
        }

        // Display wallet summary and options
        await displayWalletSummary(ctx, wallets, balances);

    } catch (error) {
        logger.error('Error in wallet command', { error });
        await ctx.reply(
            '❌ *Something went wrong*\n\n' +
            'We encountered an error while processing your request. Please try again later.',
            { parse_mode: 'Markdown' }
        );
    }
};

/**
 * Handles the action to view wallets
 */
export async function viewWalletsAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    return await walletCommand(ctx);
}

/**
 * Handles the action to create a wallet
 */
export async function walletCreateAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    return await ctx.scene.enter(SCENE_IDS.WALLET_CREATE);
}

/**
 * Handles the action to set a default wallet
 */
export async function walletSetDefaultAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    return await ctx.scene.enter(SCENE_IDS.WALLET_DEFAULT);
}

/**
 * Handles the action to set a default wallet with a specific wallet ID
 */
export async function walletSetDefaultActionWithWallet(ctx: GlobalContext & { match: RegExpExecArray }) {
    await ctx.answerCbQuery();
    const walletId = ctx.match[1];
    await ctx.scene.leave();
    return await ctx.scene.enter(SCENE_IDS.WALLET_DEFAULT, { walletId });
}

/**
 * Handles the action to cancel a wallet operation
 */
export async function walletCancelAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.reply('Operation cancelled.');
}

/**
 * Handles case when user has no wallets
 */
async function handleNoWallets(ctx: GlobalContext): Promise<void> {
    await ctx.reply(
        '💼 *No Wallets Found*\n\n' +
        'You don\'t have any wallets set up yet. Would you like to create one?',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('➕ Create a Wallet', 'wallet_create')],
                [Markup.button.callback('❌ Cancel', 'wallet_cancel')]
            ])
        }
    );
}

/**
 * Displays wallet summary with balances and action options
 */
async function displayWalletSummary(
    ctx: GlobalContext,
    wallets: Wallet[],
    balances: WalletBalance[]
): Promise<void> {
    // Get total balance for display at the top
    const totalBalance = await walletService.getTotalBalance();

    // Format the summary message
    let message = '💼 *Your CopperX Wallet*\n\n';

    // Add total balance if available
    if (totalBalance) {
        message += `*Total Balance:* ${formatBalance(totalBalance)}\n\n`;
    }

    // Format balances per wallet
    message += '*Your Wallets:*\n';

    for (const balance of balances) {
        const wallet = wallets.find(w => w.id === balance.walletId);
        if (!wallet) continue;

        const isDefault = wallet.isDefault ? '✓ ' : '';
        const network = formatNetworkName(wallet.network);

        message += `\n🔹 ${isDefault}*${network}* Wallet\n`;
        message += `ID: \`${truncateId(wallet.id)}\`\n`;

        if (wallet.walletAddress) {
            message += `Address: \`${formatWalletAddress(wallet.walletAddress)}\`\n`;
        }

        if (balance.balances && balance.balances.length > 0) {
            for (const coin of balance.balances) {
                message += `${coin.symbol}: ${formatBalance(coin)}\n`;
            }
        } else {
            message += `No balances found\n`;
        }
    }

    const keyboard = Markup.inlineKeyboard([
        [
            Markup.button.callback('💸 Deposit', 'deposit_create'),
            Markup.button.callback('📤 Send', 'send_create'),
            Markup.button.callback('💳 Withdraw', 'withdraw_create')
        ],
        [
            Markup.button.callback('➕ Create New Wallet', 'wallet_create'),
        ], [
            Markup.button.callback('🔁 Set Default Wallet', 'wallet_set_default')
        ],
        [
            Markup.button.callback('📋 Transaction History', 'history')
        ]
    ]);

    await ctx.reply(message, {
        parse_mode: 'Markdown',
        ...keyboard
    });
}

/**
 * Truncates wallet ID for display
 */
function truncateId(id: string): string {
    if (!id) return '';
    if (id.length <= 8) return id;

    return id.substring(0, 8);
}
