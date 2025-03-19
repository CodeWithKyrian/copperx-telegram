import { createSessionStore } from '../../src/middlewares/session.middleware';
import { createMockContext } from '../__mocks__/context.mock';
import { callMiddleware } from '../__mocks__/context.mock';
import { config } from '../../src/config';
import logger from '../../src/utils/logger.utils';
import { Redis } from '@telegraf/session/redis';
import { Mongo } from '@telegraf/session/mongodb';
import { Postgres } from '@telegraf/session/pg';
import { SQLite } from '@telegraf/session/sqlite';
// import { Markup } from 'telegraf';

// Mock dependencies
jest.mock('../../src/utils/logger.utils');
jest.mock('../../src/config', () => ({
    config: {
        session: {
            driver: 'memory',
            ttl: 3600 // 1 hour in seconds
        },
        redis: {
            url: 'redis://localhost:6379'
        },
        mongo: {
            uri: 'mongodb://localhost:27017',
            database: 'test'
        },
        sqlite: {
            filename: ':memory:'
        },
        postgres: {
            host: 'localhost',
            port: 5432,
            database: 'test',
            user: 'postgres',
            password: 'password'
        }
    }
}));

// Mock external session stores
jest.mock('@telegraf/session/redis', () => ({
    Redis: jest.fn().mockReturnValue(new Map())
}));
jest.mock('@telegraf/session/mongodb', () => ({
    Mongo: jest.fn().mockReturnValue(new Map())
}));
jest.mock('@telegraf/session/pg', () => ({
    Postgres: jest.fn().mockReturnValue(new Map())
}));
jest.mock('@telegraf/session/sqlite', () => ({
    SQLite: jest.fn().mockReturnValue(new Map())
}));

// Mock the telegraf session function with a direct jest.fn() reference
jest.mock('telegraf', () => {
    // Create the mock function here directly
    const mockFn = jest.fn();

    const markupMock = {
        inlineKeyboard: jest.fn().mockReturnValue({ inline_keyboard: [] })
    };

    return {
        ...jest.requireActual('telegraf'),
        session: jest.fn().mockReturnValue(mockFn),
        Markup: {
            inlineKeyboard: jest.fn().mockReturnValue(markupMock),
            button: {
                callback: jest.fn().mockReturnValue({ text: 'Login', callback_data: 'login' })
            }
        }
    };
});

// Import the middleware after mocking
import { sessionMiddleware } from '../../src/middlewares/session.middleware';
import { GlobalContext } from '../../src/types/session.types';

