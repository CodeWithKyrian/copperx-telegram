import { RateLimiterService, RateLimitConfig } from '../../src/services/rate-limiter.service';
import { createMockContext } from '../__mocks__/context.mock';
import logger from '../../src/utils/logger.utils';

// Mock dependencies
jest.mock('../../src/utils/logger.utils');

describe('Rate Limiter Service', () => {
    // Mock date functionality for consistent testing
    let originalDateNow: () => number;
    let mockNow: number;

    // Test constants
    const TEST_KEY = 'test-rate-limit';
    const DEFAULT_CONFIG: RateLimitConfig = {
        key: TEST_KEY,
        maxAttempts: 3,
        decaySeconds: 60,
        message: 'Rate limit exceeded'
    };

    beforeAll(() => {
        // Store original Date.now
        originalDateNow = Date.now;
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Set consistent time for tests
        mockNow = 1609459200000; // 2021-01-01T00:00:00Z
        Date.now = jest.fn(() => mockNow);
    });

    afterAll(() => {
        // Restore original Date.now
        Date.now = originalDateNow;
    });

    describe('getRateLimitInfo', () => {
        it('should initialize rate limit info when first accessed', () => {
            // Arrange
            const ctx = createMockContext();

            // Act
            const info = RateLimiterService.getRateLimitInfo(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info).toEqual({
                attempts: 0,
                resetAt: mockNow + (DEFAULT_CONFIG.decaySeconds * 1000),
                exceeds: false,
                remaining: DEFAULT_CONFIG.maxAttempts
            });

            expect(ctx.session.rateLimits?.[TEST_KEY]).toEqual({
                attempts: 0,
                resetAt: mockNow + (DEFAULT_CONFIG.decaySeconds * 1000)
            });
        });

        it('should return existing rate limit info', () => {
            // Arrange
            const ctx = createMockContext();
            const existingResetAt = mockNow + 30000; // 30 seconds from now

            // Initialize rate limit in session
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: 2,
                    resetAt: existingResetAt
                }
            };

            // Act
            const info = RateLimiterService.getRateLimitInfo(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info).toEqual({
                attempts: 2,
                resetAt: existingResetAt,
                exceeds: false,
                remaining: 1 // maxAttempts - attempts = 3 - 2 = 1
            });
        });

        it('should reset expired rate limits', () => {
            // Arrange
            const ctx = createMockContext();
            const expiredResetAt = mockNow - 1000; // 1 second ago (expired)

            // Initialize expired rate limit in session
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: 2,
                    resetAt: expiredResetAt
                }
            };

            // Act
            const info = RateLimiterService.getRateLimitInfo(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info).toEqual({
                attempts: 0, // Reset to 0
                resetAt: mockNow + (DEFAULT_CONFIG.decaySeconds * 1000),
                exceeds: false,
                remaining: DEFAULT_CONFIG.maxAttempts
            });
        });

        it('should handle exceeded limit correctly', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit at maximum attempts
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts,
                    resetAt: mockNow + 30000
                }
            };

            // Act
            const info = RateLimiterService.getRateLimitInfo(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info).toEqual({
                attempts: DEFAULT_CONFIG.maxAttempts,
                resetAt: mockNow + 30000,
                exceeds: true,
                remaining: 0
            });
        });

        it('should handle missing session gracefully', () => {
            // Arrange
            const ctx = createMockContext({ session: undefined });

            // Act
            const info = RateLimiterService.getRateLimitInfo(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info).toEqual({
                attempts: 0,
                resetAt: 0,
                exceeds: false,
                remaining: DEFAULT_CONFIG.maxAttempts
            });

            expect(logger.warn).toHaveBeenCalledWith('Session not available for rate limiting, allowing request');
        });
    });

    describe('isLimited', () => {
        it('should return false when under the limit', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit below max attempts
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts - 1,
                    resetAt: mockNow + 30000
                }
            };

            // Act
            const limited = RateLimiterService.isLimited(ctx, DEFAULT_CONFIG);

            // Assert
            expect(limited).toBe(false);
        });

        it('should return true when at or over the limit', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit at max attempts
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts,
                    resetAt: mockNow + 30000
                }
            };

            // Act
            const limited = RateLimiterService.isLimited(ctx, DEFAULT_CONFIG);

            // Assert
            expect(limited).toBe(true);
        });

        it('should initialize rate limit when first checked', () => {
            // Arrange
            const ctx = createMockContext();

            // Act
            const limited = RateLimiterService.isLimited(ctx, DEFAULT_CONFIG);

            // Assert
            expect(limited).toBe(false);
            expect(ctx.session.rateLimits?.[TEST_KEY]).toBeDefined();
            expect(ctx.session.rateLimits?.[TEST_KEY].attempts).toBe(0);
        });
    });

    describe('increment', () => {
        it('should increment attempts count', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: 1,
                    resetAt: mockNow + 30000
                }
            };

            // Act
            const info = RateLimiterService.increment(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info.attempts).toBe(2);
            expect(ctx.session.rateLimits[TEST_KEY].attempts).toBe(2);
            expect(info.remaining).toBe(1);
        });

        it('should mark as exceeded when max attempts reached', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit one below max
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts - 1,
                    resetAt: mockNow + 30000
                }
            };

            // Act
            const info = RateLimiterService.increment(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info.attempts).toBe(DEFAULT_CONFIG.maxAttempts);
            expect(info.exceeds).toBe(true);
            expect(info.remaining).toBe(0);
        });

        it('should initialize rate limit if not exists', () => {
            // Arrange
            const ctx = createMockContext();

            // Act
            const info = RateLimiterService.increment(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info.attempts).toBe(1);
            expect(ctx.session.rateLimits?.[TEST_KEY].attempts).toBe(1);
            expect(info.exceeds).toBe(false);
            expect(info.remaining).toBe(DEFAULT_CONFIG.maxAttempts - 1);
        });

        it('should handle missing session gracefully', () => {
            // Arrange
            const ctx = createMockContext({ session: undefined });

            // Act
            const info = RateLimiterService.increment(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info).toEqual({
                attempts: 0,
                resetAt: 0,
                exceeds: false,
                remaining: DEFAULT_CONFIG.maxAttempts
            });

            expect(logger.warn).toHaveBeenCalledWith('Session not available for rate limiting, skipping increment');
        });
    });

    describe('clear', () => {
        it('should clear specified rate limit', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize multiple rate limits
            ctx.session.rateLimits = {
                [TEST_KEY]: { attempts: 1, resetAt: mockNow + 30000 },
                'other-key': { attempts: 2, resetAt: mockNow + 60000 }
            };

            // Act
            RateLimiterService.clear(ctx, TEST_KEY);

            // Assert
            expect(ctx.session.rateLimits[TEST_KEY]).toBeUndefined();
            expect(ctx.session.rateLimits['other-key']).toBeDefined();
        });

        it('should handle missing rate limit', () => {
            // Arrange
            const ctx = createMockContext();

            // Act (should not throw)
            RateLimiterService.clear(ctx, 'non-existent-key');

            // Assert
            expect(ctx.session.rateLimits).toBeUndefined();
        });

        it('should handle missing session gracefully', () => {
            // Arrange
            const ctx = createMockContext({ session: undefined });

            // Act (should not throw)
            RateLimiterService.clear(ctx, TEST_KEY);

            // No explicit assertions - just verifying it doesn't throw
        });
    });

    describe('clearAll', () => {
        it('should clear all rate limits', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize multiple rate limits
            ctx.session.rateLimits = {
                [TEST_KEY]: { attempts: 1, resetAt: mockNow + 30000 },
                'other-key': { attempts: 2, resetAt: mockNow + 60000 }
            };

            // Act
            RateLimiterService.clearAll(ctx);

            // Assert
            expect(ctx.session.rateLimits).toEqual({});
        });

        it('should handle missing session gracefully', () => {
            // Arrange
            const ctx = createMockContext({ session: undefined });

            // Act (should not throw)
            RateLimiterService.clearAll(ctx);

            // No explicit assertions - just verifying it doesn't throw
        });
    });

    describe('availableIn', () => {
        it('should return correct time until reset in seconds', () => {
            // Arrange
            const ctx = createMockContext();
            const resetDelay = 30; // seconds

            // Initialize rate limit with future reset time
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts,
                    resetAt: mockNow + (resetDelay * 1000)
                }
            };

            // Act
            const availableIn = RateLimiterService.availableIn(ctx, TEST_KEY);

            // Assert
            expect(availableIn).toBe(resetDelay);
        });

        it('should round up to the nearest second', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit with 10.5 seconds remaining
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts,
                    resetAt: mockNow + 10500 // 10.5 seconds
                }
            };

            // Act
            const availableIn = RateLimiterService.availableIn(ctx, TEST_KEY);

            // Assert
            expect(availableIn).toBe(11); // Rounds up to 11 seconds
        });

        it('should return 0 for non-existent rate limit', () => {
            // Arrange
            const ctx = createMockContext();

            // Act
            const availableIn = RateLimiterService.availableIn(ctx, 'non-existent-key');

            // Assert
            expect(availableIn).toBe(0);
        });

        it('should return 0 for expired rate limit', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit with past reset time
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts,
                    resetAt: mockNow - 1000 // 1 second ago
                }
            };

            // Act
            const availableIn = RateLimiterService.availableIn(ctx, TEST_KEY);

            // Assert
            expect(availableIn).toBe(0);
        });

        it('should handle missing session gracefully', () => {
            // Arrange
            const ctx = createMockContext({ session: undefined });

            // Act
            const availableIn = RateLimiterService.availableIn(ctx, TEST_KEY);

            // Assert
            expect(availableIn).toBe(0);
        });
    });

    describe('availableInText', () => {
        it('should format seconds correctly', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit with small delay
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts,
                    resetAt: mockNow + 5000 // 5 seconds
                }
            };

            // Act
            const text = RateLimiterService.availableInText(ctx, TEST_KEY);

            // Assert
            expect(text).toBe('5 seconds');
        });

        it('should use singular for 1 second', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit with 1 second delay
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts,
                    resetAt: mockNow + 1000 // 1 second
                }
            };

            // Act
            const text = RateLimiterService.availableInText(ctx, TEST_KEY);

            // Assert
            expect(text).toBe('1 second');
        });

        it('should format minutes correctly', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit with larger delay
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts,
                    resetAt: mockNow + 120000 // 2 minutes
                }
            };

            // Act
            const text = RateLimiterService.availableInText(ctx, TEST_KEY);

            // Assert
            expect(text).toBe('2 minutes');
        });

        it('should use singular for 1 minute', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit with 60 seconds delay
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts,
                    resetAt: mockNow + 60000 // 1 minute
                }
            };

            // Act
            const text = RateLimiterService.availableInText(ctx, TEST_KEY);

            // Assert
            expect(text).toBe('1 minute');
        });

        it('should round up to the nearest minute', () => {
            // Arrange
            const ctx = createMockContext();

            // Initialize rate limit with 61 seconds (just over 1 minute)
            ctx.session.rateLimits = {
                [TEST_KEY]: {
                    attempts: DEFAULT_CONFIG.maxAttempts,
                    resetAt: mockNow + 61000 // 61 seconds
                }
            };

            // Act
            const text = RateLimiterService.availableInText(ctx, TEST_KEY);

            // Assert
            expect(text).toBe('2 minutes');
        });

        it('should return null for non-existent or expired rate limit', () => {
            // Arrange
            const ctx = createMockContext();

            // Act
            const text = RateLimiterService.availableInText(ctx, 'non-existent-key');

            // Assert
            expect(text).toBeNull();
        });

        it('should handle missing session gracefully', () => {
            // Arrange
            const ctx = createMockContext({ session: undefined });

            // Act
            const text = RateLimiterService.availableInText(ctx, TEST_KEY);

            // Assert
            expect(text).toBeNull();
        });
    });

    describe('Integration tests', () => {
        it('should track attempts across multiple calls', () => {
            // Arrange
            const ctx = createMockContext();

            // Act - First check and increment
            const info1 = RateLimiterService.getRateLimitInfo(ctx, DEFAULT_CONFIG);
            RateLimiterService.increment(ctx, DEFAULT_CONFIG);

            // Second check and increment
            const info2 = RateLimiterService.getRateLimitInfo(ctx, DEFAULT_CONFIG);
            RateLimiterService.increment(ctx, DEFAULT_CONFIG);

            // Third check and increment - should now be limited
            const info3 = RateLimiterService.getRateLimitInfo(ctx, DEFAULT_CONFIG);
            RateLimiterService.increment(ctx, DEFAULT_CONFIG);

            // Final check - should be over limit
            const limited = RateLimiterService.isLimited(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info1.attempts).toBe(0);
            expect(info1.exceeds).toBe(false);

            expect(info2.attempts).toBe(1);
            expect(info2.exceeds).toBe(false);

            expect(info3.attempts).toBe(2);
            expect(info3.exceeds).toBe(false);

            expect(limited).toBe(true);
            expect(ctx.session.rateLimits?.[TEST_KEY]?.attempts).toBe(3);
        });

        it('should reset after decay period', () => {
            // Arrange
            const ctx = createMockContext();

            // First increment
            RateLimiterService.increment(ctx, DEFAULT_CONFIG);

            // Fast forward time past decay period
            const newTime = mockNow + ((DEFAULT_CONFIG.decaySeconds + 1) * 1000);
            Date.now = jest.fn(() => newTime);

            // Act - check after time has passed
            const info = RateLimiterService.getRateLimitInfo(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info.attempts).toBe(0); // Should be reset
            expect(info.resetAt).toBe(newTime + (DEFAULT_CONFIG.decaySeconds * 1000)); // New reset time
        });

        it('should handle clear followed by new increments correctly', () => {
            // Arrange
            const ctx = createMockContext();

            // Add some attempts
            RateLimiterService.increment(ctx, DEFAULT_CONFIG);
            RateLimiterService.increment(ctx, DEFAULT_CONFIG);

            // Clear the limit
            RateLimiterService.clear(ctx, TEST_KEY);

            // Act - increment again and check
            const info = RateLimiterService.increment(ctx, DEFAULT_CONFIG);

            // Assert
            expect(info.attempts).toBe(1); // Should start from 1
            expect(info.exceeds).toBe(false);
        });
    });
}); 