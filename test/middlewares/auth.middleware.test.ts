import { createAuthMiddleware } from '../../src/middlewares/auth.middleware';
import { authService } from '../../src/services/auth.service';
import { isProtectedCommand } from '../../src/commands';
import { callMiddleware } from '../utils/mock-context';


// Mock dependencies
jest.mock('../../src/services/auth.service');
jest.mock('../../src/commands');
jest.mock('../../src/utils/logger');


describe('Auth Middleware', () => {
    // Mock next function
    const mockNext = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should allow access to unprotected commands', async () => {
        // Setup mocks
        const mockCtx = {
            message: {
                text: '/start',
            },
            reply: jest.fn(),
        };

        // Mock isProtectedCommand to return false
        (isProtectedCommand as jest.Mock).mockReturnValue(false);

        // Create middleware function
        const middleware = createAuthMiddleware();

        // Call middleware with context and next
        await callMiddleware(middleware, mockCtx as any, mockNext);

        // Verify command was checked
        expect(isProtectedCommand).toHaveBeenCalledWith('start');

        // Verify auth was not checked
        expect(authService.isAuthenticated).not.toHaveBeenCalled();

        // Verify no error response was sent
        expect(mockCtx.reply).not.toHaveBeenCalled();

        // Verify next was called
        expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access to protected commands when authenticated', async () => {
        // Setup mocks
        const mockCtx = {
            message: {
                text: '/logout',
            },
            reply: jest.fn(),
        };

        // Mock protected command and authenticated user
        (isProtectedCommand as jest.Mock).mockReturnValue(true);
        (authService.isAuthenticated as jest.Mock).mockReturnValue(true);

        // Create middleware function
        const middleware = createAuthMiddleware();

        // Call middleware with context and next
        await callMiddleware(middleware, mockCtx as any, mockNext);

        // Verify command was checked
        expect(isProtectedCommand).toHaveBeenCalledWith('logout');

        // Verify auth was checked
        expect(authService.isAuthenticated).toHaveBeenCalledWith(mockCtx);

        // Verify no error response was sent
        expect(mockCtx.reply).not.toHaveBeenCalled();

        // Verify next was called
        expect(mockNext).toHaveBeenCalled();
    });

    it('should block access to protected commands when not authenticated', async () => {
        // Setup mocks
        const mockCtx = {
            message: {
                text: '/me',
            },
            from: {
                id: 123456,
                username: 'testuser',
            },
            reply: jest.fn().mockResolvedValue(undefined),
        };

        // Mock protected command but unauthenticated user
        (isProtectedCommand as jest.Mock).mockReturnValue(true);
        (authService.isAuthenticated as jest.Mock).mockReturnValue(false);

        // Create middleware function
        const middleware = createAuthMiddleware();

        // Call middleware with context and next
        await callMiddleware(middleware, mockCtx as any, mockNext);

        // Verify command was checked
        expect(isProtectedCommand).toHaveBeenCalledWith('me');

        // Verify auth was checked
        expect(authService.isAuthenticated).toHaveBeenCalledWith(mockCtx);

        // Verify error response was sent
        expect(mockCtx.reply).toHaveBeenCalledWith(
            expect.stringContaining('Authentication Required'),
            { parse_mode: 'Markdown' }
        );

        // Verify next was NOT called
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should ignore non-command messages', async () => {
        // Setup mocks for a regular text message
        const mockCtx = {
            message: {
                text: 'This is just a regular message',
            },
        };

        // Create middleware function
        const middleware = createAuthMiddleware();

        // Call middleware with context and next
        await callMiddleware(middleware, mockCtx as any, mockNext);

        // Verify command was not checked
        expect(isProtectedCommand).not.toHaveBeenCalled();

        // Verify auth was not checked
        expect(authService.isAuthenticated).not.toHaveBeenCalled();

        // Verify next was called
        expect(mockNext).toHaveBeenCalled();
    });

    it('should handle commands with bot username', async () => {
        // Setup mocks for a command with bot username
        const mockCtx = {
            message: {
                text: '/logout@MyTestBot',
            },
            reply: jest.fn(),
        };

        // Mock protected command and authenticated user
        (isProtectedCommand as jest.Mock).mockReturnValue(true);
        (authService.isAuthenticated as jest.Mock).mockReturnValue(true);

        // Create middleware function
        const middleware = createAuthMiddleware();

        // Call middleware with context and next
        await callMiddleware(middleware, mockCtx as any, mockNext);

        // Verify command was checked with the correct name (without bot username)
        expect(isProtectedCommand).toHaveBeenCalledWith('logout');

        // Verify next was called
        expect(mockNext).toHaveBeenCalled();
    });

    it('should handle commands with arguments', async () => {
        // Setup mocks for a command with arguments
        const mockCtx = {
            message: {
                text: '/transfer 100 USDC to @user',
            },
            reply: jest.fn(),
        };

        // Mock protected command and authenticated user
        (isProtectedCommand as jest.Mock).mockReturnValue(true);
        (authService.isAuthenticated as jest.Mock).mockReturnValue(true);

        // Create middleware function
        const middleware = createAuthMiddleware();

        // Call middleware with context and next
        await callMiddleware(middleware, mockCtx as any, mockNext);

        // Verify command was checked with just the command name
        expect(isProtectedCommand).toHaveBeenCalledWith('transfer');

        // Verify next was called
        expect(mockNext).toHaveBeenCalled();
    });
}); 