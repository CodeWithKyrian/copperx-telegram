import { Scenes, Markup } from 'telegraf';
import { GlobalContext, GlobalSceneSession } from '../types/session.types';
import { walletService } from '../services/wallet.service';
import logger from '../utils/logger.utils';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { formatNetworkName } from '../utils/chain.utils';

interface DefaultWalletSessionData extends GlobalSceneSession {
    walletId?: string;
}

export type DefaultWalletContext = GlobalContext<DefaultWalletSessionData>;


const step1SelectWallet = async (ctx: DefaultWalletContext) => {
    // Check if wallet ID was pre-selected
    if (ctx.session.__scenes?.walletId) {
        await setDefaultWallet(ctx, ctx.session.__scenes?.walletId);
        return await ctx.scene.leave();
    }

    // Otherwise, get all wallets and show options
    const wallets = await walletService.getWallets();

    if (!wallets || wallets.length === 0) {
        await ctx.reply(
            '❌ *No Wallets Found*\n\n' +
            'You don\'t have any wallets to set as default. Please create a wallet first.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );
        return await ctx.scene.leave();
    }

    // Filter out current default wallet
    const nonDefaultWallets = wallets.filter(wallet => !wallet.isDefault);

    if (nonDefaultWallets.length === 0) {
        await ctx.reply(
            '❓ *All Set*\n\n' +
            'You only have one wallet, which is already set as default.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('💼 View All Wallets', 'view_wallets')],
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );
        return await ctx.scene.leave();
    }

    // Create buttons for each non-default wallet
    const walletButtons = nonDefaultWallets.map(wallet => {
        const network = formatNetworkName(wallet.network);
        return Markup.button.callback(
            `${network} Wallet`,
            `select_default:${wallet.id}`
        );
    });

    await ctx.reply(
        '🔄 *Set Default Wallet*\n\n' +
        'Please select which wallet you would like to set as your default:',
        {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                ...walletButtons.map(button => [button]),
                [Markup.button.callback('❌ Cancel', 'cancel')]
            ])
        }
    );

    return ctx.wizard.next();
};

const step2HandleSelection = async (ctx: DefaultWalletContext) => {
    if (!('callback_query' in ctx.update)) {
        await ctx.reply(
            'Please select a wallet from the options above.',
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
        await ctx.reply('Operation cancelled.', {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
            ])
        });
        return await ctx.scene.leave();
    }

    if (callbackData.startsWith('select_default:')) {
        const walletId = callbackData.split(':')[1];
        await ctx.answerCbQuery();
        await setDefaultWallet(ctx, walletId);
        return await ctx.scene.leave();
    }

    await ctx.answerCbQuery('Invalid selection');
};

const defaultWalletScene = new Scenes.WizardScene<DefaultWalletContext>(
    'wallet_default',
    step1SelectWallet,
    step2HandleSelection
);


/**
 * Sets the specified wallet as the default
 */
async function setDefaultWallet(ctx: GlobalContext, walletId: string): Promise<void> {
    await ctx.reply('🔄 Setting default wallet...');

    try {
        const wallet = await walletService.setDefaultWallet(walletId);

        if (!wallet) {
            await ctx.reply(
                '❌ *Error Setting Default Wallet*\n\n' +
                'We encountered an issue while updating your default wallet. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                    ])
                }
            );
            return;
        }

        // Success!
        const network = formatNetworkName(wallet.network);
        await ctx.reply(
            `✅ *Default Wallet Updated*\n\n` +
            `Your ${network} wallet has been set as the default wallet.`,
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('💼 View All Wallets', 'view_wallets')]
                ])
            }
        );
    } catch (error) {
        logger.error('Error setting default wallet', { error, walletId });
        await ctx.reply(
            '❌ *Error Setting Default Wallet*\n\n' +
            'We encountered an error while updating your default wallet. Please try again later.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );
    }
}

defaultWalletScene.action('cancel', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Operation cancelled.', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
        ])
    });
    return await ctx.scene.leave();
});

export { defaultWalletScene };