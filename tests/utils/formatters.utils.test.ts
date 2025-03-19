import {
    capitalize,
    formatWalletBalance,
    formatWalletAddress,
    toRawAmount,
    fromRawAmount,
    formatHumanAmount,
    formatRawAmount,
    formatDate,
    formatWalletInfo,
    truncateText,
    formatPurposeCode,
    formatBankAccountType,
    formatCountry,
    formatTransferType,
    formatTransferStatus,
    formatUserStatus
} from '../../src/utils/formatters.utils';
import { mockWallet } from '../__mocks__/wallet.mock';
import { formatNetworkName } from '../../src/utils/chain.utils';
import { BalanceResponse } from '../../src/types/api.types';

// Mock chain.utils dependencies
jest.mock('../../src/utils/chain.utils', () => ({
    formatNetworkName: jest.fn((network) => {
        // Mock implementation that capitalizes the network name
        return network.charAt(0).toUpperCase() + network.slice(1);
    })
}));

describe('Formatters Utils', () => {
    describe('capitalize', () => {
        it('should capitalize a simple string', () => {
            expect(capitalize('hello')).toBe('Hello');
        });

        it('should capitalize snake_case strings', () => {
            expect(capitalize('hello_world')).toBe('Hello World');
        });

        it('should handle undefined values', () => {
            expect(capitalize(undefined)).toBe('Not set');
        });

        it('should handle empty strings', () => {
            expect(capitalize('')).toBe('Not set');
        });

        it('should handle multiple underscores', () => {
            expect(capitalize('user_profile_data')).toBe('User Profile Data');
        });
    });

    describe('formatWalletBalance', () => {
        it('should format wallet balance correctly', () => {
            const balance: BalanceResponse = {
                decimals: 6,
                balance: '1000.5',
                symbol: 'USDC',
                address: '0xusdc_contract_address'
            };
            expect(formatWalletBalance(balance)).toBe('1,000.50 USDC');
        });

        it('should handle undefined balance', () => {
            expect(formatWalletBalance(undefined as any)).toBe('0.00 USDC');
        });

        it('should handle zero balance', () => {
            const balance: BalanceResponse = {
                decimals: 6,
                balance: '0',
                symbol: 'USDT',
                address: '0xusdt_contract_address'
            };
            expect(formatWalletBalance(balance)).toBe('0.00 USDT');
        });
    });

    describe('formatWalletAddress', () => {
        it('should format long wallet addresses', () => {
            const address = '0x1234567890abcdef1234567890abcdef12345678';
            expect(formatWalletAddress(address)).toBe('0x123456...12345678');
        });

        it('should not truncate short wallet addresses', () => {
            const address = '0x12345678';
            expect(formatWalletAddress(address)).toBe('0x12345678');
        });

        it('should handle undefined addresses', () => {
            expect(formatWalletAddress(undefined)).toBe('');
        });

        it('should handle empty addresses', () => {
            expect(formatWalletAddress('')).toBe('');
        });
    });

    describe('toRawAmount', () => {
        it('should convert a string amount to raw format with default decimals', () => {
            expect(toRawAmount('1.5')).toBe('150000000');
        });

        it('should convert a numeric amount to raw format', () => {
            expect(toRawAmount(2.25, 6)).toBe('2250000');
        });

        it('should handle custom decimal places', () => {
            expect(toRawAmount('0.005', 2)).toBe('1');
        });

        it('should handle zero values', () => {
            expect(toRawAmount('0')).toBe('0');
            expect(toRawAmount(0)).toBe('0');
        });

        it('should handle empty or undefined values', () => {
            expect(toRawAmount('')).toBe('0');
            expect(toRawAmount(undefined as any)).toBe('0');
        });

        it('should correctly round values', () => {
            expect(toRawAmount('1.2345678', 6)).toBe('1234568'); // rounds up
            expect(toRawAmount('1.2344', 6)).toBe('1234400');    // doesn't round up
        });
    });

    describe('fromRawAmount', () => {
        it('should convert a string raw amount to human-readable format with default decimals', () => {
            expect(fromRawAmount('150000000')).toBe('1.5');
        });

        it('should convert a numeric raw amount to human-readable format', () => {
            expect(fromRawAmount(2250000, 6)).toBe('2.25');
        });

        it('should handle custom decimal places', () => {
            expect(fromRawAmount('1', 2)).toBe('0.01');
        });

        it('should handle zero values', () => {
            expect(fromRawAmount('0')).toBe('0');
            expect(fromRawAmount(0)).toBe('0');
        });

        it('should handle empty or undefined values', () => {
            expect(fromRawAmount('')).toBe('0');
            expect(fromRawAmount(undefined as any)).toBe('0');
        });
    });

    describe('formatHumanAmount', () => {
        it('should format a human-readable amount with default decimal places', () => {
            expect(formatHumanAmount('1234.5')).toBe('1,234.50');
        });

        it('should format a numeric amount', () => {
            expect(formatHumanAmount(1234.5)).toBe('1,234.50');
        });

        it('should handle custom decimal places', () => {
            expect(formatHumanAmount('1234.5678', 4)).toBe('1,234.5678');
        });

        it('should handle zero values', () => {
            expect(formatHumanAmount('0')).toBe('0.00');
            expect(formatHumanAmount(0)).toBe('0.00');
        });

        it('should handle empty or undefined values', () => {
            expect(formatHumanAmount('')).toBe('0.00');
            expect(formatHumanAmount(undefined as any)).toBe('0.00');
        });
    });

    describe('formatRawAmount', () => {
        it('should format a raw amount with default parameters', () => {
            expect(formatRawAmount('150000000')).toBe('1.50');
        });

        it('should handle custom decimals and display decimals', () => {
            expect(formatRawAmount('1234567', 6, 4)).toBe('1.2346');
        });

        it('should handle numeric inputs', () => {
            expect(formatRawAmount(150000000)).toBe('1.50');
        });

        it('should handle zero values', () => {
            expect(formatRawAmount('0')).toBe('0.00');
            expect(formatRawAmount(0)).toBe('0.00');
        });

        it('should handle empty or undefined values', () => {
            expect(formatRawAmount('')).toBe('0.00');
            expect(formatRawAmount(undefined as any)).toBe('0.00');
        });
    });

    describe('formatDate', () => {
        it('should format a date string to a readable format', () => {
            const date = new Date('2023-01-15T14:30:00Z');
            const mockDateString = date.toISOString();

            // We use regex to avoid locale-dependent tests
            expect(formatDate(mockDateString)).toMatch(/Jan 15, 2023/);
        });

        it('should handle undefined dates', () => {
            expect(formatDate(undefined)).toBe('');
        });
    });

    describe('formatWalletInfo', () => {
        beforeEach(() => {
            (formatNetworkName as jest.Mock).mockImplementation((network) => {
                return network.charAt(0).toUpperCase() + network.slice(1);
            });
        });

        it('should format wallet info for a default wallet', () => {
            const wallet = {
                ...mockWallet,
                isDefault: true
            };
            const result = formatWalletInfo(wallet);

            expect(result).toContain(`🔹 *Wallet ID*: \`${wallet.id}\` ✓ Default`);
            expect(result).toContain(`Network: Ethereum`);
            expect(result).toContain(`Address: \`${formatWalletAddress(wallet.walletAddress)}\``);
        });

        it('should format wallet info for a non-default wallet', () => {
            const result = formatWalletInfo(mockWallet);

            expect(result).toContain(`🔹 *Wallet ID*: \`${mockWallet.id}\``);
            expect(result).not.toContain('✓ Default');
        });

        it('should handle wallet without network', () => {
            const walletWithoutNetwork = {
                ...mockWallet,
                network: undefined
            };
            const result = formatWalletInfo(walletWithoutNetwork);

            expect(result).not.toContain('Network:');
        });

        it('should handle wallet without address', () => {
            const walletWithoutAddress = {
                ...mockWallet,
                walletAddress: undefined
            };
            const result = formatWalletInfo(walletWithoutAddress);

            expect(result).not.toContain('Address:');
        });
    });

    describe('truncateText', () => {
        it('should truncate text that exceeds max length', () => {
            const longText = 'This is a very long text that needs to be truncated';
            expect(truncateText(longText, 20)).toBe('This is a very lo...');
        });

        it('should not truncate text within max length', () => {
            const shortText = 'Short text';
            expect(truncateText(shortText, 20)).toBe(shortText);
        });

        it('should use default max length when not specified', () => {
            const longText = 'a'.repeat(40);
            expect(truncateText(longText)).toBe('a'.repeat(27) + '...');
        });

        it('should handle empty or undefined text', () => {
            expect(truncateText('')).toBe('');
            expect(truncateText(undefined as any)).toBe(undefined);
        });
    });

    describe('formatPurposeCode', () => {
        it('should format various purpose codes correctly', () => {
            expect(formatPurposeCode('self')).toBe('Personal Use');
            expect(formatPurposeCode('salary')).toBe('Salary Payment');
            expect(formatPurposeCode('gift')).toBe('Gift');
            expect(formatPurposeCode('income')).toBe('Income');
            expect(formatPurposeCode('saving')).toBe('Savings');
            expect(formatPurposeCode('education_support')).toBe('Education Support');
            expect(formatPurposeCode('family')).toBe('Family Support');
            expect(formatPurposeCode('home_improvement')).toBe('Home Improvement');
            expect(formatPurposeCode('reimbursement')).toBe('Reimbursement');
        });
    });

    describe('formatBankAccountType', () => {
        it('should format bank account types correctly', () => {
            expect(formatBankAccountType('savings')).toBe('Savings');
            expect(formatBankAccountType('checking')).toBe('Checking');
        });
    });

    describe('formatCountry', () => {
        it('should format known country codes to full names', () => {
            expect(formatCountry('usa')).toBe('United States');
            expect(formatCountry('ind')).toBe('India');
            expect(formatCountry('are')).toBe('United Arab Emirates');
            expect(formatCountry('sgp')).toBe('Singapore');
        });

        it('should format unknown country codes to uppercase', () => {
            expect(formatCountry('xyz' as any)).toBe('XYZ');
        });
    });

    describe('formatTransferType', () => {
        it('should format transfer types correctly', () => {
            expect(formatTransferType('send')).toBe('Send');
            expect(formatTransferType('receive')).toBe('Receive');
            expect(formatTransferType('withdraw')).toBe('Withdrawal');
            expect(formatTransferType('deposit')).toBe('Deposit');
            expect(formatTransferType('bridge')).toBe('Bridge');
            expect(formatTransferType('bank_deposit')).toBe('Bank Deposit');
        });
    });

    describe('formatTransferStatus', () => {
        it('should format transfer statuses correctly', () => {
            expect(formatTransferStatus('initiated')).toBe('Initiated');
            expect(formatTransferStatus('processing')).toBe('Processing');
            expect(formatTransferStatus('success')).toBe('Completed');
            expect(formatTransferStatus('canceled')).toBe('Canceled');
            expect(formatTransferStatus('failed')).toBe('Failed');
            expect(formatTransferStatus('refunded')).toBe('Refunded');
            expect(formatTransferStatus('pending')).toBe('Pending');
        });
    });

    describe('formatUserStatus', () => {
        it('should format user statuses with appropriate icons', () => {
            expect(formatUserStatus('pending')).toBe('⏳ Pending');
            expect(formatUserStatus('active')).toBe('✅ Active');
            expect(formatUserStatus('suspended')).toBe('❌ Suspended');
        });

        it('should handle unknown status', () => {
            expect(formatUserStatus('unknown' as any)).toBe('Unknown status');
        });
    });
}); 