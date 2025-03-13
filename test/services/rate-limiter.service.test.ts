import { RateLimiterService, RateLimitConfig } from '../../src/services/rate-limiter.service';
import { GlobalContext } from '../../src/types';

// Mock logger
jest.mock('../../src/utils/logger');

describe('RateLimiterService', () => {
    // Test rate limit config
    const testConfig: RateLimitConfig = {
        key: 'test-limit',
        maxAttempts: 3,
        decaySeconds: 60
    };

    // Mock context with session
    let mockCtx: Partial<GlobalContext>;

    beforeEach(() => {
        // Reset mock context
        mockCtx = {
            session: {}
        };
    });

    describe('getRateLimitInfo', () => {
        it('should create a new rate limit if it does not exist', () => {
            const info = RateLimiterService.getRateLimitInfo(mockCtx as GlobalContext, testConfig);

            expect(info.attempts).toBe(0);
            expect(info.exceeds).toBe(false);
            expect(info.remaining).toBe(3);
            expect(info.resetAt).toBeGreaterThan(Date.now());
        });

        it('should return existing rate limit info', () => {
            // Set up existing rate limit
            const now = Date.now();
            const resetAt = now + 60000; // 1 minute from now

            mockCtx.session!['rateLimits'] = {
                [testConfig.key]: {
                    attempts: 2,
                    resetAt
                }
            };

            const info = RateLimiterService.getRateLimitInfo(mockCtx as GlobalContext, testConfig);

            expect(info.attempts).toBe(2);
            expect(info.exceeds).toBe(false);
            expect(info.remaining).toBe(1);
            expect(info.resetAt).toBe(resetAt);
        });

        it('should handle missing session gracefully', () => {
            mockCtx = {}; // No session

            const info = RateLimiterService.getRateLimitInfo(mockCtx as GlobalContext, testConfig);

            expect(info.attempts).toBe(0);
            expect(info.exceeds).toBe(false);
            expect(info.remaining).toBe(3);
        });
    });

    describe('increment', () => {
        it('should increment attempt count', () => {
            // First increment
            let info = RateLimiterService.increment(mockCtx as GlobalContext, testConfig);
            expect(info.attempts).toBe(1);
            expect(info.exceeds).toBe(false);
            expect(info.remaining).toBe(2);

            // Second increment
            info = RateLimiterService.increment(mockCtx as GlobalContext, testConfig);
            expect(info.attempts).toBe(2);
            expect(info.exceeds).toBe(false);
            expect(info.remaining).toBe(1);

            // Third increment - hits limit
            info = RateLimiterService.increment(mockCtx as GlobalContext, testConfig);
            expect(info.attempts).toBe(3);
            expect(info.exceeds).toBe(true);
            expect(info.remaining).toBe(0);

            // Fourth increment - exceeds limit
            info = RateLimiterService.increment(mockCtx as GlobalContext, testConfig);
            expect(info.attempts).toBe(4);
            expect(info.exceeds).toBe(true);
            expect(info.remaining).toBe(0);
        });

        it('should handle missing session gracefully', () => {
            mockCtx = {}; // No session

            const info = RateLimiterService.increment(mockCtx as GlobalContext, testConfig);

            expect(info.attempts).toBe(0);
            expect(info.exceeds).toBe(false);
            expect(info.remaining).toBe(3);
        });
    });

    describe('isLimited', () => {
        it('should return false when under the limit', () => {
            mockCtx.session!['rateLimits'] = {
                [testConfig.key]: {
                    attempts: 2,
                    resetAt: Date.now() + 60000
                }
            };

            expect(RateLimiterService.isLimited(mockCtx as GlobalContext, testConfig)).toBe(false);
        });

        it('should return true when limit is exceeded', () => {
            mockCtx.session!['rateLimits'] = {
                [testConfig.key]: {
                    attempts: 3, // At max attempts
                    resetAt: Date.now() + 60000
                }
            };

            expect(RateLimiterService.isLimited(mockCtx as GlobalContext, testConfig)).toBe(true);
        });
    });

    describe('clear', () => {
        it('should clear a specific rate limit', () => {
            // Set up multiple rate limits
            mockCtx.session!['rateLimits'] = {
                [testConfig.key]: {
                    attempts: 2,
                    resetAt: Date.now() + 60000
                },
                'other-limit': {
                    attempts: 1,
                    resetAt: Date.now() + 60000
                }
            };

            RateLimiterService.clear(mockCtx as GlobalContext, testConfig.key);

            // Verify the specific limit was cleared
            expect(mockCtx.session!['rateLimits'][testConfig.key]).toBeUndefined();
            expect(mockCtx.session!['rateLimits']['other-limit']).toBeDefined();
        });
    });

    describe('clearAll', () => {
        it('should clear all rate limits', () => {
            // Set up multiple rate limits
            mockCtx.session!['rateLimits'] = {
                [testConfig.key]: {
                    attempts: 2,
                    resetAt: Date.now() + 60000
                },
                'other-limit': {
                    attempts: 1,
                    resetAt: Date.now() + 60000
                }
            };

            RateLimiterService.clearAll(mockCtx as GlobalContext);

            // Verify all limits were cleared
            expect(mockCtx.session!['rateLimits']).toEqual({});
        });
    });

    describe('availableIn', () => {
        it('should calculate time remaining until reset', () => {
            const resetDelay = 30000; // 30 seconds
            const now = Date.now();

            mockCtx.session!['rateLimits'] = {
                [testConfig.key]: {
                    attempts: 3,
                    resetAt: now + resetDelay
                }
            };

            // Should be approximately 30 seconds (allowing for test execution time)
            const seconds = RateLimiterService.availableIn(mockCtx as GlobalContext, testConfig.key);
            expect(seconds).toBeGreaterThanOrEqual(29);
            expect(seconds).toBeLessThanOrEqual(30);
        });

        it('should return 0 for non-existent limit', () => {
            expect(RateLimiterService.availableIn(mockCtx as GlobalContext, 'non-existent')).toBe(0);
        });
    });

    describe('availableInText', () => {
        it('should format seconds as human-readable text', () => {
            const resetDelay = 30000; // 30 seconds
            const now = Date.now();

            mockCtx.session!['rateLimits'] = {
                [testConfig.key]: {
                    attempts: 3,
                    resetAt: now + resetDelay
                }
            };

            // Should be approximately "30 seconds"
            const text = RateLimiterService.availableInText(mockCtx as GlobalContext, testConfig.key);
            expect(text).toMatch(/\d+ seconds?/);
        });

        it('should format minutes as human-readable text', () => {
            const resetDelay = 90000; // 90 seconds (1.5 minutes)
            const now = Date.now();

            mockCtx.session!['rateLimits'] = {
                [testConfig.key]: {
                    attempts: 3,
                    resetAt: now + resetDelay
                }
            };

            // Should be "2 minutes" (ceiling of 1.5)
            const text = RateLimiterService.availableInText(mockCtx as GlobalContext, testConfig.key);
            expect(text).toMatch(/\d+ minutes?/);
        });

        it('should return null for non-existent limit', () => {
            expect(RateLimiterService.availableInText(mockCtx as GlobalContext, 'non-existent')).toBeNull();
        });
    });
}); 