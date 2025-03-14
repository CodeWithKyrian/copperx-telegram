import { BalanceResponse, Wallet } from "../types";

/**
 * Formats a currency amount with proper decimal places
 * @param amount String representation of amount
 * @param decimals Number of decimals to display
 * @returns Formatted currency string
 */
export function formatCurrency(amount: string, decimals: number = 6): string {
    if (!amount) return '0.00';

    // Convert string to number, ensuring it's properly parsed
    const numValue = parseFloat(amount);
    if (isNaN(numValue)) return '0.00';

    // Format with proper decimal places
    return numValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: decimals
    });
}

/**
 * Formats a date string to a readable format
 * @param dateString Date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

/**
 * Truncates text to specified length with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 30): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats wallet address for display (truncates middle)
 * @param address Wallet address to format
 * @returns Formatted wallet address
 */
export function formatWalletAddress(address: string): string {
    if (!address) return '';
    if (address.length <= 16) return address;

    const start = address.substring(0, 8);
    const end = address.substring(address.length - 8);
    return `${start}...${end}`;
}


/**
 * Formats wallet balance information for display
 * @param balance Balance response from API
 * @returns Formatted balance string
*/
export function formatBalance(balance: BalanceResponse): string {
    if (!balance) return 'N/A';

    const amount = formatCurrency(balance.balance, balance.decimals);
    return `${amount} ${balance.symbol}`;
}

/**
  * Generates a message showing wallet information
  * @param wallet Wallet object
  * @returns Formatted wallet info message
  */
export function formatWalletInfo(wallet: Wallet): string {
    const isDefault = wallet.isDefault ? '✓ Default' : '';
    const network = wallet.network ? `Network: ${wallet.network}` : '';
    const address = wallet.walletAddress ?
        `Address: \`${formatWalletAddress(wallet.walletAddress)}\`` : '';

    return [
        `🔹 *Wallet ID*: \`${wallet.id}\` ${isDefault}`,
        network,
        `Type: ${wallet.walletType}`,
        address,
        `Created: ${new Date(wallet.createdAt || '').toLocaleDateString()}`
    ].filter(Boolean).join('\n');
}