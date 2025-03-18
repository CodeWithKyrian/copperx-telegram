import { GlobalContext } from '../types';
import logger from '../utils/logger.utils';

export interface RateLimitConfig {
    key: string;           // Unique key for this limit
    maxAttempts: number;   // Maximum number of attempts allowed
    decaySeconds: number;  // Time in seconds before attempts reset
    message?: string;      // Optional custom message when limit is reached
}

export interface RateLimitInfo {
    attempts: number;
    resetAt: number;
    exceeds: boolean;
    remaining: number;
}

/**
 * Rate limiter service for limiting API calls and actions
 */
export class RateLimiterService {
    /**
     * Checks if a rate limit is exceeded
     * @param ctx Telegraf context
     * @param config Rate limit configuration
     * @returns Whether the rate limit is exceeded
     */
    public static isLimited(ctx: GlobalContext, config: RateLimitConfig): boolean {
        const info = this.getRateLimitInfo(ctx, config);
        return info.exceeds;
    }

    /**
     * Gets information about a rate limit
     * @param ctx Telegraf context
     * @param config Rate limit configuration
     * @returns Rate limit information
     */
    public static getRateLimitInfo(ctx: GlobalContext, config: RateLimitConfig): RateLimitInfo {
        // Ensure session exists
        if (!ctx.session) {
            logger.warn('Session not available for rate limiting, allowing request');
            return { attempts: 0, resetAt: 0, exceeds: false, remaining: config.maxAttempts };
        }

        // Ensure rate limits container exists
        if (!ctx.session.rateLimits) {
            ctx.session.rateLimits = {};
        }

        const now = Date.now();

        // If limit doesn't exist or has expired, create a new one
        if (!ctx.session.rateLimits[config.key] || ctx.session.rateLimits[config.key].resetAt <= now) {
            ctx.session.rateLimits[config.key] = {
                attempts: 0,
                resetAt: now + (config.decaySeconds * 1000),
            };
        }

        const limit = ctx.session.rateLimits[config.key];
        const exceeds = limit.attempts >= config.maxAttempts;
        const remaining = Math.max(0, config.maxAttempts - limit.attempts);

        return {
            attempts: limit.attempts,
            resetAt: limit.resetAt,
            exceeds,
            remaining,
        };
    }

    /**
     * Increments the usage count for a rate limit
     * @param ctx Telegraf context
     * @param config Rate limit configuration
     * @returns Rate limit information after incrementing
     */
    public static increment(ctx: GlobalContext, config: RateLimitConfig): RateLimitInfo {
        // Ensure session exists
        if (!ctx.session) {
            logger.warn('Session not available for rate limiting, skipping increment');
            return { attempts: 0, resetAt: 0, exceeds: false, remaining: config.maxAttempts };
        }

        // Call getRateLimitInfo to ensure the rate limit exists in the session
        // (it will initialize the limit if it doesn't exist)
        this.getRateLimitInfo(ctx, config);

        // Increment attempts (we know this exists because getRateLimitInfo initializes it)
        if (ctx.session.rateLimits?.[config.key]) {
            ctx.session.rateLimits[config.key].attempts += 1;
        }

        const limit = ctx.session.rateLimits?.[config.key];

        // If somehow limit doesn't exist, return a default value
        if (!limit) {
            return { attempts: 0, resetAt: 0, exceeds: false, remaining: config.maxAttempts };
        }

        // Return updated info
        return {
            attempts: limit.attempts,
            resetAt: limit.resetAt,
            exceeds: limit.attempts >= config.maxAttempts,
            remaining: Math.max(0, config.maxAttempts - limit.attempts),
        };
    }

    /**
     * Clears a rate limit
     * @param ctx Telegraf context
     * @param key Rate limit key to clear
     */
    public static clear(ctx: GlobalContext, key: string): void {
        if (ctx.session?.rateLimits?.[key]) {
            delete ctx.session.rateLimits[key];
        }
    }

    /**
     * Clears all rate limits
     * @param ctx Telegraf context
     */
    public static clearAll(ctx: GlobalContext): void {
        if (ctx.session) {
            ctx.session.rateLimits = {};
        }
    }

    /**
     * Returns the time remaining until a rate limit resets, in seconds
     * @param ctx Telegraf context
     * @param key Rate limit key
     * @returns Time remaining in seconds, or 0 if limit doesn't exist or has expired
     */
    public static availableIn(ctx: GlobalContext, key: string): number {
        if (!ctx.session?.rateLimits?.[key]) {
            return 0;
        }

        const limit = ctx.session.rateLimits[key];
        const now = Date.now();
        return Math.max(0, Math.ceil((limit.resetAt - now) / 1000));
    }

    /**
     * Returns a human-readable time string for when the rate limit will reset
     * @param ctx Telegraf context
     * @param key Rate limit key
     * @returns Human-readable time string, or null if limit doesn't exist
     */
    public static availableInText(ctx: GlobalContext, key: string): string | null {
        const seconds = this.availableIn(ctx, key);
        if (seconds === 0) return null;

        if (seconds < 60) {
            return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        }

        const minutes = Math.ceil(seconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
} 