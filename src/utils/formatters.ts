import { Wallet, BalanceResponse, PurposeCode, BankAccountType, Country, TransferType, TransferStatus } from '../types/api.types';
import { formatNetworkName } from './chain.utils';



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
 * Formats a currency amount with proper decimal places
 * @param amount String representation of amount
 * @param decimals Number of decimals to display
 * @returns Formatted currency string
 */
export function formatCurrency(amount: string | undefined, decimals: number = 6): string {
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
 * Formats wallet balance information for display
 * @param balance Balance response from API
 * @returns Formatted balance string
 */
export function formatBalance(balance: BalanceResponse | undefined): string {
    if (!balance) return 'N/A';

    const amount = formatCurrency(balance.balance, balance.decimals);
    return `${amount} ${balance.symbol}`;
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
            day: 'numeric'
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