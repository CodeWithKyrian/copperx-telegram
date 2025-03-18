import { Payee } from '../../src/types/api.types';

export const mockPayees: Payee[] = [
    {
        id: 'payee-123',
        createdAt: '2024-03-20T10:00:00Z',
        updatedAt: '2024-03-20T10:00:00Z',
        organizationId: 'org-123',
        nickName: 'John Work',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        displayName: 'John D.',
        hasBankAccount: true,
        bankAccount: {
            country: 'usa',
            bankName: 'Test Bank',
            bankAddress: '123 Bank St',
            type: 'bank_ach',
            bankAccountType: 'checking',
            bankRoutingNumber: '123456789',
            bankAccountNumber: '987654321',
            bankBeneficiaryName: 'John Doe',
            bankBeneficiaryAddress: '456 Home St',
            swiftCode: 'TESTUS12'
        }
    },
    {
        id: 'payee-456',
        createdAt: '2024-03-19T15:30:00Z',
        updatedAt: '2024-03-19T15:30:00Z',
        organizationId: 'org-123',
        nickName: 'Alice',
        email: 'alice@example.com',
        hasBankAccount: false
    }
];

export const mockPayeeResponse = {
    data: mockPayees,
    page: 1,
    limit: 10,
    count: 2,
    hasMore: false
};

export const mockPayeeResponseWithPagination = {
    data: mockPayees,
    page: 1,
    limit: 10,
    count: 15,
    hasMore: true
}; 