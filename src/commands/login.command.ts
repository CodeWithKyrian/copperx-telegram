import { AUTH_SCENE_ID } from '../scenes/auth.scene';
import { authService } from '../services/auth.service';
import { GlobalContext } from '../types/session.types';

const handleLoginCommand = async (ctx: GlobalContext): Promise<void> => {
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

const handleLogoutCommand = async (ctx: GlobalContext): Promise<void> => {
    if (!authService.isAuthenticated(ctx)) {
        await ctx.reply(
            '❓ *Not Logged In*\n\n' +
            'You are not currently logged in.\n\n' +
            'Use /login to authenticate with your CopperX account.',
            { parse_mode: 'Markdown' }
        );
        return;
    }

    try {
        // Clear token on the API side
        await authService.logout();

        // Clear session auth data
        authService.clearSessionAuth(ctx);

        await ctx.reply(
            '👋 *Logged Out Successfully*\n\n' +
            'You have been logged out of your CopperX account.\n\n' +
            'Use /login to sign in again.',
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        await ctx.reply(
            '❌ *Logout Failed*\n\n' +
            'There was a problem logging you out. Please try again.',
            { parse_mode: 'Markdown' }
        );
    }
};

export const loginCommand = {
    name: 'login',
    description: 'Login to your CopperX account',
    handler: handleLoginCommand,
};

export const logoutCommand = {
    name: 'logout',
    description: 'Logout from your CopperX account',
    handler: handleLogoutCommand,
};