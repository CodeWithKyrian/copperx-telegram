// src/commands/me.command.ts
import { authService } from '../services/auth.service';
import { GlobalContext } from '../types';

/**
 * Handler for the /me command
 * @param ctx Telegraf context
 */
export const handleMeCommand = async (ctx: GlobalContext): Promise<void> => {
    try {
        const profile = await authService.getCurrentUser();


        await ctx.reply(
            '👤 *Your CopperX Profile*\n\n' +
            `*Name:* ${profile.firstName || 'Not set'}\n` +
            `*Email:* ${profile.email}\n` +
            `*User ID:* ${profile.id}\n` +
            `*Organization ID:* ${profile.organizationId || 'Not set'}\n` +
            `*Role:* ${profile.role}\n` +
            `*Status:* ${profile.status}\n` +
            `*Type:* ${profile.type}\n` +
            `*Relay Address:* ${profile.relayerAddress}\n` +
            `*Wallet Address:* ${profile.walletAddress}\n` +
            `*Wallet ID:* ${profile.walletId}\n` +
            `*Wallet Account Type:* ${profile.walletAccountType}\n` +
            'Use /balance to check your wallet balance.',
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        await ctx.reply(
            '❌ *Error Retrieving Profile*\n\n' +
            'There was a problem retrieving your profile. Please try again later.',
            { parse_mode: 'Markdown' }
        );
    }
};

export const meCommand = {
    name: 'me',
    description: 'View your CopperX profile',
    handler: handleMeCommand,
};