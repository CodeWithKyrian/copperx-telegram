# CopperX Telegram Bot - Project Structure & Code Flow

This document provides a deep dive into the structure and code flow of the CopperX Telegram Bot, helping developers understand how the various components work together.

## Directory Structure

The project follows a modular architecture:

```
copperx-telegram/
├── src/                   # Source code
│   ├── api/               # API integration modules
│   ├── commands/          # Bot command handlers
│   ├── config/            # Configuration
│   ├── middlewares/       # Telegram bot middlewares
│   ├── scenes/            # Interactive conversation flows
│   ├── services/          # Business logic services
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── bot.ts             # Bot configuration
│   ├── server.ts          # HTTP server and webhook configuration
│   └── index.ts           # Application entry point
├── scripts/               # Helper scripts
├── tests/                  # Test files
└── docs/                  # Documentation
```

## Application Flow

### Entry Point (index.ts)

The application starts with `index.ts`, which:

1. Loads and validates environment variables
2. Configures logging
3. Initializes the bot via `initBot()` function
4. Creates the HTTP server with `initServer()` function, passing the bot instance
5. Configures webhook or long-polling mode based on environment
6. Sets up graceful shutdown handlers

```typescript
// Simplified flow in index.ts
try {
    validateEnvironment();
    logger.info('Environment validation passed');

    // Initialize bot
    const bot = initBot();
    logger.info('Bot initialized successfully');

    // Initialize server with bot instance
    const app = await initServer(bot);
    
    // Start the server
    await app.listen({
        port: config.app.port,
        host: config.app.host
    });
    
    logger.info(`Server listening on ${config.app.host}:${config.app.port}`);

    // Setup graceful shutdown
    process.once('SIGINT', async () => {
        await app.close();
        bot.stop('SIGINT');
    });
    process.once('SIGTERM', async () => {
        await app.close();
        bot.stop('SIGTERM');
    });
} catch (error) {
    logger.error('Failed to start bot', { error });
    process.exit(1);
}
```

### Bot Configuration (bot.ts)

The `bot.ts` file orchestrates all the bot components:

1. Creates the Telegraf bot instance
2. Configures middlewares
3. Sets up global error handling
4. Registers scenes for interactive conversations
5. Registers command handlers
6. Sets up notification services

```typescript
// Simplified flow in bot.ts
export const initBot = (): Telegraf<GlobalContext> => {
    const bot = new Telegraf<GlobalContext>(config.bot.token);

    configureMiddlewares(bot);
    configureErrorHandler(bot);
    configureScenes(bot);
    configureCommands(bot);
    configureNotifications(bot);

    return bot;
};
```

### Server Configuration (server.ts)

The `server.ts` file manages the HTTP server and webhook configuration:

1. Creates a Fastify server instance
2. Configures health check endpoints
3. Sets up webhook routes for production or enables long polling for development
4. Manages webhook registration with Telegram API

```typescript
// Simplified flow in server.ts
export const initServer = async (bot: Telegraf<GlobalContext>): Promise<FastifyInstance> => {
    // Initialize Fastify
    const app = fastify({
        logger: false
    });

    // Setup health check routes
    setupHealthRoutes(app);

    // Configure bot mode based on environment
    if (config.env.isProduction) {
        // Configure webhook mode for production
        const success = await configureWebhook(app, bot);
        if (!success) {
            throw new Error('Failed to configure webhook');
        }
    } else {
        // Use long-polling mode for development
        const success = await configureLongPolling(bot);
        if (!success) {
            throw new Error('Failed to configure long polling');
        }
    }

    return app;
};
```

#### Health Check Routes

The server provides health check endpoints at `/` and `/health` that return basic status information:

```typescript
const setupHealthRoutes = (app: FastifyInstance) => {
    app.get('/', async () => {
        return {
            status: 'ok',
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            env: config.nodeEnv
        };
    });

    app.get('/health', async () => {
        return {
            status: 'ok',
            message: 'Server is healthy',
            timestamp: new Date().toISOString(),
            env: config.nodeEnv
        };
    });
};
```

