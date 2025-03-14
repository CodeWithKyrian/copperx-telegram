import { Scenes, Telegraf } from 'telegraf';
import { GlobalContext } from '../types';
import { createAuthScene } from './auth.scene';
import { walletCreateScene } from './wallet/create.scene';
import { defaultWalletScene } from './wallet/default.scene';
import { depositScene } from './transactions/deposit.scene';
import { transactionDetailsScene } from './transactions/details.scene';
import { transferScene } from './transfer.scene';

/**
 * Configures scene manager for bot
 * @param bot Telegraf instance
 */
export const configureScenes = (bot: Telegraf<GlobalContext>): void => {
    const stage = new Scenes.Stage([

        createAuthScene(),

        walletCreateScene,

        defaultWalletScene,

        depositScene,

        transactionDetailsScene,

        transferScene
    ]);

    stage.use(async (ctx, next) => {
        if (ctx.message && 'text' in ctx.message && ctx.message.text === '/cancel') {
            await ctx.reply('Operation cancelled.');
            await ctx.scene.leave();
            return;
        }
        await next();
    });

    bot.use(stage.middleware());
}

export const SCENE_IDS = {
    AUTH: 'auth',
    WALLET_CREATE: 'wallet_create',
    WALLET_DEFAULT: 'wallet_default',
    DEPOSIT: 'wallet_deposit'
};