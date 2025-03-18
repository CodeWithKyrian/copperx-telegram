import { apiClientMiddleware } from '../../src/middlewares/api-client.middleware';
import { createMockContext } from '../__mocks__/context.mock';
import { authService } from '../../src/services/auth.service';
import { callMiddleware } from '../__mocks__/context.mock';

// Mock dependencies
jest.mock('../../src/services/auth.service');
jest.mock('../../src/utils/logger.utils');

describe('API Client Middleware', () => {
    // Create middleware instance once
    const middleware = apiClientMiddleware();
    let ctx: ReturnType<typeof createMockContext>;
    const mockNext = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();
    });

    describe('authenticated users', () => {
        beforeEach(() => {
            // Default behavior for authenticated users
            (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
        });

        it('should set up API client when token is available', async () => {
            // Arrange
            const mockToken = 'valid-token-123';
            (authService.getDecryptedToken as jest.Mock).mockReturnValue(mockToken);
            (authService.setupApiClientForRequest as jest.Mock).mockReturnValue(undefined);

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(authService.getDecryptedToken).toHaveBeenCalledWith(ctx);
            expect(authService.setupApiClientForRequest).toHaveBeenCalledWith(ctx);
            expect(mockNext).toHaveBeenCalled();
        });

        it('should not set up API client when token is null', async () => {
            // Arrange
            (authService.getDecryptedToken as jest.Mock).mockReturnValue(null);

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(authService.getDecryptedToken).toHaveBeenCalledWith(ctx);
            expect(authService.setupApiClientForRequest).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should not set up API client when token is undefined', async () => {
            // Arrange
            (authService.getDecryptedToken as jest.Mock).mockReturnValue(undefined);

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(authService.getDecryptedToken).toHaveBeenCalledWith(ctx);
            expect(authService.setupApiClientForRequest).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should not set up API client when token is empty string', async () => {
            // Arrange
            (authService.getDecryptedToken as jest.Mock).mockReturnValue('');

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(authService.getDecryptedToken).toHaveBeenCalledWith(ctx);
            expect(authService.setupApiClientForRequest).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('unauthenticated users', () => {
        beforeEach(() => {
            // Default behavior for unauthenticated users
            (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
        });

        it('should not attempt to get token or set up API client', async () => {
            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(authService.isAuthenticated).toHaveBeenCalledWith(ctx);
            expect(authService.getDecryptedToken).not.toHaveBeenCalled();
            expect(authService.setupApiClientForRequest).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('middleware behavior', () => {
        it('should always call next() regardless of authentication status', async () => {
            // Arrange - unauthenticated user
            (authService.isAuthenticated as jest.Mock).mockReturnValue(false);

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(mockNext).toHaveBeenCalled();

            // Reset mocks
            jest.clearAllMocks();

            // Arrange - authenticated user with valid token
            (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
            (authService.getDecryptedToken as jest.Mock).mockReturnValue('token');

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(mockNext).toHaveBeenCalled();
        });
    });
}); 