#### Webhook Configuration

For production environments, the server configures a webhook with the Telegram API:

1. Builds a webhook URL using the app domain and secret path
2. Registers routes in Fastify to handle incoming webhook requests
3. Sets the webhook URL with Telegram's API
4. Provides security through optional secret tokens

#### Long Polling Configuration

For development, the server configures long polling:

1. Removes any existing webhook
2. Starts the bot in long polling mode
3. Automatically processes updates from Telegram

## Middleware System

Middlewares are functions that process updates before they reach command handlers. They're configured in `src/middlewares/index.ts` and applied in sequence.

### Key Middlewares

1. **Session Middleware**: Manages user sessions with various storage options (Redis, MongoDB, SQLite, PostgreSQL)
2. **Auth Middleware**: Handles authentication checks for protected routes
3. **API Client Middleware**: Injects the API client into the context
4. **Rate Limit Middleware**: Prevents abuse by limiting request frequency
5. **Logger Middleware**: Logs incoming messages and operations

### How Middlewares Are Applied

```typescript
// src/middlewares/index.ts
export const configureMiddlewares = (bot: Telegraf<GlobalContext>): void => {
    // Add session support
    bot.use(sessionMiddleware());
    
    // Add authentication checks
    bot.use(authMiddleware());
    
    // Add API client
    bot.use(apiClientMiddleware());
    
    // Add rate limiting
    bot.use(rateLimitMiddleware());
    
    // Add logging
    bot.use(loggerMiddleware());
};
```

### Adding a New Middleware

To add a new middleware:

1. Create a new file in `src/middlewares/` (e.g., `my-middleware.ts`)
2. Implement the middleware function
3. Add it to the middleware configuration in `src/middlewares/index.ts`

Example:

```typescript
// src/middlewares/my-middleware.ts
export const myMiddleware = (): Middleware<GlobalContext> => {
    return async (ctx, next) => {
        // Middleware logic here
        await next();
    };
};

// Then in index.ts, add:
bot.use(myMiddleware());
```

## Command System

Commands are user-initiated actions triggered by messages like `/start` or `/wallet`. Each command has its own file in the `src/commands/` directory.

### Command Structure

Each command typically consists of:

1. A handler function for the command
2. Optional action handlers for related button callbacks
3. Helper functions specific to the command

Example:

```typescript
// src/commands/wallet.command.ts
export const walletCommand = async (ctx: GlobalContext) => {
    // Command logic when user types /wallet
};

export const viewWalletsAction = async (ctx: GlobalContext) => {
    // Logic when user clicks "View Wallets" button
};
```

### Commands Registration

Commands are registered in `src/commands/index.ts`:

```typescript
export const configureCommands = (bot: Telegraf<GlobalContext>): void => {
    // Register command handlers
    bot.command('start', startCommand);
    bot.command('wallet', walletCommand);
    // ...more commands
    
    // Register action handlers (for inline buttons)
    bot.action('view_wallets', viewWalletsAction);
    bot.action('deposit_funds', depositAction);
    // ...more actions
};
```

### Adding a New Command

To add a new command:

1. Create a new file in `src/commands/` (e.g., `my-command.ts`)
2. Implement the command handler function
3. Add any related action handlers
4. Register the command and actions in `src/commands/index.ts`
5. Add the command to the bot's command list using `bot.telegram.setMyCommands()`

Example:

```typescript
// src/commands/my-command.ts
export const myCommand = async (ctx: GlobalContext) => {
    await ctx.reply('This is my new command!');
};

// Then in commands/index.ts:
bot.command('mycommand', myCommand);

// And add it to the commands list:
bot.telegram.setMyCommands([
    // ...existing commands
    { command: 'mycommand', description: 'My new command' }
]);
```

For a complete list of available commands and their usage, see the [Command Reference](commands.md).

## Scene System

