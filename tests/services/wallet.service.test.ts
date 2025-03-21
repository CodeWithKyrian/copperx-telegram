import { walletService } from '../../src/services/wallet.service';
import { walletApi } from '../../src/api/wallet.api';
import logger from '../../src/utils/logger.utils';
import {
    mockWallet,
    mockDefaultWallet,
    mockSolanaWallet,
    mockWallets,
    mockUSDCBalance,
    mockWalletBalances,
    mockSupportedNetworks
} from '../__mocks__/wallet.mock';
import { GenerateWalletRequest } from '../../src/types/api.types';

// Mock dependencies
jest.mock('../../src/api/wallet.api');
jest.mock('../../src/utils/logger.utils');

describe('Wallet Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getWallets', () => {
        it('should retrieve all user wallets', async () => {
            // Arrange
            (walletApi.getWallets as jest.Mock).mockResolvedValue(mockWallets);

            // Act
            const result = await walletService.getWallets();

            // Assert
            expect(walletApi.getWallets).toHaveBeenCalled();
            expect(result).toEqual(mockWallets);
            expect(result?.length).toBe(3);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('API error');
            (walletApi.getWallets as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await walletService.getWallets();

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError
                }),
                'Failed to retrieve wallets'
            );
        });
    });

    describe('getWalletById', () => {
        it('should return a wallet by ID when found', async () => {
            // Arrange
            (walletApi.getWallets as jest.Mock).mockResolvedValue(mockWallets);

            // Act
            const result = await walletService.getWalletById(mockWallet.id);

            // Assert
            expect(result).toEqual(mockWallet);
        });

        it('should return null when wallet ID is not found', async () => {
            // Arrange
            (walletApi.getWallets as jest.Mock).mockResolvedValue(mockWallets);

            // Act
            const result = await walletService.getWalletById('non-existent-id');

            // Assert
            expect(result).toBeNull();
        });

        it('should return null when getWallets returns null', async () => {
            // Arrange
            (walletApi.getWallets as jest.Mock).mockResolvedValue(null);

            // Act
            const result = await walletService.getWalletById(mockWallet.id);

            // Assert
            expect(result).toBeNull();
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('API error');
            (walletApi.getWallets as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await walletService.getWalletById(mockWallet.id);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError
                }),
                'Failed to retrieve wallets'
            );
        });
    });

    describe('getDefaultWallet', () => {
        it('should retrieve the default wallet', async () => {
            // Arrange
            (walletApi.getDefaultWallet as jest.Mock).mockResolvedValue(mockDefaultWallet);

            // Act
            const result = await walletService.getDefaultWallet();

            // Assert
            expect(walletApi.getDefaultWallet).toHaveBeenCalled();
            expect(result).toEqual(mockDefaultWallet);
            expect(result?.isDefault).toBe(true);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('API error');
            (walletApi.getDefaultWallet as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await walletService.getDefaultWallet();

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError
                }),
                'Failed to retrieve default wallet'
            );
        });
    });

    describe('setDefaultWallet', () => {
        it('should set a wallet as default', async () => {
            // Arrange
            const walletId = mockWallet.id;
            const updatedWallet = { ...mockWallet, isDefault: true };
            (walletApi.setDefaultWallet as jest.Mock).mockResolvedValue(updatedWallet);

            // Act
            const result = await walletService.setDefaultWallet(walletId);

            // Assert
            expect(walletApi.setDefaultWallet).toHaveBeenCalledWith(walletId);
            expect(result).toEqual(updatedWallet);
            expect(result?.isDefault).toBe(true);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const walletId = mockWallet.id;
            const mockError = new Error('API error');
            (walletApi.setDefaultWallet as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await walletService.setDefaultWallet(walletId);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    walletId
                }),
                'Failed to set default wallet'
            );
        });
    });

    describe('generateWallet', () => {
        it('should generate a new wallet', async () => {
            // Arrange
            const params: GenerateWalletRequest = { network: 'ethereum' };
            const newWallet = {
                id: 'new-wallet-123',
                createdAt: '2024-03-15T12:00:00Z',
                updatedAt: '2024-03-15T12:00:00Z',
                walletType: 'web3_auth_copperx',
                network: 'ethereum',
                walletAddress: '0xnewwallet1234567890abcdef1234567890abcdef',
                isDefault: false
            };
            (walletApi.generateWallet as jest.Mock).mockResolvedValue(newWallet);

            // Act
            const result = await walletService.generateWallet(params);

            // Assert
            expect(walletApi.generateWallet).toHaveBeenCalledWith(params);
            expect(result).toEqual(newWallet);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const params: GenerateWalletRequest = { network: 'ethereum' };
            const mockError = new Error('API error');
            (walletApi.generateWallet as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await walletService.generateWallet(params);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    params
                }),
                'Failed to generate wallet'
            );
        });
    });

    describe('getDefaultWalletBalance', () => {
        it('should retrieve the default wallet balance', async () => {
            // Arrange
            (walletApi.getBalance as jest.Mock).mockResolvedValue(mockUSDCBalance);

            // Act
            const result = await walletService.getDefaultWalletBalance();

            // Assert
            expect(walletApi.getBalance).toHaveBeenCalled();
            expect(result).toEqual(mockUSDCBalance);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('API error');
            (walletApi.getBalance as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await walletService.getDefaultWalletBalance();

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError
                }),
                'Failed to retrieve default wallet balance'
            );
        });
    });

    describe('getWalletBalances', () => {
        it('should retrieve all wallet balances', async () => {
            // Arrange
            (walletApi.getWalletBalances as jest.Mock).mockResolvedValue(mockWalletBalances);

            // Act
            const result = await walletService.getWalletBalances();

            // Assert
            expect(walletApi.getWalletBalances).toHaveBeenCalled();
            expect(result).toEqual(mockWalletBalances);
            expect(result?.length).toBe(3);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('API error');
            (walletApi.getWalletBalances as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await walletService.getWalletBalances();

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError
                }),
                'Failed to retrieve wallet balances'
            );
        });
    });

    describe('getTotalBalance', () => {
        it('should retrieve the total balance', async () => {
            // Arrange
            (walletApi.getBalance as jest.Mock).mockResolvedValue(mockUSDCBalance);

            // Act
            const result = await walletService.getTotalBalance();

            // Assert
            expect(walletApi.getBalance).toHaveBeenCalled();
            expect(result).toEqual(mockUSDCBalance);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('API error');
            (walletApi.getBalance as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await walletService.getTotalBalance();

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError
                }),
                'Failed to retrieve total balance'
            );
        });
    });

    describe('getSupportedNetworks', () => {
        it('should retrieve supported networks', async () => {
            // Arrange
            (walletApi.getSupportedNetworks as jest.Mock).mockResolvedValue(mockSupportedNetworks);

            // Act
            const result = await walletService.getSupportedNetworks();

            // Assert
            expect(walletApi.getSupportedNetworks).toHaveBeenCalled();
            expect(result).toEqual(mockSupportedNetworks);
            expect(result?.length).toBe(5);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('API error');
            (walletApi.getSupportedNetworks as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await walletService.getSupportedNetworks();

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError
                }),
                'Failed to retrieve supported networks'
            );
        });
    });

    describe('Integration tests', () => {
        it('should find the default wallet among all wallets', async () => {
            // Arrange
            (walletApi.getWallets as jest.Mock).mockResolvedValue(mockWallets);

            // Act
            const wallets = await walletService.getWallets();
            const defaultWallet = wallets?.find(wallet => wallet.isDefault);

            // Assert
            expect(defaultWallet).toBeDefined();
            expect(defaultWallet?.id).toBe(mockDefaultWallet.id);
        });

        it('should correctly identify a wallet by ID', async () => {
            // Arrange
            (walletApi.getWallets as jest.Mock).mockResolvedValue(mockWallets);

            // Act
            const wallet1 = await walletService.getWalletById(mockWallet.id);
            const wallet2 = await walletService.getWalletById(mockDefaultWallet.id);
            const wallet3 = await walletService.getWalletById(mockSolanaWallet.id);

            // Assert
            expect(wallet1?.network).toBe('ethereum');
            expect(wallet2?.network).toBe('polygon');
            expect(wallet3?.network).toBe('solana');
        });

        it('should handle cases where wallet API returns empty list', async () => {
            // Arrange
            (walletApi.getWallets as jest.Mock).mockResolvedValue([]);

            // Act
            const wallets = await walletService.getWallets();
            const walletById = await walletService.getWalletById(mockWallet.id);

            // Assert
            expect(wallets).toEqual([]);
            expect(walletById).toBeNull();
        });
    });
});