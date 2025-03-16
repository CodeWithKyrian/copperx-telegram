import { authService } from '../services/auth.service';
import { GlobalContext } from '../types/session.types';

export const logoutCommand = async (ctx: GlobalContext): Promise<void> => {
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
        await authService.logout(ctx);

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

export const logoutAction = async (ctx: GlobalContext): Promise<void> => {
    await ctx.answerCbQuery();
    await logoutCommand(ctx);
};