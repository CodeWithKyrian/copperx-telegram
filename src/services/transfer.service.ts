import {
    CreateSendTransferRequest,
    CreateWalletWithdrawTransferRequest,
    Currency,
    PaginatedResponse,
    PurposeCode,
    TransferWithAccount,
    TransferWithTransactions,
    CreateOfframpTransferRequest,
    CreateSendTransferBatchRequest,
    CreateSendTransferBatchResponse,
} from '../types/api.types';
import transferApi from '../api/transfer.api';
import logger from '../utils/logger.utils';
import { formatDate, formatTransferType, formatTransferStatus, formatPurposeCode, formatRawAmount, toRawAmount, formatWalletAddress } from '../utils/formatters.utils';
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
            const rawAmount = toRawAmount(amount);

            const transferRequest: CreateSendTransferRequest = {
                email,
                amount: rawAmount,
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
            const rawAmount = toRawAmount(amount);

            const transferRequest: CreateSendTransferRequest = {
                walletAddress,
                amount: rawAmount,
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
     * Send funds to a saved payee
     */
    public async sendToPayee(
        payeeId: string,
        amount: string,
        purposeCode: PurposeCode,
        currency: Currency = 'USDC'
    ): Promise<TransferWithAccount | null> {
        try {
            const rawAmount = toRawAmount(amount);

            const transferRequest: CreateSendTransferRequest = {
                payeeId,
                amount: rawAmount,
                purposeCode,
                currency
            };

            const result = await transferApi.createSend(transferRequest);
            return result;
        } catch (error) {
            logger.error('Failed to send funds to payee', { error, payeeId, amount });
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
            const rawAmount = toRawAmount(amount);

            const withdrawRequest: CreateWalletWithdrawTransferRequest = {
                walletAddress,
                amount: rawAmount,
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
     * Withdraw funds to a bank account
     */
    public async withdrawToBank(quotePayload: string, quoteSignature: string, purposeCode: PurposeCode): Promise<TransferWithAccount | null> {
        try {
            const withdrawRequest: CreateOfframpTransferRequest = {
                quotePayload,
                quoteSignature,
                purposeCode
            };

            const result = await transferApi.createOfframpTransfer(withdrawRequest);
            return result;
        } catch (error) {
            logger.error('Failed to withdraw funds to bank account', { error });
            return null;
        }
    }

    /**
     * Sends a batch of transfers
     * @param batchRequest Request containing array of transfer requests
     * @returns Response with results for each transfer
     */
    public async sendBatch(batchRequest: CreateSendTransferBatchRequest): Promise<CreateSendTransferBatchResponse> {
        try {
            return await transferApi.createSendBatch(batchRequest);
        } catch (error) {
            logger.error('Error sending batch transfer', { error, requestCount: batchRequest.requests.length });
            throw error;
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
        const formattedAmount = formatRawAmount(transfer.amount, 8, 2) + ` ${transfer.currency}`;

        // Format fee if available
        const feeText = transfer.totalFee
            ? `Fee: ${formatRawAmount(transfer.totalFee, 8, 2)} ${transfer.feeCurrency || transfer.currency}`
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
                sourceInfo = `From: ${network ? `${network} - ` : ''}${formatWalletAddress(transfer.sourceAccount.walletAddress)}`;
            } else if (transfer.sourceAccount.payeeEmail) {
                sourceInfo = `From: ${transfer.sourceAccount.payeeEmail}`;
            }
        }

        if (transfer.destinationAccount) {
            const network = transfer.destinationAccount.network
                ? formatNetworkName(transfer.destinationAccount.network)
                : '';

            if (transfer.destinationAccount.walletAddress) {
                destinationInfo = `To: ${network ? `${network} - ` : ''}${formatWalletAddress(transfer.destinationAccount.walletAddress)}`;
            } else if (transfer.destinationAccount.payeeEmail) {
                destinationInfo = `To: ${transfer.destinationAccount.payeeEmail}`;
            } else if (transfer.destinationAccount.bankName) {
                destinationInfo = `To: ${transfer.destinationAccount.bankName} (${transfer.destinationAccount.bankAccountNumber || 'Account'})`;
            }
        }

        // Format purpose
        const purpose = transfer.purposeCode
            ? `Purpose: ${formatPurposeCode(transfer.purposeCode)}`
            : '';

        // Combine all information
        return [
            `${typeEmoji} *Transaction: ${formatTransferType(transfer.type)}*`,
            `ID: \`${transfer.id}\``,
            `Status: ${statusEmoji} ${formatTransferStatus(transfer.status)}`,
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
                    destination = `to wallet ${formatWalletAddress(transfer.destinationAccount.walletAddress)}`;
                } else if (transfer.destinationAccount.bankName) {
                    destination = `to bank account (${transfer.destinationAccount.bankName})`;
                }
            }

            return [
                `${index + 1}. ${typeEmoji} ${formatTransferType(transfer.type)} (${date})`,
                `   ${statusEmoji} ${formatRawAmount(transfer.amount, 8, 2)} ${transfer.currency} ${destination}`,
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
}

// Export default instance
export const transferService = new TransferService();
export default transferService;