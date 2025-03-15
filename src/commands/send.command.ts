import { GlobalContext } from "../types";

export const sendCommand = async (ctx: GlobalContext) => {
    await ctx.scene.enter('transfer');
}

export async function sendAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('transfer');
}

export async function transferDetailsAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('transfer_details');
}

export async function transferHistoryAction(ctx: GlobalContext) {
    await ctx.answerCbQuery();
    await ctx.scene.enter('transfer_history');
}