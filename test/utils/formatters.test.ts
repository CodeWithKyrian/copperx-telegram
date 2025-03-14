import {
    formatCurrency,
    formatDate,
    truncateText,
    formatWalletAddress,
    formatBalance,
    formatWalletInfo
} from '../../src/utils/formatters';
import { BalanceResponse, Wallet } from '../../src/types';

describe('Formatters', () => {
    describe('formatCurrency', () => {
        it('should format currency with proper decimal places', () => {
            expect(formatCurrency('1000000', 6)).toBe('1,000,000.00');
            expect(formatCurrency('1000.12345', 3)).toBe('1,000.123');
            expect(formatCurrency('0.12345', 4)).toBe('0.1235'); // rounds
        });

        it('should handle empty or invalid inputs', () => {
            expect(formatCurrency('')).toBe('0.00');
            expect(formatCurrency('not-a-number')).toBe('0.00');
            expect(formatCurrency(null as any)).toBe('0.00');
            expect(formatCurrency(undefined as any)).toBe('0.00');
        });

        it('should use default decimal places if not specified', () => {
            expect(formatCurrency('1000.12345678')).toBe('1,000.123457'); // default is 6
        });
    });

    describe('formatDate', () => {
        it('should format date strings into readable format', () => {
            const date = new Date(2023, 0, 15); // Jan 15, 2023
            expect(formatDate(date.toISOString())).toMatch(/Jan 15, 2023/);
        });

        it('should handle empty or invalid inputs', () => {
            expect(formatDate('')).toBe('');
            expect(formatDate('not-a-date')).toBe('Invalid Date');
        });
    });

    describe('truncateText', () => {
        it('should truncate text longer than maxLength', () => {
            expect(truncateText('This is a very long text that should be truncated', 20)).toBe('This is a very lo...');
        });

        it('should not truncate text shorter than maxLength', () => {
            expect(truncateText('Short text', 20)).toBe('Short text');
        });

        it('should handle empty inputs', () => {
            expect(truncateText('')).toBe('');
            expect(truncateText(null as any)).toBe(null);
        });

        it('should use default maxLength if not specified', () => {
            const longText = 'This is a text that is longer than the default 30 characters limit';
            expect(truncateText(longText)).toBe('This is a text that is long...');
        });
    });

    describe('formatWalletAddress', () => {
        it('should truncate wallet address with ellipsis in the middle', () => {
            const address = '0x1234567890abcdef1234567890abcdef12345678';
            expect(formatWalletAddress(address)).toBe('0x123456...12345678');
        });

        it('should not truncate short addresses', () => {
            const shortAddress = '0x1234567890';
            expect(formatWalletAddress(shortAddress)).toBe(shortAddress);
        });

        it('should handle empty inputs', () => {
            expect(formatWalletAddress('')).toBe('');
            expect(formatWalletAddress(null as any)).toBe('');
        });
    });

    describe('formatBalance', () => {
        it('should format balance with proper symbol', () => {
            const balance: BalanceResponse = {
                decimals: 6,
                balance: '1000000',
                symbol: 'USDC',
                address: '0xusdc'
            };
            expect(formatBalance(balance)).toBe('1,000,000.00 USDC');
        });

        it('should handle empty or undefined balance', () => {
            expect(formatBalance(null as any)).toBe('N/A');
            expect(formatBalance(undefined as any)).toBe('N/A');
        });

        it('should format small amounts correctly', () => {
            const balance: BalanceResponse = {
                decimals: 6,
                balance: '0.000123',
                symbol: 'ETH',
                address: '0xeth'
            };
            expect(formatBalance(balance)).toBe('0.000123 ETH');
        });
    });

    describe('formatWalletInfo', () => {
        it('should format wallet information for display', () => {
            const wallet: Wallet = {
                id: '12345678-abcd-efgh-ijkl-123456789abc',
                walletType: 'web3_auth_copperx',
                network: 'Ethereum',
                walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
                isDefault: true,
                createdAt: '2023-01-01T00:00:00Z',
                updatedAt: '2023-01-01T00:00:00Z'
            };

            const formatted = formatWalletInfo(wallet);
            expect(formatted).toContain('Wallet ID');
            expect(formatted).toContain('12345678-abcd-efgh-ijkl-123456789abc');
            expect(formatted).toContain('Default');
            expect(formatted).toContain('Network: Ethereum');
            expect(formatted).toContain('0x123456...12345678');
        });

        it('should handle wallets without all properties', () => {
            const wallet: Wallet = {
                id: '12345',
                walletType: 'web3_auth_copperx',
                isDefault: false,
            };

            const formatted = formatWalletInfo(wallet);
            expect(formatted).toContain('Wallet ID');
            expect(formatted).toContain('12345');
            expect(formatted).not.toContain('Default');
            expect(formatted).not.toContain('Network');
            expect(formatted).not.toContain('Address');
        });
    });
}); 