Scenes represent multi-step conversations with users. They're used for complex flows like authentication, sending funds, or creating wallets. Telegraf provides two main types of scenes: `BaseScene` and `WizardScene`.

### Scene Types

#### BaseScene

`BaseScene` is a simple scene that doesn't have predefined steps. It's useful for simpler interactions where you need to collect just one piece of information or when the conversation flow isn't strictly linear.

Key characteristics:
- No predefined steps
- Manual handling of state transitions
- More flexibility in conversation flow
- Good for collecting a single piece of information or simple interactions

#### WizardScene

`WizardScene` is a more structured scene with predefined steps that run in sequence. It's ideal for multi-step forms or processes where you need to collect multiple pieces of information in a specific order.

Key characteristics:
- Predefined sequence of steps
- Automatic state management
- Linear conversation flow
- Good for complex forms or multi-step processes

### Scene Structure

#### BaseScene Example

```typescript
// src/scenes/profile.scene.ts
export const profileScene = new Scenes.BaseScene<GlobalContext>('profile');

// Setup enter handler - runs when scene is entered
profileScene.enter(async (ctx) => {
    await ctx.reply('Please enter your name:');
});

// Setup message handler - listens for text messages
profileScene.on('text', async (ctx) => {
    const name = ctx.message.text;
    
    // Save the name to user data
    ctx.scene.session.name = name;
    
    await ctx.reply(`Thank you, ${name}! Your profile has been updated.`);
    
    // Exit the scene
    return ctx.scene.leave();
});

// Handle other message types
profileScene.on('message', async (ctx) => {
    await ctx.reply('Please send your name as text.');
});
```

#### WizardScene Example

```typescript
// src/scenes/auth.scene.ts
export const authScene = new Scenes.WizardScene<GlobalContext>(
    SCENE_IDS.AUTH,
    
    // Step 1: Ask for email
    async (ctx) => {
        await ctx.reply('Please enter your email:');
        return ctx.wizard.next();
    },
    
    // Step 2: Process email and request OTP
    async (ctx) => {
        if (!ctx.message || !('text' in ctx.message)) {
            await ctx.reply('Please enter a valid email address.');
            return;
        }
        
        const email = ctx.message.text;
        
        // Validate email format
        if (!isValidEmail(email)) {
            await ctx.reply('Invalid email format. Please try again.');
            return ctx.wizard.back();
        }
        
        // Store email in scene session
        ctx.scene.session.email = email;
        
        try {
            // Request OTP from API
            await ctx.api.auth.requestOtp({ email });
            await ctx.reply('Enter the OTP sent to your email:');
            return ctx.wizard.next();
        } catch (error) {
            await ctx.reply('Failed to send OTP. Please try again.');
            return ctx.wizard.back();
        }
    },
    
    // Step 3: Verify OTP and complete auth
    async (ctx) => {
        if (!ctx.message || !('text' in ctx.message)) {
            await ctx.reply('Please enter the OTP code.');
            return;
        }
        
        const code = ctx.message.text;
        const email = ctx.scene.session.email;
        
        try {
            // Authenticate with API
            const authResult = await ctx.api.auth.authenticate({ email, code });
            
            // Save token to session
            ctx.session.token = authResult.token;
            
            await ctx.reply('✅ Authentication successful!');
            
            // Exit the scene
            return ctx.scene.leave();
        } catch (error) {
            await ctx.reply('Invalid OTP. Please try again.');
            return;
        }
    }
);

// Add handlers for scene interruption
authScene.command('cancel', async (ctx) => {
    await ctx.reply('Authentication cancelled.');
    return ctx.scene.leave();
});
```

### Scene Registration

Scenes are registered in `src/scenes/index.ts`:

```typescript
export const configureScenes = (bot: Telegraf<GlobalContext>): void => {
    const stage = new Scenes.Stage([
        // WizardScenes
        authScene,
        walletCreateScene,
        sendSingleScene,
        
        // BaseScenes
        profileScene,
        helpScene,
        
        // ...more scenes
    ]);
    
    // Add global scene middleware
    stage.use(async (ctx, next) => {
        // Handle /cancel command to exit scenes
        if (ctx.message && 'text' in ctx.message && ctx.message.text === '/cancel') {
            await ctx.reply('Operation cancelled.');
            await ctx.scene.leave();
            return;
        }
        await next();
    });
    
    bot.use(stage.middleware());
};
```

### Adding a New Scene

To add a new scene, you'll first need to determine which type of scene is appropriate for your use case:

- Use `BaseScene` when:
  - You need a simple, non-linear conversation
  - You're collecting just one piece of information
  - You need more control over the flow
  - The interaction is event-driven rather than step-driven

- Use `WizardScene` when:
  - You have a multi-step process with a clear sequence
  - You're collecting multiple pieces of information in order
  - You want form-like behavior with validation at each step
  - You want automatic state management between steps

#### Adding a BaseScene

```typescript
// src/scenes/feedback.scene.ts
export const feedbackScene = new Scenes.BaseScene<GlobalContext>('feedback');

// Scene entry point
feedbackScene.enter(async (ctx) => {
    await ctx.reply(
        'Please share your feedback about the bot:',
        Markup.keyboard([['Cancel']])
            .oneTime()
            .resize()
    );
});

// Handle text messages
feedbackScene.on('text', async (ctx) => {
    const text = ctx.message.text;
    
    if (text === 'Cancel') {
        await ctx.reply('Feedback cancelled.', Markup.removeKeyboard());
        return ctx.scene.leave();
    }
    
    // Save the feedback
    await saveFeedback(ctx.from.id, text);
    
    await ctx.reply(
        'Thank you for your feedback!',
        Markup.removeKeyboard()
    );
    
    return ctx.scene.leave();
});

// Then in scenes/index.ts:
export const SCENE_IDS = {
    // ...existing IDs
    FEEDBACK: 'feedback'
};

// And add to the stage:
const stage = new Scenes.Stage([
    // ...existing scenes
    feedbackScene
]);
```

#### Adding a WizardScene

```typescript
// src/scenes/transfer.scene.ts
export const transferScene = new Scenes.WizardScene<GlobalContext>(
    'transfer',
    
    // Step 1: Ask for recipient
    async (ctx) => {
        await ctx.reply('Enter recipient email or wallet address:');
        return ctx.wizard.next();
    },
    
    // Step 2: Ask for amount
    async (ctx) => {
        if (!ctx.message || !('text' in ctx.message)) {
            await ctx.reply('Please enter a valid recipient.');
            return;
        }
        
        const recipient = ctx.message.text;
        ctx.scene.session.recipient = recipient;
        
        await ctx.reply('Enter amount to send (in USDC):');
        return ctx.wizard.next();
    },
    
    // Step 3: Confirm transfer
    async (ctx) => {
        if (!ctx.message || !('text' in ctx.message)) {
            await ctx.reply('Please enter a valid amount.');
            return;
        }
        
        const amount = parseFloat(ctx.message.text);
        if (isNaN(amount) || amount <= 0) {
            await ctx.reply('Invalid amount. Please enter a positive number.');
            return ctx.wizard.back();
        }
        
        ctx.scene.session.amount = amount;
        const recipient = ctx.scene.session.recipient;
        
        await ctx.reply(
            `Please confirm transfer:\n\nTo: ${recipient}\nAmount: ${amount} USDC`,
            Markup.inlineKeyboard([
                [
                    Markup.button.callback('Confirm', 'confirm_transfer'),
                    Markup.button.callback('Cancel', 'cancel_transfer')
                ]
            ])
        );
        
        return ctx.wizard.next();
    },
    
    // Step 4: Handle confirmation
    async (ctx) => {
        // This step only handles callbacks, so wait for them
        return;
    }
);

// Add action handlers for the confirmation step
transferScene.action('confirm_transfer', async (ctx) => {
    const { recipient, amount } = ctx.scene.session;
    
    try {
        // Execute the transfer
        const result = await ctx.api.transfer.send({
            recipient,
            amount
        });
        
        await ctx.answerCbQuery();
        await ctx.reply(`✅ Transfer successful!\nTransaction ID: ${result.id}`);
    } catch (error) {
        await ctx.answerCbQuery();
        await ctx.reply(`❌ Transfer failed: ${error.message}`);
    }
    
    return ctx.scene.leave();
});

transferScene.action('cancel_transfer', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('Transfer cancelled.');
    return ctx.scene.leave();
});

// Then in scenes/index.ts:
export const SCENE_IDS = {
    // ...existing IDs
    TRANSFER: 'transfer'
};

// And add to the stage:
const stage = new Scenes.Stage([
    // ...existing scenes
    transferScene
]);
```

