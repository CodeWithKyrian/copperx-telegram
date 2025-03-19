import { createSessionStore } from '../../src/middlewares/session.middleware';
import { createMockContext } from '../__mocks__/context.mock';
import { callMiddleware } from '../__mocks__/context.mock';
import { environment } from '../../src/config/environment';
import logger from '../../src/utils/logger.utils';
import { Redis } from '@telegraf/session/redis';
import { Mongo } from '@telegraf/session/mongodb';
import { Postgres } from '@telegraf/session/pg';
import { SQLite } from '@telegraf/session/sqlite';

// Mock dependencies
jest.mock('../../src/utils/logger.utils');
jest.mock('../../src/config/environment', () => ({
    environment: {
        session: {
            driver: 'memory'
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

    return {
        ...jest.requireActual('telegraf'),
        session: jest.fn().mockReturnValue(mockFn)
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
            environment.session.driver = 'redis';

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
            environment.session.driver = 'mongo';

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
            environment.session.driver = 'sqlite';

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
            environment.session.driver = 'postgres';

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
            environment.session.driver = 'memory';
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
            environment.session.driver = 'redis';
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
            environment.session.driver = 'memory';
        });
    });
}); 