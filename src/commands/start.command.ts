import { Context } from "telegraf";

export const startCommand = (ctx: Context) => {
    ctx.reply('Welcome to CopperX Telegram Bot! 🚀\n\nI can help you manage your USDC transactions directly through Telegram.\n\nUse /help to see available commands.');
};

