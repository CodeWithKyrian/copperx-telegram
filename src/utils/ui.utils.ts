import { Context } from 'telegraf';

/**
 * Shows a loading message and handles its lifecycle
 * @param ctx The Telegraf context
 * @param initialText Initial loading text
 * @returns Functions to update or complete the loading state
 */
export async function showLoading(ctx: Context, initialText: string) {
    // Send initial loading message
    const loadingMessage = await ctx.reply(initialText, { parse_mode: 'Markdown' });

    return {
        // Update the loading message
        update: async (newText: string) => {
            await ctx.telegram.editMessageText(
                ctx.chat?.id,
                loadingMessage.message_id,
                undefined,
                newText,
                { parse_mode: 'Markdown' }
            ).catch(() => { });
        },

        // Complete and remove the loading message
        complete: async () => {
            if (ctx.chat?.id) {
                await ctx.telegram.deleteMessage(
                    ctx.chat.id,
                    loadingMessage.message_id
                ).catch(() => { });
            }
        }
    };
}