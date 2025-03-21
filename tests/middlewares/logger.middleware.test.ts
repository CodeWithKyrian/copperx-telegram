import { loggerMiddleware } from '../../src/middlewares/logger.middleware';
import { createMockContext } from '../__mocks__/context.mock';
import logger from '../../src/utils/logger.utils';
import { callMiddleware } from '../__mocks__/context.mock';

// Mock dependencies
jest.mock('../../src/utils/logger.utils');

describe('Logger Middleware', () => {
    // Create middleware instance once
    const middleware = loggerMiddleware();
    let ctx: ReturnType<typeof createMockContext>;
    const mockNext = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();
    });

    describe('with text messages', () => {
        it('should log text message with user details', async () => {
            // Arrange
            const messageText = '/start';
            ctx = createMockContext({
                message: {
                    text: messageText,
                    message_id: 1,
                    date: Date.now(),
                    chat: { id: 123, type: 'private' }
                },
                from: {
                    id: 987654321,
                    username: 'testuser',
                    is_bot: false,
                    first_name: 'Test'
                },
                updateType: 'message'
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(logger.info).toHaveBeenCalledWith({
                userId: 987654321,
                username: 'testuser',
                messageText: '/start',
                updateType: 'message'
            }, 'Received message');
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('with callback queries', () => {
        it('should log callback query with user details', async () => {
            // Arrange
            ctx = createMockContext({
                message: undefined,
                callbackQuery: {
                    id: 'query-id',
                    data: 'view_wallets',
                    chat_instance: 'instance'
                },
                from: {
                    id: 123456789,
                    username: 'callbackuser',
                    is_bot: false,
                    first_name: 'Callback'
                },
                updateType: 'callback_query'
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(logger.info).toHaveBeenCalledWith({
                userId: 123456789,
                username: 'callbackuser',
                messageText: undefined,
                updateType: 'callback_query'
            }, 'Received callback_query');
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('with other update types', () => {
        it('should log other update types without message text', async () => {
            // Arrange
            ctx = createMockContext({
                message: {
                    photo: [{ file_id: 'abc', file_unique_id: 'def', width: 100, height: 100 }],
                    message_id: 1,
                    date: Date.now(),
                    chat: { id: 123, type: 'private' }
                } as any,
                from: {
                    id: 555555555,
                    username: 'photouser',
                    is_bot: false,
                    first_name: 'Photo'
                },
                updateType: 'photo'
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(logger.info).toHaveBeenCalledWith({
                userId: 555555555,
                username: 'photouser',
                messageText: undefined,
                updateType: 'photo'
            }, 'Received photo');
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('with anonymous users', () => {
        it('should handle missing user information gracefully', async () => {
            // Arrange
            ctx = createMockContext({
                message: {
                    photo: [{ file_id: 'abc', file_unique_id: 'def', width: 100, height: 100 }],
                    message_id: 1,
                    date: Date.now(),
                    chat: { id: 123, type: 'private' }
                } as any,
                from: undefined,
                updateType: 'photo'
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(logger.info).toHaveBeenCalledWith({
                userId: undefined,
                username: undefined,
                messageText: undefined,
                updateType: 'photo'
            }, 'Received photo');
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('middleware behavior', () => {
        it('should always call next() after logging', async () => {
            // Arrange - with message
            ctx = createMockContext({
                message: { text: 'test message' }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(mockNext).toHaveBeenCalled();

            // Reset
            jest.clearAllMocks();

            // Arrange - with error
            (logger.info as jest.Mock).mockImplementation(() => {
                throw new Error('Logging error');
            });

            // Act & Assert - should throw the error since there's no try/catch
            await expect(callMiddleware(middleware, ctx, mockNext)).rejects.toThrow('Logging error');
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
}); 