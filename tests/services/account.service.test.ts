import { AccountService } from '../../src/services/account.service';
import { formatCountry, formatBankAccountType } from '../../src/utils/formatters.utils';
import { CreateAccountRequest } from '../../src/types/api.types';
import { mockAccounts, mockAccountResponse, mockCreatedAccount } from '../__mocks__/account.mock';
import { mockProviderResponse } from '../__mocks__/provider.mock';

jest.mock('../../src/api/account.api', () => ({
    accountApi: {
        getAccounts: jest.fn(),
        createAccount: jest.fn(),
        getAccount: jest.fn(),
        deleteAccount: jest.fn()
    }
}));

// Important: Mock providerApi as a named export
jest.mock('../../src/api/provider.api', () => {
    return {
        __esModule: true,
        default: {
            getProviders: jest.fn()
        }
    };
});

// Fix the logger mock to match the actual structure
jest.mock('../../src/utils/logger.utils', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

jest.mock('../../src/utils/formatters.utils');

// Get the mocked modules directly
const { accountApi } = require('../../src/api/account.api');
const providerApi = require('../../src/api/provider.api').default;
const logger = require('../../src/utils/logger.utils').default;

describe('Account Service', () => {
    // Create a fresh instance for testing
    let accountServiceInstance: AccountService;

    // Use existing mock data
    const mockAccount = mockAccounts[0];
    const mockAccountId = mockAccount.id;
    const mockWalletAccount = mockAccounts[2]; // The web3 wallet account

    // Create request data based on our mocks
    const mockCreateAccountRequest: CreateAccountRequest = {
        country: 'usa',
        network: '',
        walletAddress: '',
        isDefault: false,
        providerId: 'prov_12345',
        bankAccount: {
            bankName: 'Wells Fargo',
            bankAddress: '789 Money Rd, Chicago, IL 60007',
            method: 'bank_wire',
            bankAccountType: 'checking',
            bankRoutingNumber: '321654987',
            bankAccountNumber: '456789123012',
            bankBeneficiaryName: 'Robert Johnson',
            swiftCode: 'WFBIUS6S'
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Create a fresh instance for each test
        accountServiceInstance = new AccountService();

        // Setup formatters mock defaults
        (formatCountry as jest.Mock).mockImplementation(code => `Country ${code}`);
        (formatBankAccountType as jest.Mock).mockImplementation(type => `${type.charAt(0).toUpperCase() + type.slice(1)}`);
    });

    describe('getAccounts', () => {
        it('should return all accounts when API call succeeds', async () => {
            // Arrange
            accountApi.getAccounts.mockResolvedValue(mockAccountResponse);

            // Act
            const result = await accountServiceInstance.getAccounts();

            // Assert
            expect(accountApi.getAccounts).toHaveBeenCalled();
            expect(result).toEqual(mockAccountResponse.data);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('Network error');
            accountApi.getAccounts.mockRejectedValue(mockError);

            // Act
            const result = await accountServiceInstance.getAccounts();

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                'Failed to retrieve accounts',
                expect.objectContaining({
                    error: mockError
                })
            );
        });
    });

    describe('getBankAccounts', () => {
        it('should return only bank accounts when API call succeeds', async () => {
            // Arrange
            accountApi.getAccounts.mockResolvedValue(mockAccountResponse);
            const expectedBankAccounts = mockAccounts.filter(account => account.type === 'bank_account');

            // Act
            const result = await accountServiceInstance.getBankAccounts();

            // Assert
            expect(result).toEqual(expectedBankAccounts);
            expect(result?.length).toBe(2); // We have 2 bank accounts in our mocks
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('Network error');
            accountApi.getAccounts.mockRejectedValue(mockError);

            // Act
            const result = await accountServiceInstance.getBankAccounts();

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to retrieve'),
                expect.objectContaining({
                    error: expect.any(Error)
                })
            );
        });

        it('should return empty array if no bank accounts exist', async () => {
            // Arrange
            accountApi.getAccounts.mockResolvedValue({
                data: [mockWalletAccount] // Only include the wallet account
            });

            // Act
            const result = await accountServiceInstance.getBankAccounts();

            // Assert
            expect(result).toEqual([]);
            expect(result?.length).toBe(0);
        });
    });

    describe('createBankAccount', () => {
        it('should create and return a new bank account when API call succeeds', async () => {
            // Arrange
            accountApi.createAccount.mockResolvedValue(mockCreatedAccount);

            // Act
            const result = await accountServiceInstance.createBankAccount(mockCreateAccountRequest);

            // Assert
            expect(accountApi.createAccount).toHaveBeenCalledWith(mockCreateAccountRequest);
            expect(result).toEqual(mockCreatedAccount);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('Validation error');
            accountApi.createAccount.mockRejectedValue(mockError);

            // Act
            const result = await accountServiceInstance.createBankAccount(mockCreateAccountRequest);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                'Failed to create bank account',
                expect.objectContaining({
                    error: mockError,
                    data: mockCreateAccountRequest
                })
            );
        });
    });

    describe('getAccount', () => {
        it('should return an account by ID when API call succeeds', async () => {
            // Arrange
            accountApi.getAccount.mockResolvedValue(mockAccount);

            // Act
            const result = await accountServiceInstance.getAccount(mockAccountId);

            // Assert
            expect(accountApi.getAccount).toHaveBeenCalledWith(mockAccountId);
            expect(result).toEqual(mockAccount);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('Account not found');
            accountApi.getAccount.mockRejectedValue(mockError);

            // Act
            const result = await accountServiceInstance.getAccount(mockAccountId);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                'Failed to retrieve account',
                expect.objectContaining({
                    error: mockError,
                    id: mockAccountId
                })
            );
        });
    });

    describe('deleteAccount', () => {
        it('should return true when API call succeeds', async () => {
            // Arrange
            accountApi.deleteAccount.mockResolvedValue({ message: 'Success', statusCode: 200 });

            // Act
            const result = await accountServiceInstance.deleteAccount(mockAccountId);

            // Assert
            expect(accountApi.deleteAccount).toHaveBeenCalledWith(mockAccountId);
            expect(result).toBe(true);
        });

        it('should handle API errors and return false', async () => {
            // Arrange
            const mockError = new Error('Delete failed');
            accountApi.deleteAccount.mockRejectedValue(mockError);

            // Act
            const result = await accountServiceInstance.deleteAccount(mockAccountId);

            // Assert
            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(
                'Failed to delete account',
                expect.objectContaining({
                    error: mockError,
                    id: mockAccountId
                })
            );
        });
    });

    describe('getProviders', () => {
        it('should return providers when API call succeeds', async () => {
            // Arrange - Fix the mock implementation
            providerApi.getProviders.mockResolvedValue(mockProviderResponse);

            // Act
            const result = await accountServiceInstance.getProviders();

            // Assert
            expect(providerApi.getProviders).toHaveBeenCalledWith({
                page: 1,
                limit: 20
            });
            expect(result).toEqual(mockProviderResponse.data);
        });

        it('should handle API errors and return null', async () => {
            // Arrange - Fix the mock implementation
            const mockError = new Error('Network error');
            providerApi.getProviders.mockRejectedValue(mockError);

            // Act
            const result = await accountServiceInstance.getProviders();

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                'Failed to retrieve providers',
                expect.objectContaining({
                    error: mockError
                })
            );
        });
    });

    describe('formatBankAccount', () => {
        it('should format a bank account properly', () => {
            // Act
            const result = accountServiceInstance.formatBankAccount(mockAccount);

            // Assert
            expect(result).toContain(`🏦 *Bank Account*`);
            expect(result).toContain(`Bank: ${mockAccount.bankAccount?.bankName}`);

            // Check masked account number
            const accountNumber = mockAccount.bankAccount?.bankAccountNumber;
            const last4 = accountNumber?.substring(accountNumber.length - 4);
            expect(result).toContain(`Account: XXXX-XXXX-${last4}`);

            // Check masked routing number
            const routingNumber = mockAccount.bankAccount?.bankRoutingNumber;
            const routingLast4 = routingNumber?.substring(routingNumber.length - 4);
            expect(result).toContain(`Routing Number: XXXX${routingLast4}`);

            expect(result).toContain('Type: Checking');
            expect(result).toContain(`Country: Country ${mockAccount.country}`);
            expect(result).toContain(`Beneficiary: ${mockAccount.bankAccount?.bankBeneficiaryName}`);
            expect(result).toContain(`SWIFT: ${mockAccount.bankAccount?.swiftCode}`);

            expect(formatBankAccountType).toHaveBeenCalledWith('checking');
            expect(formatCountry).toHaveBeenCalledWith('usa');
        });

        it('should handle account without bank account details', () => {
            // Act
            const result = accountServiceInstance.formatBankAccount(mockWalletAccount);

            // Assert
            expect(result).toBe('No bank account information available.');
        });
    });

    describe('formatBankAccountList', () => {
        it('should format a list of bank accounts', () => {
            // Act
            const result = accountServiceInstance.formatBankAccountList(mockAccounts.filter(a => a.type === 'bank_account'));

            // Assert
            expect(result).toContain(`1. *${mockAccounts[0].bankAccount?.bankName}*`);
            expect(result).toContain(`2. *${mockAccounts[1].bankAccount?.bankName}*`);

            // Check for masked account numbers
            const accountNumber1 = mockAccounts[0].bankAccount?.bankAccountNumber;
            const last4_1 = accountNumber1?.substring(accountNumber1.length - 4);
            expect(result).toContain(`💳 Account: XXXX${last4_1}`);

            const accountNumber2 = mockAccounts[1].bankAccount?.bankAccountNumber;
            const last4_2 = accountNumber2?.substring(accountNumber2.length - 4);
            expect(result).toContain(`💳 Account: XXXX${last4_2}`);

            expect(result).toContain('🔍 Type: Checking');
            expect(result).toContain('🔍 Type: Savings');
        });

        it('should handle empty accounts list', () => {
            // Act
            const result = accountServiceInstance.formatBankAccountList([]);

            // Assert
            expect(result).toBe('You don\'t have any saved bank accounts yet.');
        });
    });
}); 