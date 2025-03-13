import { apiClientMiddleware } from '../../src/middlewares/api-client.middleware';
import { authService } from '../../src/services/auth.service';
import { callMiddleware } from '../utils/mock-context';

// Mock dependencies
jest.mock('../../src/services/auth.service');
jest.mock('../../src/utils/logger');

describe('API Client Middleware', () => {
    // Mock next function
    const mockNext = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should set up API client for authenticated users', async () => {
        // Setup mocks
        const mockCtx = { /* mock context */ };
        const mockToken = 'decrypted-token-123';

        // Mock authentication check to return true
        (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
        // Mock token retrieval
        (authService.getDecryptedToken as jest.Mock).mockReturnValue(mockToken);

        // Create middleware function
        const middleware = apiClientMiddleware();

        // Call middleware with context and next
        await callMiddleware(middleware, mockCtx as any, mockNext);

        // Verify authentication was checked
        expect(authService.isAuthenticated).toHaveBeenCalledWith(mockCtx);

        // Verify token was retrieved and API client set up
        expect(authService.getDecryptedToken).toHaveBeenCalledWith(mockCtx);
        expect(authService.setupApiClientForRequest).toHaveBeenCalledWith(mockCtx);

        // Verify next was called
        expect(mockNext).toHaveBeenCalled();
    });

    it('should not set up API client for unauthenticated users', async () => {
        // Setup mocks
        const mockCtx = { /* mock context */ };

        // Mock authentication check to return false
        (authService.isAuthenticated as jest.Mock).mockReturnValue(false);

        // Create middleware function
        const middleware = apiClientMiddleware();

        // Call middleware with context and next
        await callMiddleware(middleware, mockCtx as any, mockNext);

        // Verify authentication was checked
        expect(authService.isAuthenticated).toHaveBeenCalledWith(mockCtx);

        // Verify token was not retrieved and API client not set up
        expect(authService.getDecryptedToken).not.toHaveBeenCalled();
        expect(authService.setupApiClientForRequest).not.toHaveBeenCalled();

        // Verify next was still called
        expect(mockNext).toHaveBeenCalled();
    });

    it('should not set up API client when token is null', async () => {
        // Setup mocks
        const mockCtx = { /* mock context */ };

        // Mock authentication check to return true but null token
        (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
        (authService.getDecryptedToken as jest.Mock).mockReturnValue(null);

        // Create middleware function
        const middleware = apiClientMiddleware();

        // Call middleware with context and next
        await callMiddleware(middleware, mockCtx as any, mockNext);

        // Verify authentication was checked and token retrieved
        expect(authService.isAuthenticated).toHaveBeenCalledWith(mockCtx);
        expect(authService.getDecryptedToken).toHaveBeenCalledWith(mockCtx);

        // Verify API client was not set up since token is null
        expect(authService.setupApiClientForRequest).not.toHaveBeenCalled();

        // Verify next was called
        expect(mockNext).toHaveBeenCalled();
    });
}); 