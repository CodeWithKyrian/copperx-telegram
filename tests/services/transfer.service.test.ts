import { transferService } from '../../src/services/transfer.service';
import transferApi from '../../src/api/transfer.api';
import logger from '../../src/utils/logger.utils';
import {
    formatDate,
    formatTransferType,
    formatTransferStatus,
    formatPurposeCode,
    formatRawAmount,
    toRawAmount,
    formatWalletAddress
} from '../../src/utils/formatters.utils';
import { formatNetworkName } from '../../src/utils/chain.utils';
import {
    mockTransfer,
    mockBankTransfer,
    mockWalletWithdraw,
    mockPendingTransfer,
    mockFailedTransfer,
    mockTransferList,
    mockPaginatedResponse,
    mockTransferWithTransactions,
    mockBatchTransferRequest,
    mockBatchTransferResponse,
    mockBatchTransferWithErrorResponse
} from '../__mocks__/transfer.mock';
import { PurposeCode, Currency } from '../../src/types/api.types';

// Mock dependencies
jest.mock('../../src/api/transfer.api');
jest.mock('../../src/utils/logger.utils');
jest.mock('../../src/utils/formatters.utils');
jest.mock('../../src/utils/chain.utils');

describe('Transfer Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mocks for formatters
        (toRawAmount as jest.Mock).mockImplementation((amount) => {
            return amount === '10' ? '1000000000' :
                amount === '5' ? '500000000' :
                    '100000000'; // Default to 1 unit
        });

        (formatRawAmount as jest.Mock).mockImplementation((amount) => {
            return amount === '1000000000' ? '10' :
                amount === '500000000' ? '5' :
                    amount === '50000000' ? '0.5' :
                        '1'; // Default
        });

        (formatDate as jest.Mock).mockReturnValue('Mar 20, 2024');
        (formatTransferType as jest.Mock).mockImplementation((type) => type.charAt(0).toUpperCase() + type.slice(1));
        (formatTransferStatus as jest.Mock).mockImplementation((status) => status.charAt(0).toUpperCase() + status.slice(1));
        (formatPurposeCode as jest.Mock).mockImplementation((code) => code.charAt(0).toUpperCase() + code.slice(1));
        (formatWalletAddress as jest.Mock).mockImplementation((address) => address.substring(0, 8) + '...');
        (formatNetworkName as jest.Mock).mockImplementation((network) => network.charAt(0).toUpperCase() + network.slice(1));
    });

    describe('sendToEmail', () => {
        it('should send funds to an email address successfully', async () => {
            // Arrange
            const email = 'recipient@example.com';
            const amount = '10';
            const purposeCode = 'family' as PurposeCode;
            const currency = 'USDC' as Currency;

            (transferApi.createSend as jest.Mock).mockResolvedValue(mockTransfer);

            // Act
            const result = await transferService.sendToEmail(email, amount, purposeCode, currency);

            // Assert
            expect(transferApi.createSend).toHaveBeenCalledWith({
                email,
                amount: '10',
                purposeCode,
                currency
            });

            expect(result).toEqual(mockTransfer);
        });

        it('should use USDC as default currency', async () => {
            // Arrange
            const email = 'recipient@example.com';
            const amount = '10';
            const purposeCode = 'family' as PurposeCode;

            (transferApi.createSend as jest.Mock).mockResolvedValue(mockTransfer);

            // Act
            const result = await transferService.sendToEmail(email, amount, purposeCode);

            // Assert
            expect(transferApi.createSend).toHaveBeenCalledWith({
                email,
                amount: '10',
                purposeCode,
                currency: 'USDC'
            });

            expect(result).toEqual(mockTransfer);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const email = 'recipient@example.com';
            const amount = '10';
            const purposeCode = 'family' as PurposeCode;
            const mockError = new Error('API error');

            (transferApi.createSend as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await transferService.sendToEmail(email, amount, purposeCode);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    email,
                    amount
                }),
                'Failed to send funds to email'
            );
        });
    });

    describe('sendToWallet', () => {
        it('should send funds to a wallet address successfully', async () => {
            // Arrange
            const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
            const amount = '10';
            const purposeCode = 'family' as PurposeCode;
            const currency = 'USDC' as Currency;

            (transferApi.createSend as jest.Mock).mockResolvedValue(mockTransfer);

            // Act
            const result = await transferService.sendToWallet(walletAddress, amount, purposeCode, currency);

            // Assert
            expect(transferApi.createSend).toHaveBeenCalledWith({
                walletAddress,
                amount,
                purposeCode,
                currency
            });

            expect(result).toEqual(mockTransfer);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const walletAddress = '0x1234567890abcdef1234567890abcdef12345678';
            const amount = '10';
            const purposeCode = 'family' as PurposeCode;
            const mockError = new Error('API error');

            (transferApi.createSend as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await transferService.sendToWallet(walletAddress, amount, purposeCode);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    walletAddress,
                    amount
                }),
                'Failed to send funds to wallet'
            );
        });
    });

    describe('sendToPayee', () => {
        it('should send funds to a saved payee successfully', async () => {
            // Arrange
            const payeeId = 'payee-123';
            const amount = '10';
            const purposeCode = 'family' as PurposeCode;
            const currency = 'USDC' as Currency;

            (transferApi.createSend as jest.Mock).mockResolvedValue(mockTransfer);

            // Act
            const result = await transferService.sendToPayee(payeeId, amount, purposeCode, currency);

            // Assert
            expect(transferApi.createSend).toHaveBeenCalledWith({
                payeeId,
                amount,
                purposeCode,
                currency
            });

            expect(result).toEqual(mockTransfer);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const payeeId = 'payee-123';
            const amount = '10';
            const purposeCode = 'family' as PurposeCode;
            const mockError = new Error('API error');

            (transferApi.createSend as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await transferService.sendToPayee(payeeId, amount, purposeCode);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    payeeId,
                    amount
                }),
                'Failed to send funds to payee'
            );
        });
    });

    describe('withdrawToWallet', () => {
        it('should withdraw funds to a wallet address successfully', async () => {
            // Arrange
            const walletAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
            const amount = '10';
            const purposeCode = 'family' as PurposeCode;
            const currency = 'USDC' as Currency;

            (transferApi.createWalletWithdraw as jest.Mock).mockResolvedValue(mockWalletWithdraw);

            // Act
            const result = await transferService.withdrawToWallet(walletAddress, amount, purposeCode, currency);

            // Assert
            expect(transferApi.createWalletWithdraw).toHaveBeenCalledWith({
                walletAddress,
                amount,
                purposeCode,
                currency
            });

            expect(result).toEqual(mockWalletWithdraw);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const walletAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
            const amount = '10';
            const purposeCode = 'family' as PurposeCode;
            const mockError = new Error('API error');

            (transferApi.createWalletWithdraw as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await transferService.withdrawToWallet(walletAddress, amount, purposeCode);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    walletAddress,
                    amount
                }),
                'Failed to withdraw funds to wallet'
            );
        });
    });

    describe('withdrawToBank', () => {
        it('should withdraw funds to a bank account successfully', async () => {
            // Arrange
            const quotePayload = 'encrypted-quote-data';
            const quoteSignature = 'valid-signature';
            const purposeCode = 'family' as PurposeCode;

            (transferApi.createOfframpTransfer as jest.Mock).mockResolvedValue(mockBankTransfer);

            // Act
            const result = await transferService.withdrawToBank(quotePayload, quoteSignature, purposeCode);

            // Assert
            expect(transferApi.createOfframpTransfer).toHaveBeenCalledWith({
                quotePayload,
                quoteSignature,
                purposeCode
            });

            expect(result).toEqual(mockBankTransfer);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const quotePayload = 'encrypted-quote-data';
            const quoteSignature = 'valid-signature';
            const purposeCode = 'family' as PurposeCode;
            const mockError = new Error('API error');

            (transferApi.createOfframpTransfer as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await transferService.withdrawToBank(quotePayload, quoteSignature, purposeCode);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError
                }),
                'Failed to withdraw funds to bank account'
            );
        });
    });

    describe('sendBatch', () => {
        it('should send batch transfers successfully', async () => {
            // Arrange
            (transferApi.createSendBatch as jest.Mock).mockResolvedValue(mockBatchTransferResponse);

            // Act
            const result = await transferService.sendBatch(mockBatchTransferRequest);

            // Assert
            expect(transferApi.createSendBatch).toHaveBeenCalledWith(mockBatchTransferRequest);
            expect(result).toEqual(mockBatchTransferResponse);
        });

        it('should handle and throw API errors', async () => {
            // Arrange
            const mockError = new Error('API error');
            (transferApi.createSendBatch as jest.Mock).mockRejectedValue(mockError);

            // Act & Assert
            await expect(transferService.sendBatch(mockBatchTransferRequest))
                .rejects.toThrow(mockError);

            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    requestCount: mockBatchTransferRequest.requests.length
                }),
                'Error sending batch transfer'
            );
        });

        it('should handle partial success in batch transfers', async () => {
            // Arrange
            (transferApi.createSendBatch as jest.Mock).mockResolvedValue(mockBatchTransferWithErrorResponse);

            // Act
            const result = await transferService.sendBatch(mockBatchTransferRequest);

            // Assert
            expect(result).toEqual(mockBatchTransferWithErrorResponse);
            expect(result.responses[0].error).toBeUndefined();
            expect(result.responses[1].error).toBeDefined();
        });
    });

    describe('getTransferHistory', () => {
        it('should retrieve transfer history with default pagination', async () => {
            // Arrange
            (transferApi.getTransfers as jest.Mock).mockResolvedValue(mockPaginatedResponse);

            // Act
            const result = await transferService.getTransferHistory();

            // Assert
            expect(transferApi.getTransfers).toHaveBeenCalledWith({
                page: 1,
                limit: 10
            });

            expect(result).toEqual(mockPaginatedResponse);
        });

        it('should retrieve transfer history with custom pagination', async () => {
            // Arrange
            (transferApi.getTransfers as jest.Mock).mockResolvedValue(mockPaginatedResponse);

            // Act
            const result = await transferService.getTransferHistory(2, 20);

            // Assert
            expect(transferApi.getTransfers).toHaveBeenCalledWith({
                page: 2,
                limit: 20
            });

            expect(result).toEqual(mockPaginatedResponse);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('API error');
            (transferApi.getTransfers as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await transferService.getTransferHistory(1, 10);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    page: 1,
                    limit: 10
                }),
                'Failed to retrieve transfer history'
            );
        });
    });

    describe('getTransferDetails', () => {
        it('should retrieve detailed transfer information', async () => {
            // Arrange
            const transferId = 'transfer-123';
            (transferApi.getTransfer as jest.Mock).mockResolvedValue(mockTransferWithTransactions);

            // Act
            const result = await transferService.getTransferDetails(transferId);

            // Assert
            expect(transferApi.getTransfer).toHaveBeenCalledWith(transferId);
            expect(result).toEqual(mockTransferWithTransactions);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const transferId = 'transfer-123';
            const mockError = new Error('API error');
            (transferApi.getTransfer as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await transferService.getTransferDetails(transferId);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    transferId
                }),
                'Failed to retrieve transfer details'
            );
        });
    });

    describe('formatTransfer', () => {
        it('should format a standard transfer with all information', () => {
            // Act
            const result = transferService.formatTransfer(mockTransfer);

            // Assert
            expect(result).toContain('📤 *Transaction: Send*');
            expect(result).toContain(`ID: \`${mockTransfer.id}\``);
            expect(result).toContain('Status: ✅ Success');
            expect(result).toContain('Amount: 10 USDC');
            expect(result).toContain('Fee: 0.5 USDC');
            expect(result).toContain('Date: Mar 20, 2024');
            expect(result).toContain('From: Polygon - 0x123456...');
            expect(result).toContain('To: recipient@example.com');
            expect(result).toContain('Purpose: Family');
        });

        it('should format a bank transfer correctly', () => {
            // Act
            const result = transferService.formatTransfer(mockBankTransfer);

            // Assert
            expect(result).toContain('💸 *Transaction: Withdraw*');
            expect(result).toContain('To: Test Bank (XXXX1234)');
        });

        it('should format a wallet withdraw correctly', () => {
            // Act
            const result = transferService.formatTransfer(mockWalletWithdraw);

            // Assert
            expect(result).toContain('💸 *Transaction: Withdraw*');
            expect(result).toContain('To: Ethereum - 0xabcdef...');
        });

        it('should handle missing fee information', () => {
            // Act
            const result = transferService.formatTransfer(mockPendingTransfer);

            // Assert
            expect(result).toContain('No fee');
            expect(result).toContain('Status: ⏳ Pending');
        });

        it('should handle failed transfers', () => {
            // Act
            const result = transferService.formatTransfer(mockFailedTransfer);

            // Assert
            expect(result).toContain('Status: ⛔ Failed');
        });
    });

    describe('formatTransferList', () => {
        it('should format a list of transfers correctly', () => {
            // Act
            const result = transferService.formatTransferList(mockTransferList);

            // Assert
            expect(result).toContain('1. 📤 Send (Mar 20, 2024)');
            expect(result).toContain('2. 💸 Withdraw (Mar 20, 2024)');
            expect(result).toContain('3. 💸 Withdraw (Mar 20, 2024)');
            expect(result).toContain('4. 📤 Send (Mar 20, 2024)');
            expect(result).toContain('5. 📤 Send (Mar 20, 2024)');

            expect(result).toContain('   ✅ 10 USDC to recipient@example.com');
            expect(result).toContain('   ✅ 10 USDC to bank account (Test Bank)');
            expect(result).toContain('   ✅ 10 USDC to wallet 0xabcdef...');
            expect(result).toContain('   ⏳ 10 USDC to recipient@example.com');
            expect(result).toContain('   ⛔ 10 USDC to recipient@example.com');
        });

        it('should handle empty transfer list', () => {
            // Act
            const result = transferService.formatTransferList([]);

            // Assert
            expect(result).toBe('No transfers found.');
        });
    });

    describe('getTransferTypeEmoji', () => {
        it('should return correct emoji for send transfers', () => {
            // Act
            const result = (transferService as any).getTransferTypeEmoji('send');

            // Assert
            expect(result).toBe('📤');
        });

        it('should return correct emoji for receive transfers', () => {
            // Act
            const result = (transferService as any).getTransferTypeEmoji('receive');

            // Assert
            expect(result).toBe('📥');
        });

        it('should return correct emoji for withdraw transfers', () => {
            // Act
            const result = (transferService as any).getTransferTypeEmoji('withdraw');

            // Assert
            expect(result).toBe('💸');
        });

        it('should return correct emoji for deposit transfers', () => {
            // Act
            const result = (transferService as any).getTransferTypeEmoji('deposit');

            // Assert
            expect(result).toBe('💰');
        });

        it('should return correct emoji for bridge transfers', () => {
            // Act
            const result = (transferService as any).getTransferTypeEmoji('bridge');

            // Assert
            expect(result).toBe('🌉');
        });

        it('should return correct emoji for bank_deposit transfers', () => {
            // Act
            const result = (transferService as any).getTransferTypeEmoji('bank_deposit');

            // Assert
            expect(result).toBe('🏦');
        });

        it('should return default emoji for unknown types', () => {
            // Act
            const result = (transferService as any).getTransferTypeEmoji('unknown');

            // Assert
            expect(result).toBe('🔄');
        });
    });

    describe('getTransferStatusEmoji', () => {
        it('should return correct emoji for pending status', () => {
            // Act
            const result = (transferService as any).getTransferStatusEmoji('pending');

            // Assert
            expect(result).toBe('⏳');
        });

        it('should return correct emoji for initiated status', () => {
            // Act
            const result = (transferService as any).getTransferStatusEmoji('initiated');

            // Assert
            expect(result).toBe('🔄');
        });

        it('should return correct emoji for processing status', () => {
            // Act
            const result = (transferService as any).getTransferStatusEmoji('processing');

            // Assert
            expect(result).toBe('⚙️');
        });

        it('should return correct emoji for success status', () => {
            // Act
            const result = (transferService as any).getTransferStatusEmoji('success');

            // Assert
            expect(result).toBe('✅');
        });

        it('should return correct emoji for canceled status', () => {
            // Act
            const result = (transferService as any).getTransferStatusEmoji('canceled');

            // Assert
            expect(result).toBe('❌');
        });

        it('should return correct emoji for failed status', () => {
            // Act
            const result = (transferService as any).getTransferStatusEmoji('failed');

            // Assert
            expect(result).toBe('⛔');
        });

        it('should return correct emoji for refunded status', () => {
            // Act
            const result = (transferService as any).getTransferStatusEmoji('refunded');

            // Assert
            expect(result).toBe('↩️');
        });

        it('should return default emoji for unknown status', () => {
            // Act
            const result = (transferService as any).getTransferStatusEmoji('unknown');

            // Assert
            expect(result).toBe('❓');
        });
    });
});