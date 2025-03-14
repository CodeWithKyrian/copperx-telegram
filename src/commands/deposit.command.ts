import { SCENE_IDS } from "../scenes";
import { GlobalContext } from "../types";

export const depositCommand = async (ctx: GlobalContext) => {
    return ctx.scene.enter(SCENE_IDS.DEPOSIT);
};

export async function depositAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    return await ctx.scene.enter(SCENE_IDS.DEPOSIT);
}

export async function depositActionWithWallet(ctx: GlobalContext & { match: RegExpExecArray }) {
    await ctx.answerCbQuery();
    const walletId = ctx.match[1];
    await ctx.scene.leave();
    return await ctx.scene.enter(SCENE_IDS.DEPOSIT, { walletId });
}