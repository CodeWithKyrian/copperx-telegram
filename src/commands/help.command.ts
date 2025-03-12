import { Context } from 'telegraf';

const handleHelpCommand = (ctx: Context) => {
    ctx.reply('Here are the available commands:\n\n' +
        '/start - Start the bot\n' +
        '/help - Show this help message\n' +
        '/about - About CopperX\n\n' +
        'More commands will be available after you authenticate.');
};

export const helpCommand = {
    name: 'help',
    description: 'Show help information',
    handler: handleHelpCommand,
};

