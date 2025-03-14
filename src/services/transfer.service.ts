import {
    CreateSendTransferRequest,
    CreateWalletWithdrawTransferRequest,
    Currency,
    PaginatedResponse,
    PurposeCode,
    TransferWithAccount,
    TransferWithTransactions
} from '../types/api.types';
import transferApi from '../api/transfer.api';
import logger from '../utils/logger';
import { formatDate, formatCurrency } from '../utils/formatters';
import { formatNetworkName } from '../utils/chain.utils';

/**
 * Service for managing transfer operations
 */
export class TransferService {
    /**
     * Send funds to an email address
     */
    public async sendToEmail(
        email: string,
        amount: string,
        purposeCode: PurposeCode,
        currency: Currency = 'USDC'
    ): Promise<TransferWithAccount | null> {
        try {
            const transferRequest: CreateSendTransferRequest = {
                email,
                amount,
                purposeCode,
                currency
            };

            const result = await transferApi.createSend(transferRequest);
            return result;
        } catch (error) {
            logger.error('Failed to send funds to email', { error, email, amount });
            return null;
        }
    }

    /**
     * Send funds to an external wallet address
     */
    public async sendToWallet(
        walletAddress: string,
        amount: string,
        purposeCode: PurposeCode,
        currency: Currency = 'USDC'
    ): Promise<TransferWithAccount | null> {
        try {
            const transferRequest: CreateSendTransferRequest = {
                walletAddress,
                amount,
                purposeCode,
                currency
            };

            const result = await transferApi.createSend(transferRequest);
            return result;
        } catch (error) {
            logger.error('Failed to send funds to wallet', { error, walletAddress, amount });
            return null;
        }
    }

    /**
     * Withdraw funds to an external wallet address
     */
    public async withdrawToWallet(
        walletAddress: string,
        amount: string,
        purposeCode: PurposeCode,
        currency: Currency = 'USDC'
    ): Promise<TransferWithAccount | null> {
        try {
            const withdrawRequest: CreateWalletWithdrawTransferRequest = {
                walletAddress,
                amount,
                purposeCode,
                currency
            };

            const result = await transferApi.createWalletWithdraw(withdrawRequest);
            return result;
        } catch (error) {
            logger.error('Failed to withdraw funds to wallet', { error, walletAddress, amount });
            return null;
        }
    }

    /**
     * Get transfer history with pagination
     */
    public async getTransferHistory(page = 1, limit = 10): Promise<PaginatedResponse<TransferWithAccount> | null> {
        try {
            const result = await transferApi.getTransfers({
                page,
                limit
            });
            return result as unknown as PaginatedResponse<TransferWithAccount>;
        } catch (error) {
            logger.error('Failed to retrieve transfer history', { error, page, limit });
            return null;
        }
    }

    /**
     * Get details of a specific transfer
     */
    public async getTransferDetails(transferId: string): Promise<TransferWithTransactions | null> {
        try {
            const result = await transferApi.getTransfer(transferId);
            return result;
        } catch (error) {
            logger.error('Failed to retrieve transfer details', { error, transferId });
            return null;
        }
    }