## API Integration

The `src/api/` directory contains modules for interacting with the CopperX API. It follows a modular structure where each resource type has its own file.

### API Client

The base API client (`src/api/client.ts`) provides:

1. HTTP methods (GET, POST, PUT, DELETE)
2. Authentication header management
3. Error handling and logging
4. Request/response interceptors

```typescript
// src/api/client.ts
export class ApiClient {
    private client: AxiosInstance;
    private accessToken: string | null = null;

    constructor(config: ApiClientConfig = {}) {
        this.client = axios.create({
            baseURL: config.baseURL || environment.api.baseUrl,
            timeout: config.timeout || environment.api.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...config.headers,
            },
        });
        
        this.setupInterceptors();
    }
    
    // Methods for HTTP requests
    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> { /* ... */ }
    public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> { /* ... */ }
    public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> { /* ... */ }
    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> { /* ... */ }
}
```

### Resource-Specific API Modules

Each API module encapsulates endpoints for a specific resource:

- `auth.api.ts` - Authentication endpoints
- `wallet.api.ts` - Wallet management endpoints
- `transfer.api.ts` - Fund transfer endpoints
- `kyc.api.ts` - KYC verification endpoints
- etc.

Example:

```typescript
// src/api/wallet.api.ts
export class WalletApi {
    constructor(private client: ApiClient) {}

    public async getWallets(): Promise<WalletResponse[]> {
        return this.client.get<WalletResponse[]>('/api/wallets');
    }
    
    public async createWallet(data: CreateWalletRequest): Promise<WalletResponse> {
        return this.client.post<WalletResponse>('/api/wallets', data);
    }
    
    // More wallet-related endpoints...
}
```

### Type Definitions

The API uses TypeScript interfaces to ensure type safety:

```typescript
// src/types/api.types.ts
export interface WalletResponse {
    id: string;
    name: string;
    chainId: string;
    address: string;
    isDefault: boolean;
    createdAt: string;
}

export interface CreateWalletRequest {
    chainId: string;
    code?: string;
}
```

### Adding a New API Module

To add a new API module:

1. Create a new file in `src/api/` (e.g., `my-resource.api.ts`)
2. Implement the resource class with methods for each endpoint
3. Add type definitions in `src/types/`
4. Export the module in `src/api/index.ts`

Example:

```typescript
// src/api/my-resource.api.ts
export class MyResourceApi {
    constructor(private client: ApiClient) {}

    public async getResources(): Promise<MyResource[]> {
        return this.client.get<MyResource[]>('/api/my-resources');
    }
}

// Then in api/index.ts:
export const createApiClient = (token?: string): ApiModules => {
    const client = new ApiClient();
    if (token) client.setAccessToken(token);
    
    return {
        // ...existing modules
        myResource: new MyResourceApi(client)
    };
};
```

For detailed information about the API endpoints, request/response formats, and authentication flow, see the [API Integration](api.md) documentation.

## Services

The `src/services/` directory contains business logic that coordinates between the bot interface and the API:

- `auth.service.ts` - Authentication logic
- `notification.service.ts` - Real-time notification handling
- etc.

These services abstract complex operations and provide a cleaner separation of concerns.