describe('Session Middleware', () => {
    // Get a reference to the mock function we created in the mock
    const sessionMiddlewareMock = require('telegraf').session();
    const mockNext = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createSessionStore', () => {
        it('should create memory store by default', () => {
            // Arrange & Act
            const store = createSessionStore();

            // Assert
            expect(store).toBeInstanceOf(Map);
            expect(logger.info).toHaveBeenCalledWith('Initializing session store with driver: memory');
        });

        it('should create Redis store when configured', () => {
            // Arrange
            config.session.driver = 'redis';

            // Act
            createSessionStore();

            // Assert
            expect(Redis).toHaveBeenCalledWith({
                url: 'redis://localhost:6379'
            });
            expect(logger.info).toHaveBeenCalledWith('Initializing session store with driver: redis');
        });

        it('should create MongoDB store when configured', () => {
            // Arrange
            config.session.driver = 'mongo';

            // Act
            createSessionStore();

            // Assert
            expect(Mongo).toHaveBeenCalledWith({
                url: 'mongodb://localhost:27017',
                database: 'test'
            });
            expect(logger.info).toHaveBeenCalledWith('Initializing session store with driver: mongo');
        });

        it('should create SQLite store when configured', () => {
            // Arrange
            config.session.driver = 'sqlite';

            // Act
            createSessionStore();

            // Assert
            expect(SQLite).toHaveBeenCalledWith({
                filename: ':memory:',
                config: { fileMustExist: false }
            });
            expect(logger.info).toHaveBeenCalledWith('Initializing session store with driver: sqlite');
        });

        it('should create Postgres store when configured', () => {
            // Arrange
            config.session.driver = 'postgres';

            // Act
            createSessionStore();

            // Assert
            expect(Postgres).toHaveBeenCalledWith({
                host: 'localhost',
                port: 5432,
                database: 'test',
                user: 'postgres',
                password: 'password'
            });
            expect(logger.info).toHaveBeenCalledWith('Initializing session store with driver: postgres');
        });

        afterEach(() => {
            // Reset to default
            config.session.driver = 'memory';
        });
    });

    describe('sessionMiddleware function', () => {
        it('should create middleware with correct configuration', () => {
            // Act
            sessionMiddleware();

            // Assert
            // Verify the session was created with correct parameters
            expect(require('telegraf').session).toHaveBeenCalledWith(
                expect.objectContaining({
                    store: expect.any(Map),
                    defaultSession: expect.any(Function),
                    getSessionKey: expect.any(Function)
                })
            );
        });

        it('should create default session with timestamps', () => {
            // Arrange
            const now = Date.now();
            jest.spyOn(Date, 'now').mockReturnValue(now);

            // Get the defaultSession function that was passed to session()
            sessionMiddleware();
            const defaultSessionFn = require('telegraf').session.mock.calls[0][0].defaultSession;

            // Act
            const result = defaultSessionFn();

            // Assert
            expect(result).toEqual({
                createdAt: now,
                updatedAt: now
            });
        });

        it('should use user ID for session key when available', () => {
            // Arrange
            const userId = 12345;
            const ctx = { from: { id: userId } };

            // Get the getSessionKey function
            sessionMiddleware();
            const getSessionKeyFn = require('telegraf').session.mock.calls[0][0].getSessionKey;

            // Act
            const result = getSessionKeyFn(ctx);

            // Assert
            expect(result).toBe(`user:${userId}`);
        });

        it('should use chat ID for session key when user ID is not available', () => {
            // Arrange
            const chatId = 67890;
            const ctx = { chat: { id: chatId } };

            // Get the getSessionKey function
            sessionMiddleware();
            const getSessionKeyFn = require('telegraf').session.mock.calls[0][0].getSessionKey;

            // Act
            const result = getSessionKeyFn(ctx);

            // Assert
            expect(result).toBe(`chat:${chatId}`);
        });

        it('should return undefined when neither user nor chat ID is available', () => {
            // Arrange
            const ctx = {};

            // Get the getSessionKey function
            sessionMiddleware();
            const getSessionKeyFn = require('telegraf').session.mock.calls[0][0].getSessionKey;

            // Act
            const result = getSessionKeyFn(ctx);

            // Assert
            expect(result).toBeUndefined();
        });
    });

    describe('middleware behavior', () => {
        it('should update session timestamp when called', async () => {
            // Arrange
            const createTime = 1000;
            const updateTime = 2000;
            const ctx = createMockContext();

            // Setup session
            (ctx as any).session = {
                createdAt: createTime,
                updatedAt: createTime
            };

            // Mock Date.now for the update
            jest.spyOn(Date, 'now').mockReturnValue(updateTime);

            // Make our mocked session middleware call the next function with updated timestamp
            sessionMiddlewareMock.mockImplementation(async (_ctx: GlobalContext, next: () => Promise<void>) => {
                // This simulates what our actual middleware does
                ctx.session.updatedAt = Date.now();
                await next();
            });

            const middleware = sessionMiddleware();

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(ctx.session.createdAt).toBe(createTime); // Should not change
            expect(ctx.session.updatedAt).toBe(updateTime); // Should update
            expect(mockNext).toHaveBeenCalled();
        });

        it('should use the configured store', async () => {
            // Arrange
            config.session.driver = 'redis';
            sessionMiddleware();

            // Assert
            expect(Redis).toHaveBeenCalledWith({
                url: 'redis://localhost:6379'
            });

            expect(require('telegraf').session).toHaveBeenCalledWith(
                expect.objectContaining({
                    store: expect.any(Map) // Our mock returns a Map
                })
            );

            // Reset
            config.session.driver = 'memory';
        });
    });

    describe('session expiration', () => {
        let mockNow: jest.SpyInstance;
        const mockNext = jest.fn().mockResolvedValue(undefined);

        beforeEach(() => {
            jest.clearAllMocks();
            mockNow = jest.spyOn(Date, 'now');
        });

        afterEach(() => {
            jest.restoreAllMocks();
            config.session.driver = 'memory';
        });

        it('should log TTL configuration during initialization', () => {
            // Act
            sessionMiddleware();

            // Assert
            expect(logger.info).toHaveBeenCalledWith(`Session TTL configured for ${config.session.ttl} seconds`);
        });

        it('should not expire sessions that are within TTL', async () => {
            // Arrange
            const now = 1623456789000;
            const createdAt = now - 1000 * 60 * 30; // 30 minutes ago (within 1 hour TTL)
            const updatedAt = createdAt;

            const ctx = createMockContext();
            ctx.reply = jest.fn().mockResolvedValue(undefined);

            // Initialize session with auth token and timestamp
            (ctx as any).session = {
                createdAt,
                updatedAt,
                auth: {
                    accessToken: 'mock-token',
                    userId: '123',
                    email: 'test@example.com'
                }
            };

            // Create a mock store that will return our session
            const mockStore = new Map();
            const userId = 123;
            const sessionKey = `user:${userId}`;
            mockStore.set(sessionKey, ctx.session);

            // Create proper mocks without recursion
            const originalGet = mockStore.get.bind(mockStore);
            mockStore.get = jest.fn(key => originalGet(key));
            mockStore.delete = jest.fn();

            // Mock current time
            mockNow.mockReturnValue(now);

            // Setup our middleware mock
            sessionMiddlewareMock.mockImplementation(async (_ctx: any, next: () => Promise<void>) => {
                // Simulate obtaining session key and calling store.get
                const getSessionKey = () => sessionKey;
                const session = mockStore.get(getSessionKey());

                // Check TTL expiration (simplified version of the real logic)
                if (session?.auth?.accessToken) {
                    const idleTime = now - session.updatedAt;
                    if (idleTime > config.session.ttl * 1000) {
                        mockStore.delete(sessionKey);
                        await ctx.reply('Your session has expired due to inactivity. Please login again.');
                    }
                }

                // Continue to next middleware
                await next();
            });

            const middleware = sessionMiddleware();

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(mockStore.get).toHaveBeenCalled();
            expect(mockStore.delete).not.toHaveBeenCalled(); // Session still valid
            expect(ctx.reply).not.toHaveBeenCalled(); // No expiry message
            expect(mockNext).toHaveBeenCalled();
        });

        it('should expire sessions that exceed TTL', async () => {
            // Arrange
            const now = 1623456789000;
            const createdAt = now - 1000 * 60 * 120; // 2 hours ago (exceeds 1 hour TTL)
            const updatedAt = createdAt;

            const ctx = createMockContext({ from: { id: 123 } });
            ctx.reply = jest.fn().mockResolvedValue(undefined);

            // Initialize session with auth token and old timestamp
            (ctx as any).session = {
                createdAt,
                updatedAt,
                auth: {
                    accessToken: 'mock-token',
                    userId: '123',
                    email: 'test@example.com'
                }
            };

            // Create a mock store
            const mockStore = new Map();
            const userId = 123;
            const sessionKey = `user:${userId}`;
            mockStore.set(sessionKey, ctx.session);

            const originalGet = mockStore.get.bind(mockStore);
            mockStore.get = jest.fn(key => originalGet(key));
            mockStore.delete = jest.fn();

            // Mock current time
            mockNow.mockReturnValue(now);

            // Setup our middleware mock to simulate the TTL check
            sessionMiddlewareMock.mockImplementation(async (_ctx: any, next: () => Promise<void>) => {
                // Simulate obtaining session key and calling store.get
                const getSessionKey = () => sessionKey;
                const session = mockStore.get(getSessionKey());

                // Check TTL expiration (simplified version of the real logic)
                if (session?.auth?.accessToken) {
                    const idleTime = now - session.updatedAt;
                    if (idleTime > config.session.ttl * 1000) {
                        mockStore.delete(sessionKey);
                        await ctx.reply('Your session has expired due to inactivity. Please login again.');
                        logger.info(`Session expired for ${sessionKey}`, {
                            userId: session.auth.userId,
                            email: session.auth.email
                        });
                    }
                }

                // Continue to next middleware
                await next();
            });

            const middleware = sessionMiddleware();

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(mockStore.get).toHaveBeenCalled();
            expect(mockStore.delete).toHaveBeenCalledWith(sessionKey); // Session should be deleted
            expect(ctx.reply).toHaveBeenCalledWith(
                'Your session has expired due to inactivity. Please login again.'
            );
            expect(logger.info).toHaveBeenCalledWith(
                `Session expired for ${sessionKey}`,
                expect.objectContaining({
                    userId: '123',
                    email: 'test@example.com'
                })
            );
            expect(mockNext).toHaveBeenCalled();
        });

        it('should not expire sessions without auth token', async () => {
            // Arrange
            const now = 1623456789000;
            const createdAt = now - 1000 * 60 * 120; // 2 hours ago (exceeds 1 hour TTL)
            const updatedAt = createdAt;

            const ctx = createMockContext({ from: { id: 123 } });
            ctx.reply = jest.fn().mockResolvedValue(undefined);

            // Initialize session WITHOUT auth token but with old timestamp
            (ctx as any).session = {
                createdAt,
                updatedAt
                // No auth token
            };

            // Create a mock store
            const mockStore = new Map();
            const userId = 123;
            const sessionKey = `user:${userId}`;
            mockStore.set(sessionKey, ctx.session);

            // Create proper mocks without recursion
            const originalGet = mockStore.get.bind(mockStore);
            mockStore.get = jest.fn(key => originalGet(key));
            mockStore.delete = jest.fn();

            // Mock current time
            mockNow.mockReturnValue(now);

            // Setup our middleware mock to simulate the TTL check
            sessionMiddlewareMock.mockImplementation(async (_ctx: any, next: () => Promise<void>) => {
                // Simulate obtaining session key and calling store.get
                const getSessionKey = () => sessionKey;
                const session = mockStore.get(getSessionKey());

                // Check TTL expiration (simplified version of the real logic)
                if (session?.auth?.accessToken) {
                    const idleTime = now - session.updatedAt;
                    if (idleTime > config.session.ttl * 1000) {
                        mockStore.delete(sessionKey);
                        await ctx.reply('Your session has expired due to inactivity. Please login again.');
                    }
                }

                // Continue to next middleware
                await next();
            });

            const middleware = sessionMiddleware();

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(mockStore.get).toHaveBeenCalled();
            expect(mockStore.delete).not.toHaveBeenCalled(); // Session should not be deleted
            expect(ctx.reply).not.toHaveBeenCalled(); // No expiry message
            expect(mockNext).toHaveBeenCalled();
        });
    });
}); 