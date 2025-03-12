import { Context } from "telegraf";

const handleStartCommand = (ctx: Context) => {
    ctx.reply('Welcome to CopperX Telegram Bot! 🚀\n\nI can help you manage your USDC transactions directly through Telegram.\n\nUse /help to see available commands.');
};

export const startCommand = {
    name: 'start',
    description: 'Start the bot',
    handler: handleStartCommand,
};

