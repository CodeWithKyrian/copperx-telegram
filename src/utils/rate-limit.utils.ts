import { GlobalContext } from '../types';
import { RateLimiterService, RateLimitConfig } from '../services/rate-limiter.service';

/**
 * Decorates a function with rate limiting
 * @param fn Function to decorate
 * @param config Rate limit configuration
 * @returns Rate-limited function
 */
export function withRateLimit<T extends (ctx: GlobalContext, ...args: any[]) => Promise<any>>(
    fn: T,
    config: RateLimitConfig
): T {
    return (async (ctx: GlobalContext, ...args: any[]) => {
        // Skip rate limiting for non-user contexts
        if (!ctx.from?.id) {
            return fn(ctx, ...args);
        }

        const userKey = `${config.key}:${ctx.from.id}`;
        const limitConfig = { ...config, key: userKey };

        // Check if rate limited
        if (RateLimiterService.isLimited(ctx, limitConfig)) {
            const resetTime = RateLimiterService.availableInText(ctx, userKey) || 'soon';

            const message = config.message ||
                `⚠️ *Rate Limit Exceeded*\n\n` +
                `You've reached the maximum number of attempts. ` +
                `Please try again in ${resetTime}.`;

            await ctx.reply(message, { parse_mode: 'Markdown' });
            return;
        }

        RateLimiterService.increment(ctx, limitConfig);

        return fn(ctx, ...args);
    }) as T;
} 