## Configuration

The `src/config/` directory contains application configuration:

- `index.ts` - Centralized configuration with environment variable processing
- `protected-routes.ts` - Authentication requirements for commands
- etc.

The configuration system uses a single `config` object that loads environment variables and organizes them into logical sections:

```typescript
// src/config/index.ts
export const config = {
    // Environment flags
    env: {
        isDevelopment: nodeEnv === 'development',
        isProduction: nodeEnv === 'production',
        isTest: nodeEnv === 'test',
    },
    
    // Node environment
    nodeEnv,
    
    // Bot configuration
    bot: {
        token: process.env.BOT_TOKEN || '',
        username: process.env.BOT_USERNAME || '',
    },
    
    // API configuration, session settings, etc.
    api: { /* ... */ },
    session: { /* ... */ },
    // ... other configuration sections
};
```

This approach provides a consistent, type-safe way to access configuration throughout the application.

## Server and Web Hooks

The `src/server.ts` file manages the HTTP server configuration for the bot:

- Configures health check endpoints
- Sets up webhook handling in production environments
- Initializes long polling in development mode
- Manages server lifecycle

```typescript
// src/server.ts
export const initServer = async (bot: Telegraf<GlobalContext>): Promise<FastifyInstance> => {
    // Initialize Fastify
    const app = fastify({ logger: false });

    // Setup health check routes
    setupHealthRoutes(app);

    // Configure bot mode based on environment
    if (config.env.isProduction) {
        const success = await configureWebhook(app, bot);
        // ...
    } else {
        const success = await configureLongPolling(bot);
        // ...
    }

    return app;
};
```

## Security Features

Security is implemented at multiple levels:

1. **Middleware Layer**:
   - Session encryption
   - Authentication checks
   - Rate limiting

2. **Command/Scene Layer**:
   - Input validation
   - Protected routes
   - Confirmation steps

3. **API Layer**:
   - Secure token handling
   - HTTPS-only communication
   - Error handling

For a comprehensive overview of security features and best practices implemented in the bot, refer to the [Security](security.md) documentation.

## Adding New Features

When adding new features, follow these steps:

1. **Plan the feature**:
   - Determine if it needs API integration
   - Decide if it's a simple command or complex scene
   - Identify security requirements

2. **Implement API integration** (if needed):
   - Add endpoints to appropriate API module
   - Define TypeScript interfaces for request/response

3. **Create the command or scene**:
   - Implement the user interaction flow
   - Add validation and error handling
   - Register the command or scene

4. **Update documentation**:
   - Add the new feature to command reference
   - Update relevant documentation files

## Testing

The project includes tests in the `tests/` directory:

- Unit tests for individual components
- Integration tests for API interactions
- End-to-end tests for complete flows

Run tests with:

```bash
npm test
```

## Conclusion

The CopperX Telegram Bot follows a modular, well-structured architecture that separates concerns into different components:

1. **index.ts** - Application entry point and bootstrap
2. **bot.ts** - Bot configuration and component integration
3. **server.ts** - HTTP server and webhook management
4. **middlewares/** - Request processing pipeline
5. **commands/** - Command handlers for user interactions
6. **scenes/** - Multi-step conversation flows
7. **api/** - Integration with CopperX API
8. **services/** - Business logic coordination
9. **config/** - Application configuration
10. **utils/** - Helper functions
11. **types/** - TypeScript type definitions

This architecture ensures the code is maintainable, testable, and extensible as new features are added.

## Next Steps

Now that you understand the project structure and code flow, you might want to explore these documentation pages:

- [Command Reference](commands.md) - Learn about all available bot commands and their usage
- [API Integration](api.md) - Detailed information about how the bot interacts with the CopperX API
- [Troubleshooting](troubleshooting.md) - Common issues and their solutions
- [Security](security.md) - Security features and best practices implemented in the bot

If you're planning to deploy the bot, refer to the [Setup Guide](setup.md) for detailed deployment instructions. 