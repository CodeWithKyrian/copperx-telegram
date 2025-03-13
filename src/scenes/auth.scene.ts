import { Scenes, Markup } from 'telegraf';
import { authService } from '../services/auth.service';
import { message } from 'telegraf/filters';
import logger from '../utils/logger';
import { GlobalContext } from '../types/session.types';
import { RateLimits } from '../middlewares/rate-limit.middleware';
import { RateLimiterService } from '../services/rate-limiter.service';

export const AUTH_SCENE_ID = 'auth';

interface AuthSceneSessionData extends Scenes.SceneSessionData {
    waitingForOtp?: boolean;
    email?: string;
    tempOtpSid?: string;
}

export interface AuthSceneContext extends GlobalContext {
    session: Scenes.SceneSession<AuthSceneSessionData>;
    scene: Scenes.SceneContextScene<AuthSceneContext, AuthSceneSessionData>;
}


const handleSceneEnter = async (ctx: AuthSceneContext) => {
    // Reset scene session data
    ctx.scene.session.waitingForOtp = false;
    ctx.scene.session.email = undefined;
    ctx.scene.session.tempOtpSid = undefined;

    await ctx.reply(
        '🔐 *Authentication Required*\n\n' +
        'To access CopperX features, please login with your CopperX account.\n\n' +
        'Please enter your email address:',
        { parse_mode: 'Markdown' }
    );
}

const handleEmailInput = async (ctx: AuthSceneContext, email: string) => {
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        await ctx.reply(
            '❌ *Invalid Email*\n\n' +
            'Please enter a valid email address:',
            { parse_mode: 'Markdown' }
        );
        return;
    }

    try {
        if (RateLimiterService.isLimited(ctx, RateLimits.AUTH)) {
            const resetTime = RateLimiterService.availableInText(ctx, `${RateLimits.AUTH.key}:${ctx.from?.id}`) || 'soon';

            await ctx.reply(
                '⚠️ *Rate Limit Exceeded*\n\n' +
                'You\'ve made too many login attempts. ' +
                `Please try again in ${resetTime}.`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        RateLimiterService.increment(ctx, {
            ...RateLimits.AUTH,
            key: `${RateLimits.AUTH.key}:${ctx.from?.id}`
        });

        await ctx.reply('Sending verification code...');

        await authService.initiateEmailAuth(ctx, email);

        await ctx.reply(
            '📧 *Verification Code Sent*\n\n' +
            `A verification code has been sent to ${email}.\n\n` +
            'Please enter the code:',
            { parse_mode: 'Markdown' }
        );
    } catch (error: any) {
        logger.error('Failed to initiate email authentication', {
            error: error.message,
            email
        });

        await ctx.reply(
            '❌ *Authentication Failed*\n\n' +
            'We could not send a verification code to this email. Please make sure you have a registered CopperX account and try again.\n\n' +
            'Use /cancel to exit the login process.',
            { parse_mode: 'Markdown' }
        );
    }
};

const handleOtpVerification = async (ctx: AuthSceneContext, otp: string) => {
    try {
        if (RateLimiterService.isLimited(ctx, RateLimits.OTP_VERIFY)) {
            const resetTime = RateLimiterService.availableInText(ctx, `${RateLimits.OTP_VERIFY.key}:${ctx.from?.id}`) || 'soon';

            await ctx.reply(
                '⚠️ *Rate Limit Exceeded*\n\n' +
                'You\'ve made too many OTP verification attempts. ' +
                `Please try again in ${resetTime}.`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        RateLimiterService.increment(ctx, {
            ...RateLimits.OTP_VERIFY,
            key: `${RateLimits.OTP_VERIFY.key}:${ctx.from?.id}`
        });

        await ctx.reply('Verifying OTP...');

        const user = await authService.verifyOtp(ctx, otp);

        await ctx.reply(
            '✅ *Authentication Successful!*\n\n' +
            `Welcome back, ${user.firstName || 'there'}!\n\n` +
            'You can now use all CopperX features.',
            {
                parse_mode: 'Markdown',
                ...Markup.removeKeyboard()
            }
        );

        // Exit scene
        await ctx.scene.leave();

        // Clear rate limits on successful authentication
        if (user) {
            RateLimiterService.clear(ctx, `${RateLimits.AUTH.key}:${ctx.from?.id}`);
            RateLimiterService.clear(ctx, `${RateLimits.OTP_VERIFY.key}:${ctx.from?.id}`);
        }
    } catch (error: any) {
        logger.error('OTP verification failed', { error: error.message });

        // Show error message and allow retry
        await ctx.reply(
            '❌ *Verification Failed*\n\n' +
            'The OTP you entered is invalid or has expired.\n\n' +
            'Please try again or use /cancel to abort the login process.',
            { parse_mode: 'Markdown' }
        );
    }
};

const handleSceneLeave = async (ctx: AuthSceneContext) => {
    logger.info('Exited authentication scene', { scene: ctx.scene.current?.id });
}

const handleCancelCommand = async (ctx: AuthSceneContext) => {
    await ctx.reply(
        '🚫 *Authentication Cancelled*\n\n' +
        'You can use /login to try again when you\'re ready.',
        {
            parse_mode: 'Markdown',
            ...Markup.removeKeyboard()
        }
    );
    await ctx.scene.leave();
}

/**
 * Creates and configures the authentication scene
 * @returns Configured authentication scene
 */
export const createAuthScene = (): Scenes.BaseScene<AuthSceneContext> => {
    const scene = new Scenes.BaseScene<AuthSceneContext>(AUTH_SCENE_ID);

    scene.enter(handleSceneEnter);

    scene.leave(handleSceneLeave);

    scene.command('cancel', handleCancelCommand);

    scene.on(message('text'), async (ctx) => {
        const text = ctx.message.text;

        if (ctx.scene.session.waitingForOtp) {
            await handleOtpVerification(ctx, text.trim());
        } else {
            await handleEmailInput(ctx, text.trim().toLowerCase());
        }
    });

    return scene;
};