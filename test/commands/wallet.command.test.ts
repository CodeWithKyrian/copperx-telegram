import { walletCommand } from '../../src/commands/wallet.command';
import { createMockContext } from '../utils/mock-context';
import { walletService } from '../../src/services/wallet.service';
import { Wallet, WalletBalance, BalanceResponse } from '../../src/types/api.types';

// Mock wallet service
jest.mock('../../src/services/wallet.service', () => ({
    walletService: {
        getWallets: jest.fn(),
        getWalletBalances: jest.fn(),
        getTotalBalance: jest.fn(),
        getSupportedNetworks: jest.fn(),
    },
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
}));

describe('Wallet Command', () => {
    // Sample wallet data for testing
    const mockWallets: Wallet[] = [
        {
            id: '12345678-abcd-efgh-ijkl-123456789abc',
            walletType: 'web3_auth_copperx',
            network: 'Ethereum',
            walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
            isDefault: true,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z'
        },
        {
            id: '87654321-abcd-efgh-ijkl-123456789abc',
            walletType: 'web3_auth_copperx',
            network: 'Solana',
            walletAddress: 'SoLAnaAddReSS123456789012345678901234567890123456789',
            isDefault: false,
            createdAt: '2023-02-01T00:00:00Z',
            updatedAt: '2023-02-01T00:00:00Z'
        }
    ];

    // Sample balance data for testing
    const mockBalances: WalletBalance[] = [
        {
            walletId: '12345678-abcd-efgh-ijkl-123456789abc',
            isDefault: true,
            network: 'Ethereum',
            balances: [
                {
                    decimals: 6,
                    balance: '1000000',
                    symbol: 'USDC',
                    address: '0xusdc'
                }
            ]
        },
        {
            walletId: '87654321-abcd-efgh-ijkl-123456789abc',
            isDefault: false,
            network: 'Solana',
            balances: [
                {
                    decimals: 6,
                    balance: '500000',
                    symbol: 'USDC',
                    address: 'solanausdc'
                }
            ]
        }
    ];

    // Sample total balance
    const mockTotalBalance: BalanceResponse = {
        decimals: 6,
        balance: '1500000',
        symbol: 'USDC',
        address: '0x'
    };

    // Sample networks
    const mockNetworks = ['Ethereum', 'Solana', 'Polygon'];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should display wallet summary when user has wallets', async () => {
        // Arrange
        const ctx = createMockContext();
        (walletService.getWallets as jest.Mock).mockResolvedValue(mockWallets);
        (walletService.getWalletBalances as jest.Mock).mockResolvedValue(mockBalances);
        (walletService.getTotalBalance as jest.Mock).mockResolvedValue(mockTotalBalance);

        // Act
        await walletCommand(ctx);

        // Assert
        expect(walletService.getWallets).toHaveBeenCalled();
        expect(walletService.getWalletBalances).toHaveBeenCalled();
        expect(walletService.getTotalBalance).toHaveBeenCalled();

        expect(ctx.reply).toHaveBeenCalledWith(
            expect.stringContaining('Your CopperX Wallet'),
            expect.objectContaining({
                parse_mode: 'Markdown',
            })
        );

        // Check that the response contains wallet details
        const reply = ctx.reply as jest.Mock;
        const replyArgs = reply.mock.calls[0];
        expect(replyArgs[0]).toContain('Ethereum');
        expect(replyArgs[0]).toContain('Solana');
        expect(replyArgs[0]).toContain('USDC');

        // Verify that the inline keyboard contains expected buttons
        const keyboard = replyArgs[1];
        expect(keyboard).toHaveProperty('reply_markup.inline_keyboard');
        expect(keyboard.reply_markup.inline_keyboard.flat().map((btn: { text: string }) => btn.text)).toContain('➕ Create New Wallet');
        expect(keyboard.reply_markup.inline_keyboard.flat().map((btn: { text: string }) => btn.text)).toContain('💸 Deposit');
        expect(keyboard.reply_markup.inline_keyboard.flat().map((btn: { text: string }) => btn.text)).toContain('📤 Withdraw');
    });

    it('should handle case when user has no wallets', async () => {
        // Arrange
        const ctx = createMockContext();
        (walletService.getWallets as jest.Mock).mockResolvedValue([]);
        (walletService.getSupportedNetworks as jest.Mock).mockResolvedValue(mockNetworks);

        // Act
        await walletCommand(ctx);

        // Assert
        expect(walletService.getWallets).toHaveBeenCalled();
        expect(walletService.getSupportedNetworks).toHaveBeenCalled();

        expect(ctx.reply).toHaveBeenCalledWith(
            expect.stringContaining('No Wallets Found'),
            expect.objectContaining({
                parse_mode: 'Markdown',
            })
        );

        // Verify the keyboard contains network options
        const reply = ctx.reply as jest.Mock;
        const keyboard = reply.mock.calls[0][1];
        expect(keyboard).toHaveProperty('reply_markup.inline_keyboard');

        // Should have create buttons for each network plus cancel
        const buttons = keyboard.reply_markup.inline_keyboard.flat().map((btn: { text: string }) => btn.text);
        expect(buttons).toContain('Create Ethereum Wallet');
        expect(buttons).toContain('Create Solana Wallet');
        expect(buttons).toContain('Create Polygon Wallet');
        expect(buttons).toContain('❌ Cancel');
    });

    it('should handle error when retrieving wallet balances', async () => {
        // Arrange
        const ctx = createMockContext();
        (walletService.getWallets as jest.Mock).mockResolvedValue(mockWallets);
        (walletService.getWalletBalances as jest.Mock).mockResolvedValue(null);

        // Act
        await walletCommand(ctx);

        // Assert
        expect(walletService.getWallets).toHaveBeenCalled();
        expect(walletService.getWalletBalances).toHaveBeenCalled();

        expect(ctx.reply).toHaveBeenCalledWith(
            expect.stringContaining('Error retrieving wallet balances'),
            expect.objectContaining({
                parse_mode: 'Markdown',
            })
        );
    });

    it('should handle error when no networks are available', async () => {
        // Arrange
        const ctx = createMockContext();
        (walletService.getWallets as jest.Mock).mockResolvedValue([]);
        (walletService.getSupportedNetworks as jest.Mock).mockResolvedValue([]);

        // Act
        await walletCommand(ctx);

        // Assert
        expect(walletService.getWallets).toHaveBeenCalled();
        expect(walletService.getSupportedNetworks).toHaveBeenCalled();

        expect(ctx.reply).toHaveBeenCalledWith(
            expect.stringContaining('No wallets found'),
            expect.objectContaining({
                parse_mode: 'Markdown',
            })
        );
    });

    it('should handle unexpected errors', async () => {
        // Arrange
        const ctx = createMockContext();
        (walletService.getWallets as jest.Mock).mockRejectedValue(new Error('API error'));

        // Act
        await walletCommand(ctx);

        // Assert
        expect(walletService.getWallets).toHaveBeenCalled();

        expect(ctx.reply).toHaveBeenCalledWith(
            expect.stringContaining('Something went wrong'),
            expect.objectContaining({
                parse_mode: 'Markdown',
            })
        );
    });
}); 