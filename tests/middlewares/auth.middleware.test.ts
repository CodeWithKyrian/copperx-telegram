import { authMiddleware } from '../../src/middlewares/auth.middleware';
import { createMockContext } from '../__mocks__/context.mock';
import { authService } from '../../src/services/auth.service';
import { isProtectedCommand, isProtectedAction } from '../../src/config/protected-routes';
import { callMiddleware } from '../__mocks__/context.mock';

// Mock dependencies
jest.mock('../../src/services/auth.service');
jest.mock('../../src/config/protected-routes');
jest.mock('../../src/utils/logger.utils');

describe('Auth Middleware', () => {
    // Create middleware instance once
    const middleware = authMiddleware();
    let ctx: ReturnType<typeof createMockContext>;
    const mockNext = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();
    });

    describe('command-based authentication', () => {
        it('should allow access to unprotected commands', async () => {
            // Arrange
            (isProtectedCommand as jest.Mock).mockReturnValue(false);
            ctx = createMockContext({
                message: {
                    text: '/start',
                    message_id: 1,
                    date: Date.now(),
                    chat: { id: 123, type: 'private' }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedCommand).toHaveBeenCalledWith('start');
            expect(authService.isAuthenticated).not.toHaveBeenCalled();
            expect(ctx.reply).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should allow access to protected commands when authenticated', async () => {
            // Arrange
            (isProtectedCommand as jest.Mock).mockReturnValue(true);
            (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
            ctx = createMockContext({
                message: {
                    text: '/wallet',
                    message_id: 1,
                    date: Date.now(),
                    chat: { id: 123, type: 'private' }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedCommand).toHaveBeenCalledWith('wallet');
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(ctx.reply).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should block access to protected commands when not authenticated', async () => {
            // Arrange
            (isProtectedCommand as jest.Mock).mockReturnValue(true);
            (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
            ctx = createMockContext({
                message: {
                    text: '/wallet',
                    message_id: 1,
                    date: Date.now(),
                    chat: { id: 123, type: 'private' }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedCommand).toHaveBeenCalledWith('wallet');
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('Authentication Required'),
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle commands with bot username', async () => {
            // Arrange
            (isProtectedCommand as jest.Mock).mockReturnValue(true);
            (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
            ctx = createMockContext({
                message: {
                    text: '/wallet@CopperXBot',
                    message_id: 1,
                    date: Date.now(),
                    chat: { id: 123, type: 'private' }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedCommand).toHaveBeenCalledWith('wallet');
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle commands with arguments', async () => {
            // Arrange
            (isProtectedCommand as jest.Mock).mockReturnValue(true);
            (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
            ctx = createMockContext({
                message: {
                    text: '/send 100 USDC to @user',
                    message_id: 1,
                    date: Date.now(),
                    chat: { id: 123, type: 'private' }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedCommand).toHaveBeenCalledWith('send');
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should ignore non-command messages', async () => {
            // Arrange
            ctx = createMockContext({
                message: {
                    text: 'Just a regular message',
                    message_id: 1,
                    date: Date.now(),
                    chat: { id: 123, type: 'private' }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedCommand).not.toHaveBeenCalled();
            expect(authService.isAuthenticated).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('callback-based authentication', () => {
        it('should allow access to unprotected actions without checking auth', async () => {
            // Arrange
            (isProtectedAction as jest.Mock).mockReturnValue(false);

            ctx = createMockContext({
                message: undefined,
                callbackQuery: {
                    id: 'query-id',
                    data: 'about',
                    chat_instance: 'instance'
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedAction).toHaveBeenCalledWith('about');
            // Important: Auth is NOT checked for unprotected actions
            expect(authService.isAuthenticated).not.toHaveBeenCalled();
            expect(ctx.answerCbQuery).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should allow access to protected actions when authenticated', async () => {
            // Arrange
            (isProtectedAction as jest.Mock).mockReturnValue(true);
            (authService.isAuthenticated as jest.Mock).mockReturnValue(true);

            ctx = createMockContext({
                message: undefined,
                callbackQuery: {
                    id: 'query-id',
                    data: 'view_wallets',
                    chat_instance: 'instance'
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedAction).toHaveBeenCalledWith('view_wallets');
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(ctx.answerCbQuery).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should block access to protected actions when not authenticated', async () => {
            // Arrange
            (isProtectedAction as jest.Mock).mockReturnValue(true);
            (authService.isAuthenticated as jest.Mock).mockReturnValue(false);

            ctx = createMockContext({
                message: undefined,
                callbackQuery: {
                    id: 'query-id',
                    data: 'view_wallets',
                    chat_instance: 'instance'
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedAction).toHaveBeenCalledWith('view_wallets');
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(ctx.answerCbQuery).toHaveBeenCalledWith('Authentication required. Please log in first.');
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('Authentication Required'),
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should handle actions with parameters', async () => {
            // Arrange
            (isProtectedAction as jest.Mock).mockReturnValue(true);
            (authService.isAuthenticated as jest.Mock).mockReturnValue(true);

            ctx = createMockContext({
                message: undefined,
                callbackQuery: {
                    id: 'query-id',
                    data: 'deposit_funds:wallet-123',
                    chat_instance: 'instance'
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedAction).toHaveBeenCalledWith('deposit_funds:wallet-123');
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should handle messages without text property', async () => {
            // Arrange
            const messageWithoutText = {
                message_id: 1,
                date: Date.now(),
                chat: { id: 123, type: 'private' },
                photo: [{ file_id: 'abc', file_unique_id: 'def', width: 100, height: 100 }]
            };

            ctx = createMockContext({
                message: messageWithoutText as any,
                callbackQuery: undefined
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedCommand).not.toHaveBeenCalled();
            expect(authService.isAuthenticated).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle callback queries without data property without checking auth', async () => {
            // Arrange
            const callbackWithoutData = {
                id: 'query-id',
                chat_instance: 'instance'
            };

            ctx = createMockContext({
                message: undefined,
                callbackQuery: callbackWithoutData as any
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedAction).not.toHaveBeenCalled();
            // Important: Auth is NOT checked for callbacks without data
            expect(authService.isAuthenticated).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle messages that are neither commands nor callbacks', async () => {
            // Arrange - create context with neither message nor callbackQuery
            ctx = createMockContext({
                message: undefined,
                callbackQuery: undefined
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(isProtectedCommand).not.toHaveBeenCalled();
            expect(isProtectedAction).not.toHaveBeenCalled();
            expect(authService.isAuthenticated).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });
}); 