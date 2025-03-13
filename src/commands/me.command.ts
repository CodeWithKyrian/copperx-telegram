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

        // Helper function to format wallet addresses
        const formatAddress = (address?: string): string => {
            if (!address) return 'Not set';
            // Format as first 8 chars + ... + last 8 chars
            return address.length > 16 ?
                `${address.substring(0, 8)}...${address.substring(address.length - 8)}` :
                address;
        };

        // Helper function to capitalize first letter of each word
        const capitalize = (text?: string): string => {
            if (!text) return 'Not set';
            return text.split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        await ctx.reply(
            '👤 *YOUR COPPERX PROFILE*\n\n' +

            '📝 *Account Info*\n' +
            `• Name: ${profile.firstName || 'Not set'}\n` +
            `• Email: ${profile.email || 'Not set'}\n` +
            `• Status: ${profile.status === 'active' ? '✅ Active' :
                profile.status === 'pending' ? '⏳ Pending' : capitalize(profile.status)}\n` +
            `• Type: ${capitalize(profile.type)}\n\n` +

            '🏢 *Organization*\n' +
            `• Role: ${capitalize(profile.role)}\n` +
            `• Organization ID: ${profile.organizationId ?
                '`' + profile.organizationId + '`' : 'Not set'}\n\n` +

            '💼 *Wallet Details*\n' +
            `• Wallet ID: ${profile.walletId ? '`' + profile.walletId + '`' : 'Not set'}\n` +
            `• Type: ${capitalize(profile.walletAccountType)}\n` +
            `• Address: ${formatAddress(profile.walletAddress)}\n\n` +

            '🔄 *Relay Address*\n' +
            `• ${formatAddress(profile.relayerAddress)}\n\n` +

            '_Use /balance to check your wallet balance._',
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