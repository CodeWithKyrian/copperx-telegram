import { Account, ListResponse } from '../../src/types/api.types';

// Example bank accounts
export const mockAccounts: Account[] = [
    {
        id: 'acc_123456789',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        organizationId: 'org_123456789',
        type: 'bank_account',
        walletAccountType: 'other',
        method: 'bank_wire',
        country: 'usa',
        isDefault: false,
        bankAccount: {
            bankName: 'Chase Bank',
            bankAddress: '123 Banking St, New York, NY 10001',
            method: 'bank_wire',
            bankAccountType: 'checking',
            bankRoutingNumber: '123456789',
            bankAccountNumber: '987654321012',
            bankBeneficiaryName: 'John Doe',
            swiftCode: 'CHASUS33'
        }
    },
    {
        id: 'acc_987654321',
        createdAt: '2023-02-01T00:00:00Z',
        updatedAt: '2023-02-01T00:00:00Z',
        organizationId: 'org_123456789',
        type: 'bank_account',
        walletAccountType: 'other',
        method: 'bank_wire',
        country: 'usa',
        isDefault: false,
        bankAccount: {
            bankName: 'Bank of America',
            bankAddress: '456 Financial Ave, Los Angeles, CA 90001',
            method: 'bank_wire',
            bankAccountType: 'savings',
            bankRoutingNumber: '987654321',
            bankAccountNumber: '123456789012',
            bankBeneficiaryName: 'Jane Smith',
            swiftCode: 'BOFAUS3N'
        }
    },
    {
        id: 'acc_wallet123',
        createdAt: '2023-03-01T00:00:00Z',
        updatedAt: '2023-03-01T00:00:00Z',
        organizationId: 'org_123456789',
        type: 'web3_wallet',
        walletAccountType: 'safe',
        network: 'ethereum',
        walletAddress: '0x123456789abcdef',
        isDefault: true
    }
];

// Example response for getAccounts
export const mockAccountResponse: ListResponse<Account> = {
    data: mockAccounts
};

// Mock createAccount response
export const mockCreatedAccount: Account = {
    id: 'acc_new123456',
    createdAt: '2023-04-01T00:00:00Z',
    updatedAt: '2023-04-01T00:00:00Z',
    organizationId: 'org_123456789',
    type: 'bank_account',
    walletAccountType: 'other',
    method: 'bank_wire',
    country: 'usa',
    isDefault: false,
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