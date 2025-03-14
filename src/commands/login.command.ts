import { AUTH_SCENE_ID } from '../scenes/auth.scene';
import { authService } from '../services/auth.service';
import { GlobalContext } from '../types/session.types';

export const loginCommand = async (ctx: GlobalContext): Promise<void> => {
    if (authService.isAuthenticated(ctx)) {
        try {
            const profile = await authService.getCurrentUser();

            authService.updateSessionUserProfile(ctx, profile);

            await ctx.reply(
                '✅ *Already Logged In*\n\n' +
                `You are already logged in as ${profile.email}.\n\n` +
                'Use /logout if you want to sign out.',
                { parse_mode: 'Markdown' }
            );
        } catch (error) {
            // If we can't get the user profile, the token might be invalid
            authService.clearSessionAuth(ctx);

            await ctx.reply(
                '⚠️ *Session Expired*\n\n' +
                'Your previous session has expired. Please login again.',
                { parse_mode: 'Markdown' }
            );

            // Redirect to login scene
            await ctx.scene.enter(AUTH_SCENE_ID);
        }
        return;
    }

    await ctx.scene.enter(AUTH_SCENE_ID);
};