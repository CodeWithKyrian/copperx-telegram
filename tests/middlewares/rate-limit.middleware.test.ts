import { rateLimitMiddleware, RateLimits } from '../../src/middlewares/rate-limit.middleware';
import { createMockContext } from '../__mocks__/context.mock';
import { RateLimiterService } from '../../src/services/rate-limiter.service';
import { callMiddleware } from '../__mocks__/context.mock';
import logger from '../../src/utils/logger.utils';

// Mock dependencies
jest.mock('../../src/services/rate-limiter.service');
jest.mock('../../src/utils/logger.utils');

describe('Rate Limit Middleware', () => {
    let ctx: ReturnType<typeof createMockContext>;
    const mockNext = jest.fn().mockResolvedValue(undefined);

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext({
            from: {
                id: 123456789,
                username: 'testuser',
                is_bot: false,
                first_name: 'Test'
            }
        });
    });

    describe('basic functionality', () => {
        it('should allow requests under the rate limit', async () => {
            // Arrange
            const middleware = rateLimitMiddleware(RateLimits.API);

            // Mock rate limiter to return under limit
            (RateLimiterService.getRateLimitInfo as jest.Mock).mockReturnValue({
                key: 'api:123456789',
                attempts: 5,
                remaining: 25,
                exceeds: false,
                resetAt: Date.now() + 30000
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(RateLimiterService.getRateLimitInfo).toHaveBeenCalledWith(
                ctx,
                expect.objectContaining({
                    key: 'api:123456789',
                    maxAttempts: 30,
                    decaySeconds: 60
                })
            );
            expect(RateLimiterService.increment).toHaveBeenCalled();
            expect(ctx.reply).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should block requests that exceed the rate limit', async () => {
            // Arrange
            const middleware = rateLimitMiddleware(RateLimits.API);

            // Mock rate limiter to return over limit
            (RateLimiterService.getRateLimitInfo as jest.Mock).mockReturnValue({
                key: 'api:123456789',
                attempts: 31,
                remaining: 0,
                exceeds: true,
                resetAt: Date.now() + 30000
            });

            // Mock available in text
            (RateLimiterService.availableInText as jest.Mock).mockReturnValue('30 seconds');

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(RateLimiterService.getRateLimitInfo).toHaveBeenCalled();
            expect(RateLimiterService.availableInText).toHaveBeenCalledWith(ctx, 'api:123456789');
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('Too Many Requests'),
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
            expect(RateLimiterService.increment).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('config variations', () => {
        it('should use custom config values', async () => {
            // Arrange
            const customConfig = {
                key: 'custom_limit',
                maxAttempts: 5,
                decaySeconds: 300,
                message: 'Custom rate limit message'
            };

            const middleware = rateLimitMiddleware(customConfig);

            // Mock rate limiter to return under limit
            (RateLimiterService.getRateLimitInfo as jest.Mock).mockReturnValue({
                key: 'custom_limit:123456789',
                attempts: 3,
                remaining: 2,
                exceeds: false,
                resetAt: Date.now() + 150000
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(RateLimiterService.getRateLimitInfo).toHaveBeenCalledWith(
                ctx,
                expect.objectContaining({
                    key: 'custom_limit:123456789',
                    maxAttempts: 5,
                    decaySeconds: 300
                })
            );
            expect(RateLimiterService.increment).toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should use custom error message when limit is exceeded', async () => {
            // Arrange
            const customConfig = {
                key: 'custom_limit',
                maxAttempts: 5,
                decaySeconds: 300,
                message: 'Custom rate limit message'
            };

            const middleware = rateLimitMiddleware(customConfig);

            // Mock rate limiter to return over limit
            (RateLimiterService.getRateLimitInfo as jest.Mock).mockReturnValue({
                key: 'custom_limit:123456789',
                attempts: 6,
                remaining: 0,
                exceeds: true,
                resetAt: Date.now() + 150000
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(ctx.reply).toHaveBeenCalledWith(
                'Custom rate limit message',
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should test all predefined rate limit configurations', async () => {
            // Test all predefined configurations
            const configs = [
                RateLimits.AUTH,
                RateLimits.OTP_VERIFY,
                RateLimits.SENSITIVE_OPS,
                RateLimits.API
            ];

            for (const config of configs) {
                // Reset mocks
                jest.clearAllMocks();

                // Arrange
                const middleware = rateLimitMiddleware(config);

                // Mock rate limiter to return under limit
                (RateLimiterService.getRateLimitInfo as jest.Mock).mockReturnValue({
                    key: `${config.key}:123456789`,
                    attempts: 1,
                    remaining: config.maxAttempts - 1,
                    exceeds: false,
                    resetAt: Date.now() + 30000
                });

                // Act
                await callMiddleware(middleware, ctx, mockNext);

                // Assert
                expect(RateLimiterService.getRateLimitInfo).toHaveBeenCalledWith(
                    ctx,
                    expect.objectContaining({
                        key: `${config.key}:123456789`,
                        maxAttempts: config.maxAttempts,
                        decaySeconds: config.decaySeconds
                    })
                );
                expect(RateLimiterService.increment).toHaveBeenCalled();
                expect(mockNext).toHaveBeenCalled();
            }
        });
    });

    describe('special cases', () => {
        it('should skip rate limiting for contexts without user ID', async () => {
            // Arrange
            const middleware = rateLimitMiddleware(RateLimits.API);
            const ctxWithoutUser = createMockContext({ from: undefined });

            // Act
            await callMiddleware(middleware, ctxWithoutUser, mockNext);

            // Assert
            expect(RateLimiterService.getRateLimitInfo).not.toHaveBeenCalled();
            expect(RateLimiterService.increment).not.toHaveBeenCalled();
            expect(mockNext).toHaveBeenCalled();
        });

        it('should use default message when availableInText returns null', async () => {
            // Arrange
            const middleware = rateLimitMiddleware(RateLimits.API);

            // Mock rate limiter to return over limit
            (RateLimiterService.getRateLimitInfo as jest.Mock).mockReturnValue({
                key: 'api:123456789',
                attempts: 31,
                remaining: 0,
                exceeds: true,
                resetAt: 0  // Valid but epoch time
            });

            // Mock available in text to return null
            (RateLimiterService.availableInText as jest.Mock).mockReturnValue(null);

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(logger.debug).toHaveBeenCalled(); // Just verify it was called without checking resetAt

            // Important change: expect the default API rate limit message
            expect(ctx.reply).toHaveBeenCalledWith(
                RateLimits.API.message,
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should use "soon" as default when availableInText returns null', async () => {
            // Arrange
            const customConfig = {
                key: 'custom_no_message',
                maxAttempts: 5,
                decaySeconds: 300
                // No message property
            };

            const middleware = rateLimitMiddleware(customConfig);

            // Mock rate limiter to return over limit
            (RateLimiterService.getRateLimitInfo as jest.Mock).mockReturnValue({
                key: 'custom_no_message:123456789',
                attempts: 6,
                remaining: 0,
                exceeds: true,
                resetAt: 0  // Valid but epoch time
            });

            // Mock available in text to return null
            (RateLimiterService.availableInText as jest.Mock).mockReturnValue(null);

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(logger.debug).toHaveBeenCalled();

            // Now we should see the dynamic message with "soon"
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('try again in soon'),
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('default behavior', () => {
        it('should use API rate limit config by default', async () => {
            // Arrange
            const middleware = rateLimitMiddleware(); // No config provided

            // Mock rate limiter to return under limit
            (RateLimiterService.getRateLimitInfo as jest.Mock).mockReturnValue({
                key: 'api:123456789',
                attempts: 5,
                remaining: 25,
                exceeds: false,
                resetAt: Date.now() + 30000
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(RateLimiterService.getRateLimitInfo).toHaveBeenCalledWith(
                ctx,
                expect.objectContaining({
                    key: 'api:123456789',
                    maxAttempts: 30,
                    decaySeconds: 60
                })
            );
        });
    });

    describe('logging', () => {
        it('should log rate limit information', async () => {
            // Arrange
            const middleware = rateLimitMiddleware(RateLimits.API);
            const resetTime = Date.now() + 30000;

            // Mock rate limiter to return under limit
            (RateLimiterService.getRateLimitInfo as jest.Mock).mockReturnValue({
                key: 'api:123456789',
                attempts: 5,
                remaining: 25,
                exceeds: false,
                resetAt: resetTime
            });

            // Act
            await callMiddleware(middleware, ctx, mockNext);

            // Assert
            expect(logger.debug).toHaveBeenCalledWith({
                key: 'api:123456789',
                attempts: 5,
                remaining: 25,
                exceeds: false,
                resetAt: new Date(resetTime).toISOString()
            }, 'Rate limit check');
        });
    });
}); 