import { GlobalContext } from "../types";

export const transferCommand = async (ctx: GlobalContext) => {
    await ctx.answerCbQuery();
    await ctx.reply('The transfer feature will be available soon.');
}

export async function transferAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.reply('The transfer feature will be available soon.');
}