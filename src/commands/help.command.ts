import { Context } from 'telegraf';

export const helpCommand = (ctx: Context) => {
    ctx.reply('Here are the available commands:\n\n' +
        '/start - Start the bot\n' +
        '/help - Show this help message\n' +
        '/about - About CopperX\n\n' +
        '/login - Login to your CopperX account\n' +
        'The following commands will be available after you authenticate:\n' +
        '/me - Show your profile information\n' +
        '/logout - Logout from your CopperX account\n\n' +
        'More commands will be available after you authenticate.');
};