import transactionApi, { GetTransactionsParams } from '../api/transaction.api';
import { PaginatedResponse, TransactionWithAccount } from '../types/api.types';
import logger from '../utils/logger.utils';
import { formatDate } from '../utils/formatters.utils';
import { formatNetworkName } from '../utils/chain.utils';

/**
 * Service for handling transaction operations
 */
export class TransactionService {
    /**
     * Retrieves user's transaction history with pagination
     * @param params Pagination and filter parameters
     * @returns Paginated response of transactions or null if error occurs
     */
    public async getTransactions(params: GetTransactionsParams = {}): Promise<PaginatedResponse<TransactionWithAccount> | null> {
        try {
            // Default to page 1 with 10 items per page if not specified
            const queryParams: GetTransactionsParams = {
                page: 1,
                limit: 10,
                ...params
            };

            const response = await transactionApi.getTransactions(queryParams);
            return response;
        } catch (error) {
            logger.error({ error, params }, 'Failed to retrieve transactions');
            return null;
        }
    }

    /**
     * Retrieves a specific transaction by ID
     * @param transactionId Transaction ID
     * @returns Transaction object or null if error occurs
     */
    public async getTransaction(transactionId: string): Promise<TransactionWithAccount | null> {
        try {
            const transaction = await transactionApi.getTransaction(transactionId);
            return transaction;
        } catch (error) {
            logger.error({ error, transactionId }, 'Failed to retrieve transaction');
            return null;
        }
    }

    /**
     * Formats a transaction for display in a message
     * @param transaction Transaction data
     * @returns Formatted transaction message
     */
    public formatTransaction(transaction: TransactionWithAccount): string {
        // Create type emoji based on transaction type
        const typeEmoji = this.getTransactionTypeEmoji(transaction.type);

        // Format status with emoji
        const statusEmoji = this.getTransactionStatusEmoji(transaction.status);

        // Format amount
        const amount = transaction.fromAmount || transaction.toAmount || '0';
        const currency = transaction.fromCurrency || transaction.toCurrency;
        const formattedAmount = `${amount} ${currency}`;

        // Format fee if available
        const feeText = transaction.totalFee
            ? `Fee: ${transaction.totalFee} ${transaction.feeCurrency || currency}`
            : 'No fee';

        // Format date
        const date = formatDate(transaction.createdAt);

        // Format network and addresses
        let fromInfo = 'Unknown source';
        let toInfo = 'Unknown destination';

        if (transaction.fromAccount) {
            const network = transaction.fromAccount.network
                ? formatNetworkName(transaction.fromAccount.network)
                : 'Unknown network';

            if (transaction.fromAccount.walletAddress) {
                fromInfo = `${network}: ${this.formatAddress(transaction.fromAccount.walletAddress)}`;
            } else if (transaction.fromAccount.payeeEmail) {
                fromInfo = `Email: ${transaction.fromAccount.payeeEmail}`;
            } else if (transaction.fromAccount.bankName) {
                fromInfo = `Bank: ${transaction.fromAccount.bankName}`;
            }
        }

        if (transaction.toAccount) {
            const network = transaction.toAccount.network
                ? formatNetworkName(transaction.toAccount.network)
                : 'Unknown network';

            if (transaction.toAccount.walletAddress) {
                toInfo = `${network}: ${this.formatAddress(transaction.toAccount.walletAddress)}`;
            } else if (transaction.toAccount.payeeEmail) {
                toInfo = `Email: ${transaction.toAccount.payeeEmail}`;
            } else if (transaction.toAccount.bankName) {
                toInfo = `Bank: ${transaction.toAccount.bankName}`;
            }
        }

        // Combine all information
        return [
            `${typeEmoji} *Transaction: ${this.formatTransactionType(transaction.type)}*`,
            `ID: \`${transaction.id}\``,
            `Status: ${statusEmoji} ${this.formatTransactionStatus(transaction.status)}`,
            `Amount: ${formattedAmount}`,
            feeText,
            `Date: ${date}`,
            `From: ${fromInfo}`,
            `To: ${toInfo}`,
            transaction.transactionHash ? `Hash: \`${this.formatAddress(transaction.transactionHash)}\`` : ''
        ].filter(Boolean).join('\n');
    }

    /**
     * Creates a summary message for a list of transactions
     * @param transactions List of transactions
     * @returns Formatted summary message
     */
    public formatTransactionsList(transactions: TransactionWithAccount[]): string {
        if (transactions.length === 0) {
            return 'No transactions found.';
        }

        return transactions.map((tx, index) => {
            const typeEmoji = this.getTransactionTypeEmoji(tx.type);
            const statusEmoji = this.getTransactionStatusEmoji(tx.status);
            const amount = tx.fromAmount || tx.toAmount || '0';
            const currency = tx.fromCurrency || tx.toCurrency;
            const date = formatDate(tx.createdAt);

            return [
                `${index + 1}. ${typeEmoji} ${this.formatTransactionType(tx.type)} (${date})`,
                `   ${statusEmoji} ${amount} ${currency}`,
                `   ID: \`${tx.id}\``
            ].join('\n');
        }).join('\n\n');
    }

    /**
     * Gets an emoji for a transaction type
     */
    private getTransactionTypeEmoji(type: string): string {
        switch (type) {
            case 'send': return '📤';
            case 'receive': return '📥';
            case 'withdraw': return '💸';
            case 'deposit': return '💰';
            case 'bridge': return '🌉';
            case 'bank_deposit': return '🏦';
            default: return '🔄';
        }
    }

    /**
     * Gets an emoji for a transaction status
     */
    private getTransactionStatusEmoji(status: string): string {
        switch (status) {
            case 'pending': return '⏳';
            case 'initiated': return '🔄';
            case 'processing': return '⚙️';
            case 'success': return '✅';
            case 'canceled': return '❌';
            case 'failed': return '⛔';
            case 'refunded': return '↩️';
            default: return '❓';
        }
    }

    /**
     * Formats a transaction type for display
     */
    private formatTransactionType(type: string): string {
        switch (type) {
            case 'send': return 'Sent';
            case 'receive': return 'Received';
            case 'withdraw': return 'Withdrawal';
            case 'deposit': return 'Deposit';
            case 'bridge': return 'Bridge';
            case 'bank_deposit': return 'Bank Deposit';
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    }

    /**
     * Formats a transaction status for display
     */
    private formatTransactionStatus(status: string): string {
        switch (status) {
            case 'initiated': return 'Initiated';
            case 'processing': return 'Processing';
            case 'success': return 'Completed';
            case 'canceled': return 'Canceled';
            case 'failed': return 'Failed';
            case 'refunded': return 'Refunded';
            case 'pending': return 'Pending';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    }

    /**
     * Formats an address (or hash) for display
     */
    private formatAddress(address: string): string {
        if (!address) return '';
        if (address.length <= 16) return address;

        const start = address.substring(0, 8);
        const end = address.substring(address.length - 8);
        return `${start}...${end}`;
    }
}

// Create and export instance
export const transactionService = new TransactionService();
export default transactionService; 