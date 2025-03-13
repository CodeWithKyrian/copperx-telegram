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

## Protected Commands

Some commands require the user to be authenticated with their CopperX account before they can be used. Protected commands are defined in the `PROTECTED_COMMANDS` array in `index.ts`. The authentication middleware automatically checks this registry to determine if a command requires authentication.

To make your command a protected command:
1. Create your command following the standard pattern
2. Add your command object to the `PROTECTED_COMMANDS` array in `index.ts`:

```typescript
export const PROTECTED_COMMANDS = [
    logoutCommand,
    meCommand,
    yourNewCommand, // Add your protected command here
];
```

When a user attempts to use a protected command without being authenticated, they will automatically receive a message prompting them to log in. This centralized approach makes it easy to manage which commands require authentication without modifying the command handlers themselves.

## Available Commands

The bot currently supports the following commands:

- `/start` - Welcomes the user and introduces the bot
- `/help` - Shows a list of available commands and their descriptions
- `/about` - Displays information about the bot and CopperX
- `/login` - Initiates the authentication flow
- `/logout` - Logs the user out of their CopperX account
- `/me` - Displays the current user's profile information

## Command Handlers

Command handlers receive a `GlobalContext` object, which includes the Telegraf context extended with our custom session data. This allows commands to access and modify the user's session state.