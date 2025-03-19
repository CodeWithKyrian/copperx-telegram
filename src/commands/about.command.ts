import { Context } from 'telegraf';

export const aboutCommand = (ctx: Context) => {
    ctx.reply('CopperX is building a stablecoin bank for individuals and businesses.\n\n' +
        'This bot allows you to deposit, withdraw, and transfer USDC directly through Telegram without visiting our web app.\n\n' +
        'For support, please visit: https://t.me/copperxcommunity/2183');
};

export const aboutAction = (ctx: Context) => {
    ctx.answerCbQuery();
    aboutCommand(ctx);
};

