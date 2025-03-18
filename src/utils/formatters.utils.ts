import { Wallet, BalanceResponse, PurposeCode, BankAccountType, Country, TransferType, TransferStatus, UserStatus } from '../types/api.types';
import { formatNetworkName } from './chain.utils';



/**
 * Capitalizes a string
 * @param text String to capitalize
 * @returns Capitalized string
 */
export function capitalize(text?: string): string {
    if (!text) return 'Not set';

    return text.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export function formatWalletBalance(balance: BalanceResponse): string {
    if (!balance) return '0.00 USDC';

    // Balance is already human-readable, just format for display
    const formattedAmount = formatHumanAmount(balance.balance, 2) + ` ${balance.symbol}`;

    return formattedAmount;
}

/**
 * Formats wallet address for display (truncates middle)
 * @param address Wallet address to format
 * @returns Formatted wallet address
 */
export function formatWalletAddress(address: string | undefined): string {
    if (!address) return '';
    if (address.length <= 16) return address;

    const start = address.substring(0, 8);
    const end = address.substring(address.length - 8);
    return `${start}...${end}`;
}

/**
 * Converts a human-readable amount to raw blockchain format
 * 
 * @param amount Human-readable amount (e.g., "1.5")
 * @param decimals Number of decimal places in raw format (default: 8 for USDC/USDT)
 * @returns Raw amount as string
 */
export function toRawAmount(amount: string | number, decimals: number = 8): string {
    if (!amount) return "0";

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const rawAmount = Math.round(numericAmount * Math.pow(10, decimals));

    return rawAmount.toString();
}

/**
 * Converts a raw blockchain amount to human-readable format
 * 
 * @param rawAmount Raw blockchain amount (e.g., "150000000")
 * @param decimals Number of decimal places in raw format (default: 8 for USDC/USDT)
 * @returns Human-readable amount as string
 */
export function fromRawAmount(rawAmount: string | number, decimals: number = 8): string {
    if (!rawAmount) return "0";

    const numeric = typeof rawAmount === 'string' ? parseInt(rawAmount) : rawAmount;
    const humanReadable = numeric / Math.pow(10, decimals);

    return humanReadable.toString();
}

/**
 * Formats a currency amount for display
 * Assumes the input is already in human-readable format
 * 
 * @param amount The human-readable amount to format
 * @param displayDecimals Number of decimal places to display (default: 2)
 * @returns Formatted amount string
 */
export function formatHumanAmount(amount: string | number, displayDecimals: number = 2): string {
    if (!amount) return "0.00";

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    return numericAmount.toLocaleString('en-US', {
        minimumFractionDigits: displayDecimals,
        maximumFractionDigits: displayDecimals
    });
}

/**
 * Formats a raw blockchain amount for display
 * Converts from raw to human-readable and then formats
 * 
 * @param rawAmount The raw blockchain amount
 * @param decimals Number of decimal places in raw format (default: 8)
 * @param displayDecimals Number of decimal places to display (default: 2)
 * @returns Formatted amount string
 */
export function formatRawAmount(rawAmount: string | number, decimals: number = 8, displayDecimals: number = 2): string {
    const humanReadable = fromRawAmount(rawAmount, decimals);
    return formatHumanAmount(humanReadable, displayDecimals);
}

/**
 * Formats a date string to a readable format
 * @param dateString Date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string | undefined): string {
    if (!dateString) return '';

    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        return dateString;
    }
}

/**
 * Generates a message showing wallet information
 * @param wallet Wallet object
 * @returns Formatted wallet info message
 */
export function formatWalletInfo(wallet: Wallet): string {
    const isDefault = wallet.isDefault ? '✓ Default' : '';
    const network = wallet.network ?
        `Network: ${formatNetworkName(wallet.network)}` : '';
    const address = wallet.walletAddress ?
        `Address: \`${formatWalletAddress(wallet.walletAddress)}\`` : '';

    return [
        `🔹 *Wallet ID*: \`${wallet.id}\` ${isDefault}`,
        network,
        `Type: ${wallet.walletType}`,
        address,
        `Created: ${formatDate(wallet.createdAt)}`
    ].filter(Boolean).join('\n');
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

// Format a purpose code for display
export function formatPurposeCode(code: PurposeCode): string {
    switch (code) {
        case 'self': return 'Personal Use';
        case 'salary': return 'Salary Payment';
        case 'gift': return 'Gift';
        case 'income': return 'Income';
        case 'saving': return 'Savings';
        case 'education_support': return 'Education Support';
        case 'family': return 'Family Support';
        case 'home_improvement': return 'Home Improvement';
        case 'reimbursement': return 'Reimbursement';
    }
}

/**
 * Format a bank account type for display
 */
export function formatBankAccountType(type: BankAccountType): string {
    switch (type) {
        case 'savings': return 'Savings';
        case 'checking': return 'Checking';
    }
}

/**
 * Format a country code for display
 */
export function formatCountry(countryCode: Country): string {
    const countryNames: { [key: string]: string } = {
        'usa': 'United States',
        'ind': 'India',
        'are': 'United Arab Emirates',
        'idn': 'Indonesia',
        'pak': 'Pakistan',
        'sgp': 'Singapore',
        'esp': 'Spain',
        'can': 'Canada',
        'gbr': 'United Kingdom',
        'aus': 'Australia',
    };

    return countryNames[countryCode] || countryCode.toUpperCase();
}

/**
     * Formats a transfer type for display
 */
export function formatTransferType(type: TransferType): string {
    switch (type) {
        case 'send': return 'Send';
        case 'receive': return 'Receive';
        case 'withdraw': return 'Withdrawal';
        case 'deposit': return 'Deposit';
        case 'bridge': return 'Bridge';
        case 'bank_deposit': return 'Bank Deposit';
    }
}

/**
 * Formats a transfer status for display
 */
export function formatTransferStatus(status: TransferStatus): string {
    switch (status) {
        case 'initiated': return 'Initiated';
        case 'processing': return 'Processing';
        case 'success': return 'Completed';
        case 'canceled': return 'Canceled';
        case 'failed': return 'Failed';
        case 'refunded': return 'Refunded';
        case 'pending': return 'Pending';
    }
}

/**
 * Formats a user status for display
 */
export function formatUserStatus(status: UserStatus): string {
    const message: Record<UserStatus, string> = {
        'pending': '⏳ Pending',
        'active': '✅ Active',
        'suspended': '❌ Suspended',
    }

    return message[status] || 'Unknown status';
};