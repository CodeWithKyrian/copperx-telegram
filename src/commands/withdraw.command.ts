import { GlobalContext } from '../types';

/**
 * Handles the /withdraw command to initiate a bank withdrawal
 */
export const withdrawCommand = async (ctx: GlobalContext): Promise<void> => {
    await ctx.scene.enter('withdraw');
};

export async function withdrawAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('withdraw');
}