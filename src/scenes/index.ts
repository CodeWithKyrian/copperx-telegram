import { Scenes, Telegraf } from 'telegraf';
import { GlobalContext } from '../types';
import { authScene } from './auth.scene';
import { walletCreateScene } from './create-wallet.scene';
import { defaultWalletScene } from './set-default-wallet.scene';
import { sendSingleScene } from './send-single.scene';
import { transferDetailsScene } from './transfer-details.scene';
import { withdrawScene } from './withdraw.scene';
import { sendBatchScene } from './send-batch.scene';
import { createPayeeScene } from './create-payee.scene';
import { removePayeeScene } from './remove-payee.scene';

export const SCENE_IDS = {
    AUTH: 'auth',
    WALLET_CREATE: 'wallet_create',
    WALLET_DEFAULT: 'wallet_default',
    WITHDRAW: 'withdraw',
    SEND_SINGLE: 'send_single',
    SEND_BATCH: 'send_batch',
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

        sendSingleScene,

        // @ts-ignore
        sendBatchScene,

        transferDetailsScene,

        // @ts-ignore
        createPayeeScene,

        removePayeeScene
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

