import { Middleware } from 'telegraf';
import { GlobalContext } from '../types';
import { RateLimiterService, RateLimitConfig } from '../services/rate-limiter.service';
import logger from '../utils/logger.utils';

/**
 * Creates a middleware for rate limiting
 * @param config Rate limit configuration
 * @returns Rate limiting middleware
 */
export const rateLimitMiddleware = (config: RateLimitConfig = RateLimits.API): Middleware<GlobalContext> => {
    return async (ctx, next) => {
        // Skip rate limiting for non-user contexts (like channel posts)
        if (!ctx.from?.id) {
            return next();
        }

        // Create a unique key that includes the user ID
        const userKey = `${config.key}:${ctx.from.id}`;
        const limitConfig = { ...config, key: userKey };

        // Get current rate limit info
        const limitInfo = RateLimiterService.getRateLimitInfo(ctx, limitConfig);

        // Log rate limit status with safe handling of resetAt
        logger.debug({
            key: userKey,
            attempts: limitInfo.attempts,
            remaining: limitInfo.remaining,
            exceeds: limitInfo.exceeds,
            resetAt: limitInfo.resetAt ? new Date(limitInfo.resetAt).toISOString() : 'unknown'
        }, 'Rate limit check');

        // If rate limit exceeded, send message and stop
        if (limitInfo.exceeds) {
            const resetTime = RateLimiterService.availableInText(ctx, userKey) || 'soon';

            const message = config.message ||
                `⚠️ *Rate Limit Exceeded*\n\n` +
                `You've reached the maximum number of attempts. ` +
                `Please try again in ${resetTime}.`;

            await ctx.reply(message, { parse_mode: 'Markdown' });
            return; // Stop middleware chain
        }

        // Increment the rate limit counter
        RateLimiterService.increment(ctx, limitConfig);

        // Continue to next middleware
        return next();
    };
};

/**
 * Pre-defined rate limiters for common operations
 */
export const RateLimits = {
    /**
     * Rate limit for authentication attempts (5 per minute)
     */
    AUTH: {
        key: 'auth',
        maxAttempts: 5,
        decaySeconds: 60,
        message: '⚠️ *Too Many Authentication Attempts*\n\n' +
            'You\'ve reached the maximum number of login attempts. ' +
            'Please try again later to protect your account security.'
    },

    /**
     * Rate limit for OTP verification (3 per minute)
     */
    OTP_VERIFY: {
        key: 'otp_verify',
        maxAttempts: 3,
        decaySeconds: 60,
        message: '⚠️ *Too Many OTP Attempts*\n\n' +
            'You\'ve made too many incorrect OTP attempts. ' +
            'Please wait before trying again.'
    },

    /**
     * Rate limit for sensitive operations (10 per hour)
     */
    SENSITIVE_OPS: {
        key: 'sensitive_ops',
        maxAttempts: 10,
        decaySeconds: 3600,
        message: '⚠️ *Operation Limit Reached*\n\n' +
            'You\'ve reached the maximum number of sensitive operations allowed per hour. ' +
            'This is to protect your account security.'
    },

    /**
     * Rate limit for general API calls (30 per minute)
     */
    API: {
        key: 'api',
        maxAttempts: 30,
        decaySeconds: 60,
        message: '⚠️ *Too Many Requests*\n\n' +
            'You\'re making too many requests too quickly. ' +
            'Please slow down and try again later.'
    }
}; 