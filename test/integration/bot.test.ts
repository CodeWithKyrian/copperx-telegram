import { Middleware } from 'telegraf';
import { initBot } from '../../src/bot';
import { GlobalContext } from '../../src/types';
import { configureScenes } from '../../src/scenes';
import { configureCommands } from '../../src/commands';
import { configureMiddlewares } from '../../src/middlewares';
import { configureNotifications } from '../../src/services/notification.service';
import logger from '../../src/utils/logger.utils';

// Mock dependencies
jest.mock('telegraf');
jest.mock('../../src/scenes', () => ({
    configureScenes: jest.fn()
}));
jest.mock('../../src/commands', () => ({
    configureCommands: jest.fn()
}));
jest.mock('../../src/middlewares', () => ({
    configureMiddlewares: jest.fn()
}));
jest.mock('../../src/services/notification.service', () => ({
    configureNotifications: jest.fn()
}));
jest.mock('../../src/utils/logger.utils', () => ({
    error: jest.fn(),
    info: jest.fn(),
    default: {
        error: jest.fn(),
        info: jest.fn()
    }
}));
jest.mock('../../src/config/environment', () => ({
    environment: {
        bot: {
            token: 'test-token'
        }
    }
}));

// Mock telegraf and session
jest.mock('telegraf', () => {
    // Create mock for Telegraf constructor
    const MockTelegraf = jest.fn().mockImplementation(() => ({
        use: jest.fn(),
        start: jest.fn(),
        help: jest.fn(),
        command: jest.fn(),
        on: jest.fn(),
        catch: jest.fn(),
        launch: jest.fn().mockResolvedValue(undefined),
        stop: jest.fn(),
        action: jest.fn(),
        telegram: {
            getMe: jest.fn().mockResolvedValue({
                id: 123456789,
                is_bot: true,
                first_name: 'Test Bot',
                username: 'test_bot',
            }),
            setMyCommands: jest.fn(),
        },
    }));

    // Create mock for session middleware with proper types
    const mockSession = jest.fn().mockImplementation(() => {
        return ((_ctx: GlobalContext, next: () => Promise<void>) => next()) as Middleware<GlobalContext>;
    });

    // Create a mock middleware function
    const mockMiddlewareFn = jest.fn().mockImplementation(() => {
        return async (_: GlobalContext, next: () => Promise<void>) => {
            if (next) {
                await next();
            }
        };
    });


    // Return the mocked Telegraf object
    return {
        Telegraf: MockTelegraf,
        session: mockSession,
        Scenes: {
            Stage: jest.fn().mockImplementation(() => {
                return {
                    middleware: () => mockMiddlewareFn(),
                    register: jest.fn(),
                    use: jest.fn(),
                };
            }),
            BaseScene: jest.fn().mockImplementation(() => {
                return {
                    enter: jest.fn(),
                    leave: jest.fn(),
                    command: jest.fn(),
                    on: jest.fn(),
                    use: jest.fn(),
                    action: jest.fn(),
                };
            }),
            WizardScene: jest.fn().mockImplementation(() => {
                return {
                    enter: jest.fn(),
                    leave: jest.fn(),
                    command: jest.fn(),
                    action: jest.fn(),
                    use: jest.fn(),
                    on: jest.fn(),
                    steps: jest.fn(),
                };
            }),
        },
    };
});

// Mock the session middleware
jest.mock('../../src/middlewares/session.middleware', () => ({
    sessionMiddleware: jest.fn().mockImplementation(() => {
        return ((_ctx: GlobalContext, next: () => Promise<void>) => next()) as Middleware<GlobalContext>;
    })
}));

// Mock the logger middleware
jest.mock('../../src/middlewares/logger.middleware', () => ({
    loggerMiddleware: jest.fn().mockImplementation(() => {
        return ((_ctx: GlobalContext, next: () => Promise<void>) => next()) as Middleware<GlobalContext>;
    })
}));

// Import the mocked Telegraf
const { Telegraf } = jest.requireMock('telegraf');

describe('Bot Integration', () => {
    let mockBotInstance: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a fresh mock instance for each test
        mockBotInstance = {
            use: jest.fn(),
            start: jest.fn(),
            help: jest.fn(),
            command: jest.fn(),
            on: jest.fn(),
            catch: jest.fn().mockImplementation((fn) => {
                // Save the error handler function for testing
                mockBotInstance.errorHandler = fn;
            }),
            action: jest.fn(),
            launch: jest.fn().mockResolvedValue(undefined),
            stop: jest.fn(),
            telegram: {
                getMe: jest.fn().mockResolvedValue({
                    id: 123456789,
                    is_bot: true,
                    first_name: 'Test Bot',
                    username: 'test_bot',
                }),
                setMyCommands: jest.fn(),
            },
        };

        // Make the Telegraf constructor return our mock instance
        (Telegraf as jest.Mock).mockReturnValue(mockBotInstance);
    });

    it('should create bot instance with the correct token', () => {
        // Act
        const bot = initBot();

        // Assert
        expect(bot).toBeDefined();
        expect(Telegraf).toHaveBeenCalledWith('test-token');
    });

    it('should configure all required components', () => {
        // Act
        initBot();

        // Assert
        expect(configureMiddlewares).toHaveBeenCalledWith(mockBotInstance);
        expect(configureScenes).toHaveBeenCalledWith(mockBotInstance);
        expect(configureCommands).toHaveBeenCalledWith(mockBotInstance);
        expect(configureNotifications).toHaveBeenCalledWith(mockBotInstance);
    });

    it('should configure error handler', () => {
        // Act
        initBot();

        // Assert
        expect(mockBotInstance.catch).toHaveBeenCalled();

        // Get the error handler function that was registered
        const errorHandler = mockBotInstance.errorHandler;
        expect(errorHandler).toBeDefined();

        // Test the error handler
        const mockError = new Error('Test error');
        const mockContext = {
            updateType: 'message',
            from: { id: 12345 },
            reply: jest.fn()
        };

        // Call the error handler
        errorHandler(mockError, mockContext);

        // Verify logger was called with the correct parameters
        expect(logger.error).toHaveBeenCalledWith('Error processing update', {
            error: 'Test error',
            stack: mockError.stack,
            updateType: 'message',
            userId: 12345,
        });

        // Verify that the context's reply method was called
        expect(mockContext.reply).toHaveBeenCalledWith(
            'An error occurred while processing your request. Please try again later.'
        );
    });

    it('should return the configured bot instance', () => {
        // Act
        const bot = initBot();

        // Assert
        expect(bot).toBe(mockBotInstance);
    });

    it('should handle missing user ID in error handler', () => {
        // Act
        initBot();

        // Get the error handler function
        const errorHandler = mockBotInstance.errorHandler;

        // Create a context without a user ID
        const mockContext = {
            updateType: 'callback_query',
            from: undefined, // No user information
            reply: jest.fn()
        };

        // Call the error handler with this context
        errorHandler(new Error('No user error'), mockContext);

        // Verify that the logger was still called correctly
        expect(logger.error).toHaveBeenCalledWith('Error processing update', {
            error: 'No user error',
            stack: expect.any(String),
            updateType: 'callback_query',
            userId: undefined,
        });

        // Verify the reply was still sent
        expect(mockContext.reply).toHaveBeenCalled();
    });
});

// Also mock your auth scene
jest.mock('../../src/scenes/auth.scene', () => {
    return {
        AUTH_SCENE_ID: 'auth',
        createAuthScene: jest.fn().mockReturnValue({
            enter: jest.fn(),
            leave: jest.fn(),
            command: jest.fn(),
            on: jest.fn(),
        }),
    };
});