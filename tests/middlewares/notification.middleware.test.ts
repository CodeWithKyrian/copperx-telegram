import { notificationMiddleware } from '../../src/middlewares/notification.middleware';
import { createMockContext } from '../__mocks__/context.mock';
import { notificationService } from '../../src/services/notification.service';
import { callMiddleware } from '../__mocks__/context.mock';
import logger from '../../src/utils/logger.utils';

// Mock dependencies
jest.mock('../../src/services/notification.service');
jest.mock('../../src/utils/logger.utils');

describe('Notification Middleware', () => {
    // Create middleware instance once
    const middleware = notificationMiddleware();
    let ctx: ReturnType<typeof createMockContext>;
    const mockNext = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();
    });

    describe('authenticated users', () => {
        it('should subscribe to deposits for authenticated users', async () => {
            // Arrange
            const userId = 123456789;
            const orgId = 'org-123';

            ctx = createMockContext({
                from: {
                    id: userId,
                    username: 'testuser',
                    is_bot: false,
                    first_name: 'Test'
                },
                session: {
                    auth: {
                        accessToken: 'valid-token',
                        organizationId: orgId
                    }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(notificationService.subscribeToDeposits).toHaveBeenCalledWith(userId, orgId);
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('unauthenticated users', () => {
        it('should not subscribe to deposits for users without access token', async () => {
            // Arrange
            ctx = createMockContext({
                from: {
                    id: 123456789,
                    username: 'testuser',
                    is_bot: false,
                    first_name: 'Test'
                },
                session: {
                    auth: {
                        accessToken: null,
                        organizationId: 'org-123'
                    }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(notificationService.subscribeToDeposits).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should not subscribe to deposits for users without organization ID', async () => {
            // Arrange
            ctx = createMockContext({
                from: {
                    id: 123456789,
                    username: 'testuser',
                    is_bot: false,
                    first_name: 'Test'
                },
                session: {
                    auth: {
                        accessToken: 'valid-token',
                        organizationId: null
                    }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(notificationService.subscribeToDeposits).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        it('should not subscribe for users with no user ID', async () => {
            // Arrange
            ctx = createMockContext({
                from: undefined,
                session: {
                    auth: {
                        accessToken: 'valid-token',
                        organizationId: 'org-123'
                    }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(notificationService.subscribeToDeposits).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle missing session gracefully', async () => {
            // Arrange
            ctx = createMockContext({
                from: {
                    id: 123456789,
                    username: 'testuser',
                    is_bot: false,
                    first_name: 'Test'
                },
                session: undefined
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(notificationService.subscribeToDeposits).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('error handling', () => {
        it('should log errors and continue if subscription fails', async () => {
            // Arrange
            const error = new Error('Subscription failed');
            (notificationService.subscribeToDeposits as jest.Mock).mockImplementation(() => {
                throw error;
            });

            ctx = createMockContext({
                from: {
                    id: 123456789,
                    username: 'testuser',
                    is_bot: false,
                    first_name: 'Test'
                },
                session: {
                    auth: {
                        accessToken: 'valid-token',
                        organizationId: 'org-123'
                    }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(notificationService.subscribeToDeposits).toHaveBeenCalled();
            expect(logger.error).toHaveBeenCalledWith('Error in notification middleware', { error });
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('middleware behavior', () => {
        it('should always call next() regardless of subscription status', async () => {
            // Arrange - unauthenticated user
            ctx = createMockContext({
                session: {
                    auth: {
                        accessToken: null,
                        organizationId: null
                    }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(mockNext).toHaveBeenCalled();

            // Reset mocks
            jest.clearAllMocks();

            // Arrange - authenticated user
            ctx = createMockContext({
                from: {
                    id: 123456789,
                    username: 'testuser',
                    is_bot: false,
                    first_name: 'Test'
                },
                session: {
                    auth: {
                        accessToken: 'valid-token',
                        organizationId: 'org-123'
                    }
                }
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(mockNext).toHaveBeenCalled();
        });
    });
}); 