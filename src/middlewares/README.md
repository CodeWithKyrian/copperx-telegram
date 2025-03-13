# Middlewares Directory

This directory contains all the middleware functions for the CopperX Telegram bot. Middlewares are executed in the order they are registered and process each incoming update before it reaches command handlers.

## Structure

Each middleware is defined in its own file with a consistent format. The `index.ts` file exports a configuration function that registers all middlewares with the bot instance.

## Adding a New Middleware

To add a new middleware to the bot:

1. Create a new file named `your-middleware.middleware.ts` in this directory
2. Define your middleware using the following structure:

```typescript
import { MiddlewareFn } from 'telegraf';
import { GlobalContext } from '../types';

/**
 * Middleware for handling a specific functionality
 * @returns Telegraf middleware function
 */
export const yourMiddleware = (): MiddlewareFn<GlobalContext> => {
    return async (ctx, next) => {
        // Your middleware logic here
        
        // Process the update
        // ...
        
        // Call next to pass control to the next middleware
        await next();
    };
};
```

3. Import and register your middleware in `index.ts`:

```typescript
import { yourMiddleware } from './your-middleware.middleware';

// In the configureMiddlewares function
export const configureMiddlewares = (bot: Telegraf<GlobalContext>) => {
    // Existing middlewares
    
    // Add your new middleware
    bot.use(yourMiddleware());
};
```

## Existing Middlewares

The bot currently uses the following middlewares:

- **loggerMiddleware**: Logs incoming updates for debugging purposes
- **createSessionMiddleware**: Sets up session management for users
- **updateSessionMiddleware**: Updates user session data after each interaction

## Middleware Order

The order of middleware registration is important. For example, the session middleware must be registered before any middleware or handler that depends on session data.

In the current setup, middlewares are executed in the following order:

1. Logger middleware
2. Session creation middleware 
3. Session update middleware
4. Scene middleware (configured in scenes/index.ts)
5. Command handlers

This ensures that all necessary data is available when handling user interactions.