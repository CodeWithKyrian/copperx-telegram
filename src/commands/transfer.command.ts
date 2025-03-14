import { GlobalContext } from "../types";

export const transferCommand = async (ctx: GlobalContext) => {
    await ctx.scene.enter('transfer');
}

export async function transferAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('transfer');
}