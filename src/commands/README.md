# Commands Directory

This directory contains all the command handlers for the CopperX Telegram bot.

## Structure

Each command is defined in its own file with a consistent format. The `index.ts` file exports a configuration function that registers all commands with the bot instance.

## Adding a New Command

To add a new command to the bot:

1. Create a new file named `your-command.command.ts` in this directory
2. Define your command handler using the following structure:

```typescript
import { GlobalContext } from '../types';

/**
 * Handler for the /yourCommand command
 * @param ctx Telegraf context
 */
const handleYourCommand = async (ctx: GlobalContext): Promise<void> => {
    // Your command implementation here
    await ctx.reply('Your command response');
};

export const yourCommand = {
    name: 'yourcommand', // The command name without the leading slash
    description: 'Description of your command', // For the /help command and BotFather
    handler: handleYourCommand,
};
```

3. Import and register your command in `index.ts`:

```typescript
// Import your command
import { yourCommand } from './your-command.command';

// Add it to the bot.command() registration
bot.command(yourCommand.name, yourCommand.handler);
```

## Available Commands

The bot currently supports the following commands:

- `/start` - Welcomes the user and introduces the bot
- `/help` - Shows a list of available commands and their descriptions
- `/about` - Displays information about the bot and CopperX
- `/login` - Initiates the authentication flow
- `/logout` - Logs the user out of their CopperX account

## Command Handlers

Command handlers receive a `GlobalContext` object, which includes the Telegraf context extended with our custom session data. This allows commands to access and modify the user's session state.