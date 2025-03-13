# Scenes Directory

This directory contains all the wizard and base scenes for the CopperX Telegram bot. Scenes are used to manage multi-step interactions such as authentication flows, form filling, and complex operations.

## Structure

Each scene is defined in its own file with a consistent format. The `index.ts` file exports a configuration function that registers all scenes with the bot instance through a Stage.

## Understanding Scenes

Scenes in Telegraf allow you to create isolated environments for handling specific user interactions. When a user enters a scene, global command handlers are temporarily disabled, and only the scene-specific handlers are active.

There are two main types of scenes in Telegraf:
- **BaseScene**: A simple scene with manually attached hooks (enter, leave, command, etc.)
- **WizardScene**: A multi-step scene with predefined step handlers

## Adding a New Scene

To add a new scene to the bot:

1. Create a new file named `your-scene.scene.ts` in this directory
2. Define your scene using the following structure:

```typescript
import { Scenes } from 'telegraf';
import { GlobalContext } from '../types/session.types';
import { message } from 'telegraf/filters';

// Export the scene ID for use in commands/other scenes
export const YOUR_SCENE_ID = 'your-scene';

// Define the session data structure for your scene
interface YourSceneSessionData extends Scenes.SceneSessionData {
    // Add any scene-specific session data here
    someData?: string;
}

// Define the context type for your scene
interface YourSceneContext extends GlobalContext {
    session: Scenes.SceneSession<YourSceneSessionData>;
    scene: Scenes.SceneContextScene<YourSceneContext, YourSceneSessionData>;
}

/**
 * Creates and configures your scene
 * @returns Configured scene
 */
export const createYourScene = (): Scenes.BaseScene<YourSceneContext> => {
    const scene = new Scenes.BaseScene<YourSceneContext>(YOUR_SCENE_ID);

    // Handler for scene entry
    scene.enter(async (ctx) => {
        await ctx.reply('Welcome to the scene!');
    });

    // Handle text messages
    scene.on(message('text'), async (ctx) => {
        const text = ctx.message.text;
        await ctx.reply(`You said: ${text}`);
        
        // Exit the scene when done
        await ctx.scene.leave();
    });

    // Handler for scene exit
    scene.leave(async (ctx) => {
        await ctx.reply('Exiting the scene!');
    });

    // Handler for cancel command
    scene.command('cancel', async (ctx) => {
        await ctx.reply('Operation cancelled');
        await ctx.scene.leave();
    });

    return scene;
};
```

3. Register your scene in `index.ts`:

```typescript
import { createYourScene, YOUR_SCENE_ID } from './your-scene.scene';

// In the configureScenes function
export const configureScenes = (bot: Telegraf<GlobalContext>): void => {
    const stage = new Scenes.Stage<GlobalContext>([
        createAuthScene(),
        createYourScene(), // Add your new scene here
    ]);

    bot.use(stage.middleware());
};

// Also add your scene ID to the exported constants
export const SCENE_IDS = {
    AUTH: AUTH_SCENE_ID,
    YOUR_SCENE: YOUR_SCENE_ID, // Add it here
};
```

4. Create a command to enter your scene:

```typescript
// In a command file
import { YOUR_SCENE_ID } from '../scenes/your-scene.scene';

const handleYourCommand = async (ctx: GlobalContext): Promise<void> => {
    await ctx.scene.enter(YOUR_SCENE_ID);
};
```

## Scene State Management

Each scene has its own session data that is stored in `ctx.scene.session`. This data persists while the user is in the scene and is cleared when they leave.

For storing data that needs to persist across scenes, use the global session (`ctx.session`).

## Current Scenes

The bot currently includes the following scenes:

- **AuthScene**: Handles the authentication flow with email OTP verification

## Best Practices

1. Always provide a way to exit the scene (like a `/cancel` command)
2. Keep scene handlers focused on the specific task
3. Store scene-specific data in scene.session, not in the global session
4. Use descriptive scene IDs to avoid conflicts
5. Export scene IDs from the scene file to maintain consistency