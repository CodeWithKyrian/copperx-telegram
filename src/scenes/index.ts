import { Scenes, Telegraf } from 'telegraf';
import { GlobalContext } from '../types';
import { authScene } from './auth.scene';
import { walletCreateScene } from './wallet/create.scene';
import { defaultWalletScene } from './wallet/default.scene';
import { sendScene } from './send.scene';
import { transferDetailsScene } from './transfer-details.scene';
import { withdrawScene } from './withdraw.scene';

export const SCENE_IDS = {
    AUTH: 'auth',
    WALLET_CREATE: 'wallet_create',
    WALLET_DEFAULT: 'wallet_default',
    WITHDRAW: 'withdraw',
    SEND: 'send',
    TRANSFER_DETAILS: 'transfer_details'
};

/**
 * Configures scene manager for bot
 * @param bot Telegraf instance
 */
export const configureScenes = (bot: Telegraf<GlobalContext>): void => {
    const stage = new Scenes.Stage([
        authScene,

        walletCreateScene,

        defaultWalletScene,

        withdrawScene,

        sendScene,

        transferDetailsScene
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

