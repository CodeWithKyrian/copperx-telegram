import { Context, Middleware } from 'telegraf';
import { initBot } from '../../src/bot';

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
        return ((_ctx: Context, next: () => Promise<void>) => next()) as Middleware<Context>;
    });

    // Return the module structure as it would be imported
    return {
        Telegraf: MockTelegraf,
        session: mockSession,
        Context: class Context { }
    };
});

// Mock the session middleware
jest.mock('../../src/middlewares/session.middleware', () => ({
    createSessionMiddleware: jest.fn().mockImplementation(() => {
        return ((_ctx: Context, next: () => Promise<void>) => next()) as Middleware<Context>;
    }),

    updateSessionMiddleware: jest.fn().mockImplementation(() => {
        return ((_ctx: Context, next: () => Promise<void>) => next()) as Middleware<Context>;
    })
}));

// Mock the logger middleware
jest.mock('../../src/middlewares/logger.middleware', () => ({
    loggerMiddleware: jest.fn().mockImplementation(() => {
        return ((_ctx: Context, next: () => Promise<void>) => next()) as Middleware<Context>;
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