    /**
     * Format a transfer for display in a message
     * @param transfer Transfer data
     * @returns Formatted transfer message
     */
    public formatTransfer(transfer: TransferWithAccount): string {
        // Create type emoji based on transfer type
        const typeEmoji = this.getTransferTypeEmoji(transfer.type);

        // Format status with emoji
        const statusEmoji = this.getTransferStatusEmoji(transfer.status);

        // Format amount and currency
        const formattedAmount = `${formatCurrency(transfer.amount)} ${transfer.currency}`;

        // Format fee if available
        const feeText = transfer.totalFee
            ? `Fee: ${formatCurrency(transfer.totalFee)} ${transfer.feeCurrency || transfer.currency}`
            : 'No fee';

        // Format date
        const date = formatDate(transfer.createdAt);

        // Format source and destination
        let sourceInfo = 'From your wallet';
        let destinationInfo = 'Unknown destination';

        if (transfer.sourceAccount) {
            const network = transfer.sourceAccount.network
                ? formatNetworkName(transfer.sourceAccount.network)
                : '';

            if (transfer.sourceAccount.walletAddress) {
                sourceInfo = `From: ${network ? `${network} - ` : ''}${this.formatAddress(transfer.sourceAccount.walletAddress)}`;
            } else if (transfer.sourceAccount.payeeEmail) {
                sourceInfo = `From: ${transfer.sourceAccount.payeeEmail}`;
            }
        }

        if (transfer.destinationAccount) {
            const network = transfer.destinationAccount.network
                ? formatNetworkName(transfer.destinationAccount.network)
                : '';

            if (transfer.destinationAccount.walletAddress) {
                destinationInfo = `To: ${network ? `${network} - ` : ''}${this.formatAddress(transfer.destinationAccount.walletAddress)}`;
            } else if (transfer.destinationAccount.payeeEmail) {
                destinationInfo = `To: ${transfer.destinationAccount.payeeEmail}`;
            } else if (transfer.destinationAccount.bankName) {
                destinationInfo = `To: ${transfer.destinationAccount.bankName} (${transfer.destinationAccount.bankAccountNumber || 'Account'})`;
            }
        }

        // Format purpose
        const purpose = transfer.purposeCode
            ? `Purpose: ${this.formatPurposeCode(transfer.purposeCode)}`
            : '';

        // Combine all information
        return [
            `${typeEmoji} *Transfer: ${this.formatTransferType(transfer.type)}*`,
            `ID: \`${transfer.id}\``,
            `Status: ${statusEmoji} ${this.formatTransferStatus(transfer.status)}`,
            `Amount: ${formattedAmount}`,
            feeText,
            `Date: ${date}`,
            sourceInfo,
            destinationInfo,
            purpose
        ].filter(Boolean).join('\n');
    }

    /**
     * Format a list of transfers for display
     * @param transfers List of transfers
     * @returns Formatted transfer list message
     */
    public formatTransferList(transfers: TransferWithAccount[]): string {
        if (transfers.length === 0) {
            return 'No transfers found.';
        }

        return transfers.map((transfer, index) => {
            const typeEmoji = this.getTransferTypeEmoji(transfer.type);
            const statusEmoji = this.getTransferStatusEmoji(transfer.status);
            const date = formatDate(transfer.createdAt);

            let destination = '';
            if (transfer.destinationAccount) {
                if (transfer.destinationAccount.payeeEmail) {
                    destination = `to ${transfer.destinationAccount.payeeEmail}`;
                } else if (transfer.destinationAccount.walletAddress) {
                    destination = `to wallet ${this.formatAddress(transfer.destinationAccount.walletAddress)}`;
                } else if (transfer.destinationAccount.bankName) {
                    destination = `to bank account (${transfer.destinationAccount.bankName})`;
                }
            }

            return [
                `${index + 1}. ${typeEmoji} ${this.formatTransferType(transfer.type)} (${date})`,
                `   ${statusEmoji} ${formatCurrency(transfer.amount)} ${transfer.currency} ${destination}`,
                `   ID: \`${transfer.id}\``
            ].join('\n');
        }).join('\n\n');
    }

    /**
     * Gets an emoji for a transfer type
     */
    private getTransferTypeEmoji(type: string): string {
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
     * Gets an emoji for a transfer status
     */
    private getTransferStatusEmoji(status: string): string {
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
     * Formats a transfer type for display
     */
    private formatTransferType(type: string): string {
        switch (type) {
            case 'send': return 'Send';
            case 'receive': return 'Receive';
            case 'withdraw': return 'Withdrawal';
            case 'deposit': return 'Deposit';
            case 'bridge': return 'Bridge';
            case 'bank_deposit': return 'Bank Deposit';
            default: return type.charAt(0).toUpperCase() + type.slice(1);
        }
    }

    /**
     * Formats a transfer status for display
     */
    private formatTransferStatus(status: string): string {
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
     * Formats a purpose code for display
     */
    private formatPurposeCode(purpose: string): string {
        switch (purpose) {
            case 'self': return 'Personal Use';
            case 'salary': return 'Salary Payment';
            case 'gift': return 'Gift';
            case 'income': return 'Income';
            case 'saving': return 'Savings';
            case 'education_support': return 'Education Support';
            case 'family': return 'Family Support';
            case 'home_improvement': return 'Home Improvement';
            case 'reimbursement': return 'Reimbursement';
            default: return purpose.split('_').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        }
    }

    /**
     * Formats an address for display
     */
    private formatAddress(address: string): string {
        if (!address) return '';
        if (address.length <= 16) return address;

        const start = address.substring(0, 8);
        const end = address.substring(address.length - 8);
        return `${start}...${end}`;
    }
}

// Export default instance
export const transferService = new TransferService();
export default transferService;