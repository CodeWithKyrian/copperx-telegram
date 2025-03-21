import { payeeService } from '../../src/services/payee.service';
import payeeApi from '../../src/api/payeee.api';
import logger from '../../src/utils/logger.utils';
import { formatCountry, formatBankAccountType } from '../../src/utils/formatters.utils';
import { Payee, PaginatedResponse, CreatePayeeRequest, UpdatePayeeRequest } from '../../src/types/api.types';
import { mockPayees, mockPayeeResponse } from '../__mocks__/payee.mock';

// Mock dependencies
jest.mock('../../src/api/payeee.api');
jest.mock('../../src/utils/logger.utils');
jest.mock('../../src/utils/formatters.utils');

describe('Payee Service', () => {
    // Use existing mock data
    const mockPayee = mockPayees[0];
    const mockPayeeId = mockPayee.id;
    const mockPayeeWithoutBankAccount = mockPayees[1];

    // Create request data based on our mocks
    const mockCreatePayeeRequest: CreatePayeeRequest = {
        nickName: mockPayee.nickName,
        firstName: mockPayee.firstName,
        lastName: mockPayee.lastName,
        email: mockPayee.email,
        bankAccount: mockPayee.bankAccount
    };

    const mockUpdatePayeeRequest: UpdatePayeeRequest = {
        nickName: 'Johnny Boy',
        firstName: mockPayee.firstName,
        lastName: mockPayee.lastName,
        phoneNumber: mockPayee.phoneNumber
    };

    // Use the mock response that matches the PaginatedResponse type
    const mockPaginatedResponse: PaginatedResponse<Payee> = mockPayeeResponse;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup formatters mock defaults
        (formatCountry as jest.Mock).mockImplementation(code => `Country ${code}`);
        (formatBankAccountType as jest.Mock).mockImplementation(type => `${type.charAt(0).toUpperCase() + type.slice(1)}`);
    });

    describe('getPayees', () => {
        it('should return paginated payees when API call succeeds', async () => {
            // Arrange
            (payeeApi.getPayees as jest.Mock).mockResolvedValue(mockPaginatedResponse);

            // Act
            const result = await payeeService.getPayees(1, 10);

            // Assert
            expect(payeeApi.getPayees).toHaveBeenCalledWith(1, 10);
            expect(result).toEqual(mockPaginatedResponse);
        });

        it('should use default pagination parameters when not provided', async () => {
            // Arrange
            (payeeApi.getPayees as jest.Mock).mockResolvedValue(mockPaginatedResponse);

            // Act
            const result = await payeeService.getPayees();

            // Assert
            expect(payeeApi.getPayees).toHaveBeenCalledWith(1, 10);
            expect(result).toEqual(mockPaginatedResponse);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('Network error');
            (payeeApi.getPayees as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await payeeService.getPayees(1, 10);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    page: 1,
                    limit: 10
                }),
                'Failed to retrieve payees'
            );
        });
    });

    describe('createPayee', () => {
        it('should create and return a new payee when API call succeeds', async () => {
            // Arrange
            (payeeApi.createPayee as jest.Mock).mockResolvedValue(mockPayee);

            // Act
            const result = await payeeService.createPayee(mockCreatePayeeRequest);

            // Assert
            expect(payeeApi.createPayee).toHaveBeenCalledWith(mockCreatePayeeRequest);
            expect(result).toEqual(mockPayee);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('Validation error');
            (payeeApi.createPayee as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await payeeService.createPayee(mockCreatePayeeRequest);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    data: mockCreatePayeeRequest
                }),
                'Failed to create payee'
            );
        });
    });

    describe('getPayee', () => {
        it('should return a payee by ID when API call succeeds', async () => {
            // Arrange
            (payeeApi.getPayee as jest.Mock).mockResolvedValue(mockPayee);

            // Act
            const result = await payeeService.getPayee(mockPayeeId);

            // Assert
            expect(payeeApi.getPayee).toHaveBeenCalledWith(mockPayeeId);
            expect(result).toEqual(mockPayee);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('Payee not found');
            (payeeApi.getPayee as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await payeeService.getPayee(mockPayeeId);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    id: mockPayeeId
                }),
                'Failed to retrieve payee'
            );
        });
    });

    describe('updatePayee', () => {
        it('should update and return a payee when API call succeeds', async () => {
            // Arrange
            const updatedPayee = { ...mockPayee, nickName: 'Johnny Boy' };
            (payeeApi.updatePayee as jest.Mock).mockResolvedValue(updatedPayee);

            // Act
            const result = await payeeService.updatePayee(mockPayeeId, mockUpdatePayeeRequest);

            // Assert
            expect(payeeApi.updatePayee).toHaveBeenCalledWith(mockPayeeId, mockUpdatePayeeRequest);
            expect(result).toEqual(updatedPayee);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('Update failed');
            (payeeApi.updatePayee as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await payeeService.updatePayee(mockPayeeId, mockUpdatePayeeRequest);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    id: mockPayeeId,
                    data: mockUpdatePayeeRequest
                }),
                'Failed to update payee'
            );
        });
    });

    describe('deletePayee', () => {
        it('should return true when API call succeeds', async () => {
            // Arrange
            (payeeApi.deletePayee as jest.Mock).mockResolvedValue(undefined);

            // Act
            const result = await payeeService.deletePayee(mockPayeeId);

            // Assert
            expect(payeeApi.deletePayee).toHaveBeenCalledWith(mockPayeeId);
            expect(result).toBe(true);
        });

        it('should handle API errors and return false', async () => {
            // Arrange
            const mockError = new Error('Delete failed');
            (payeeApi.deletePayee as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await payeeService.deletePayee(mockPayeeId);

            // Assert
            expect(result).toBe(false);
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    id: mockPayeeId
                }),
                'Failed to delete payee'
            );
        });
    });

    describe('formatPayee', () => {
        it('should format a payee with bank account information', () => {
            // Act
            const result = payeeService.formatPayee(mockPayee);

            // Assert
            expect(result).toContain(`👤 *${mockPayee.displayName}*`);
            expect(result).toContain(`Email: ${mockPayee.email}`);
            expect(result).toContain('*Bank Account Details:*');
            expect(result).toContain(`Bank: ${mockPayee.bankAccount?.bankName}`);

            // Check masked account number
            const accountNumber = mockPayee.bankAccount?.bankAccountNumber;
            const last4 = accountNumber?.substring(accountNumber.length - 4);
            expect(result).toContain(`Account: XXXX-XXXX-${last4}`);

            expect(result).toContain('Type: Checking');
            expect(result).toContain(`Country: Country ${mockPayee.bankAccount?.country}`);

            expect(formatBankAccountType).toHaveBeenCalledWith('checking');
            expect(formatCountry).toHaveBeenCalledWith(mockPayee.bankAccount?.country);
        });

        it('should format a payee without bank account information', () => {
            // Act
            const result = payeeService.formatPayee(mockPayeeWithoutBankAccount);

            // Assert
            // Create the expected name
            const displayName = mockPayeeWithoutBankAccount.displayName ||
                `${mockPayeeWithoutBankAccount.firstName || ''} ${mockPayeeWithoutBankAccount.lastName || ''}`.trim() ||
                mockPayeeWithoutBankAccount.nickName;

            expect(result).toContain(`👤 *${displayName}*`);
            expect(result).toContain(`Email: ${mockPayeeWithoutBankAccount.email}`);
            expect(result).toContain('No bank account information available.');
            expect(result).not.toContain('*Bank Account Details:*');
        });

        it('should use fallback name when no display name is available', () => {
            // Arrange - create a copy of the mock and modify it
            const payeeWithoutNames: Payee = {
                ...mockPayeeWithoutBankAccount,
                displayName: '',
                firstName: '',
                lastName: '',
                nickName: 'Nickname Only'
            };

            // Act
            const result = payeeService.formatPayee(payeeWithoutNames);

            // Assert
            expect(result).toContain('👤 *Nickname Only*');
        });

        it('should handle missing bank account fields gracefully', () => {
            // Arrange - create a deep copy and modify specific fields
            const payeeWithPartialBankInfo: Payee = {
                ...mockPayee,
                bankAccount: {
                    ...mockPayee.bankAccount!,
                    bankName: '',  // Using empty string instead of undefined
                    bankAccountNumber: ''  // Using empty string instead of undefined
                }
            };

            // Act
            const result = payeeService.formatPayee(payeeWithPartialBankInfo);

            // Assert
            expect(result).toContain('Bank: Not specified');
            expect(result).toContain('Account: Not specified');
        });
    });

    describe('formatPayeeList', () => {
        it('should format a list of payees', () => {
            // Arrange
            const payees = [mockPayee, mockPayeeWithoutBankAccount];

            // Act
            const result = payeeService.formatPayeeList(payees);

            // Assert
            expect(result).toContain(`1. *${mockPayee.displayName}*`);
            expect(result).toContain(`   📧 ${mockPayee.email}`);

            if (mockPayee.firstName || mockPayee.lastName) {
                const name = [mockPayee.firstName, mockPayee.lastName].filter(Boolean).join(' ');
                expect(result).toContain(`   👤 ${name}`);
            }

            expect(result).toContain(`2. *${mockPayeeWithoutBankAccount.nickName}*`);
            expect(result).toContain(`   📧 ${mockPayeeWithoutBankAccount.email}`);
        });

        it('should return message when payee list is empty', () => {
            // Act
            const result = payeeService.formatPayeeList([]);

            // Assert
            expect(result).toBe('You don\'t have any saved payees yet.');
        });

        it('should handle null input gracefully', () => {
            // Act
            const result = payeeService.formatPayeeList(null as any);

            // Assert
            expect(result).toBe('You don\'t have any saved payees yet.');
        });

        it('should format payee with missing name fields', () => {
            // Arrange - create a copy with specifically modified fields
            const payeeWithMissingNames: Payee = {
                ...mockPayeeWithoutBankAccount,
                displayName: 'Display Only',
                firstName: '',
                lastName: '',
                nickName: ''
            };

            // Act
            const result = payeeService.formatPayeeList([payeeWithMissingNames]);

            // Assert
            expect(result).toContain('1. *Display Only*');
            expect(result).toContain(`   📧 ${payeeWithMissingNames.email}`);
            expect(result).not.toContain('   👤');
        });
    });
}); 