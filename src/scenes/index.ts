import { Scenes, Telegraf } from 'telegraf';
import { createAuthScene, AUTH_SCENE_ID } from './auth.scene';
import { GlobalContext } from '../types/session.types';

/**
 * Configures scene manager for bot
 * @param bot Telegraf instance
 */
export const configureScenes = (bot: Telegraf<GlobalContext>): void => {
    const stage = new Scenes.Stage<GlobalContext>([
        createAuthScene(),
    ]);

    bot.use(stage.middleware());
};

export const SCENE_IDS = {
    AUTH: AUTH_SCENE_ID,
};