import { Scenes, Markup } from 'telegraf';
import { walletService } from '../services/wallet.service';
import logger from '../utils/logger.utils';
import { formatWalletInfo } from '../utils/formatters.utils';
import { GlobalContext, GlobalSceneSession } from '../types/session.types';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { formatNetworkName } from '../utils/chain.utils';

interface WalletCreateSessionData extends GlobalSceneSession {
    network?: string;
}

export type WalletCreateContext = GlobalContext<WalletCreateSessionData>;


/**
 * Scene for creating a new wallet
 */
const walletCreateScene = new Scenes.WizardScene<WalletCreateContext>(
    'wallet_create',

    // Step 1: Show network options
    async (ctx) => {
        // Check if network was pre-selected
        if (ctx.session.__scenes?.network) {
            await createWallet(ctx, ctx.session.__scenes?.network);
            return await ctx.scene.leave();
        }

        // Otherwise, get supported networks
        const networks = await walletService.getSupportedNetworks();

        if (!networks || networks.length === 0) {
            await ctx.reply(
                '❌ *Error*\n\n' +
                'We couldn\'t retrieve the list of supported networks. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                    ])
                }
            );
            return await ctx.scene.leave();
        }

        // Create buttons for each network
        const networkButtons = networks.map(network =>
            Markup.button.callback(formatNetworkName(network), `select_network:${network}`)
        );

        // Group buttons into rows of 2
        const buttonRows = [];
        for (let i = 0; i < networkButtons.length; i += 2) {
            buttonRows.push(networkButtons.slice(i, i + 2));
        }

        await ctx.reply(
            '💼 *Create New Wallet*\n\n' +
            'Please select the blockchain network for your new wallet:',
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

    // Step 2: Handle network selection and create wallet
    async (ctx) => {
        if (!('callback_query' in ctx.update)) {
            await ctx.reply(
                'Please select a network from the options above.',
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
            await ctx.reply('Wallet creation cancelled.');
            return await ctx.scene.leave();
        }

        if (callbackData.startsWith('select_network:')) {
            const network = callbackData.split(':')[1];
            await ctx.answerCbQuery();
            await createWallet(ctx, network);
            return await ctx.scene.leave();
        }

        await ctx.answerCbQuery('Invalid selection');
    }
);

/**
 * Creates a new wallet on the specified network
 */
async function createWallet(ctx: GlobalContext, network: string): Promise<void> {
    await ctx.reply(
        `🔄 Creating your ${formatNetworkName(network)} wallet...`
    );

    try {
        const wallet = await walletService.generateWallet({ network });

        if (!wallet) {
            await ctx.reply(
                '❌ *Error Creating Wallet*\n\n' +
                'We encountered an issue while creating your wallet. Please try again later.',
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                    ])
                }
            );
            return;
        }

        // Success! Display the new wallet info
        await ctx.reply(
            '✅ *Wallet Created Successfully!*\n\n' +
            formatWalletInfo(wallet),
            { parse_mode: 'Markdown' }
        );

        // Show options to continue
        await ctx.reply(
            'What would you like to do next?',
            Markup.inlineKeyboard([
                [Markup.button.callback('💼 View All Wallets', 'view_wallets')],
                [Markup.button.callback('💸 Deposit to this Wallet', `deposit_funds:${wallet.id}`)],
                [Markup.button.callback('✓ Set as Default', `set_default_wallet:${wallet.id}`)]
            ])
        );
    } catch (error) {
        logger.error('Error creating wallet', { error, network });
        await ctx.reply(
            '❌ *Error Creating Wallet*\n\n' +
            'We encountered an error while creating your wallet. Please try again later.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
                ])
            }
        );

        return await ctx.scene.leave();
    }
}

walletCreateScene.action('cancel', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Wallet creation cancelled.', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 Back to Menu', 'main_menu')]
        ])
    });
    return await ctx.scene.leave();
});

export { walletCreateScene };