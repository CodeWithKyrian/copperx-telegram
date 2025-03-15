/**
 * List of commands that require authentication
 */
export const PROTECTED_COMMANDS = [
    // Authentication commands
    'logout',
    'me',

    // Wallet commands
    'wallet',
    'deposit',
    'send',
    'kyc',
    'withdraw',
    'history'
];

/**
 * Checks if a command requires authentication
 * @param command Command name without the leading slash
 * @returns Whether the command requires authentication
 */
export function isProtectedCommand(command: string): boolean {
    return PROTECTED_COMMANDS.includes(command);
} 