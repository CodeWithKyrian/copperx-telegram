/**
 * List of commands that require authentication
 */
export const PROTECTED_COMMANDS = [
    'logout',
    'profile',
    'wallet',
    'deposit',
    'send',
    'kyc',
    'withdraw',
    'payees',
    'history'
];

/**
 * List of action callbacks that require authentication
 */
export const PROTECTED_ACTIONS = [
    // Wallet actions
    'view_wallets',
    'wallet_details',
    'set_default_wallet',
    'create_wallet',

    // Transfer actions
    'send_funds',
    'bulk_send',
    'withdraw_funds',
    'deposit_funds',
    'deposit_done',

    // History and transactions
    'history',
    'transaction_details',

    // KYC and profile
    'kyc_status',
    'profile',

    // Payee management
    'list_payees',
    'add_payee',
    'edit_payee',
    'delete_payee',
    'save_payee',

    // Logout
    'logout'
];

/**
 * Checks if a command requires authentication
 * @param command Command name without the leading slash
 * @returns Whether the command requires authentication
 */
export function isProtectedCommand(command: string): boolean {
    return PROTECTED_COMMANDS.includes(command);
}

/**
 * Checks if an action callback requires authentication
 * @param action Action callback data string
 * @returns Whether the action requires authentication
 */
export function isProtectedAction(action: string): boolean {
    // For actions that might have parameters (like 'deposit_funds:123'),
    // we need to check just the action prefix
    const actionPrefix = action.split(':')[0];
    return PROTECTED_ACTIONS.some(protectedAction =>
        actionPrefix === protectedAction || action === protectedAction
    );
} 