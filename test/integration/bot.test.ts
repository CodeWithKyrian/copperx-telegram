import { Middleware } from 'telegraf';
import { initBot } from '../../src/bot';
import { GlobalContext } from '../../src/types';

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
        telegram: {
            getMe: jest.fn().mockResolvedValue({
                id: 123456789,
                is_bot: true,
                first_name: 'Test Bot',
                username: 'test_bot',
            }),
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

    // Create a Stage mock
    const mockStage = jest.fn().mockImplementation(() => {
        return {
            middleware: () => mockMiddlewareFn(),
            register: jest.fn(),
        };
    });

    // Return the mocked Telegraf object
    return {
        Telegraf: MockTelegraf,
        session: mockSession,
        Scenes: {
            Stage: mockStage,
            BaseScene: jest.fn().mockImplementation(() => {
                return {
                    enter: jest.fn(),
                    leave: jest.fn(),
                    command: jest.fn(),
                    on: jest.fn(),
                    use: jest.fn(),
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
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create bot instance successfully', () => {
        // Act
        const bot = initBot();

        // Assert
        expect(bot).toBeDefined();
        expect(Telegraf).toHaveBeenCalled();
    });

    it('should register command handlers', () => {
        // Arrange - create a fresh mock instance for this test
        const mockBotInstance = {
            use: jest.fn(),
            start: jest.fn(),
            help: jest.fn(),
            command: jest.fn(),
            on: jest.fn(),
            catch: jest.fn(),
            telegram: {
                getMe: jest.fn().mockResolvedValue({
                    id: 123456789,
                    is_bot: true,
                    first_name: 'Test Bot',
                    username: 'test_bot',
                }),
            },
        };

        // Make the Telegraf constructor return our mock instance
        (Telegraf as jest.Mock).mockReturnValue(mockBotInstance);

        // Act
        initBot();

        // Assert - verify commands were registered on our mock instance
        expect(mockBotInstance.start).toHaveBeenCalled();
        expect(mockBotInstance.help).toHaveBeenCalled();
        expect(mockBotInstance.command).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(Function)
        );
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