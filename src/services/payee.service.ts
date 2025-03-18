import { CreatePayeeRequest, Payee, PaginatedResponse, UpdatePayeeRequest } from '../types/api.types';
import payeeApi from '../api/payeee.api';
import logger from '../utils/logger.utils';
import { formatCountry } from '../utils/formatters.utils';
import { formatBankAccountType } from '../utils/formatters.utils';

/**
 * Service for managing payees
 */
export class PayeeService {
    /**
     * Get all payees
     */
    public async getPayees(page = 1, limit = 10): Promise<PaginatedResponse<Payee> | null> {
        try {
            const response = await payeeApi.getPayees(page, limit);
            return response;
        } catch (error) {
            logger.error('Failed to retrieve payees', { error, page, limit });
            return null;
        }
    }

    /**
     * Create a new payee
     */
    public async createPayee(data: CreatePayeeRequest): Promise<Payee | null> {
        try {
            const response = await payeeApi.createPayee(data);
            return response;
        } catch (error) {
            logger.error('Failed to create payee', { error, data });
            return null;
        }
    }

    /**
     * Get a payee by ID
     * @param id Payee ID
     * @returns Payee details or null if error occurs
     */
    public async getPayee(id: string): Promise<Payee | null> {
        try {
            const response = await payeeApi.getPayee(id);
            return response;
        } catch (error) {
            logger.error('Failed to retrieve payee', { error, id });
            return null;
        }
    }

    /**
     * Update a payee
     */
    public async updatePayee(id: string, data: UpdatePayeeRequest): Promise<Payee | null> {
        try {
            const response = await payeeApi.updatePayee(id, data);
            return response;
        } catch (error) {
            logger.error('Failed to update payee', { error, id, data });
            return null;
        }
    }

    /**
     * Delete a payee
     * @param id Payee ID
     * @returns Success status or null if error occurs
     */
    public async deletePayee(id: string): Promise<boolean> {
        try {
            await payeeApi.deletePayee(id);
            return true;
        } catch (error) {
            logger.error('Failed to delete payee', { error, id });
            return false;
        }
    }

    /**
     * Format a payee for display
     * @param payee Payee object
     * @returns Formatted payee string
     */
    public formatPayee(payee: Payee): string {
        const displayName = payee.displayName || `${payee.firstName || ''} ${payee.lastName || ''}`.trim() || payee.nickName;

        let message = `👤 *${displayName}*\n`;
        message += `Email: ${payee.email}\n`;

        if (payee.hasBankAccount && payee.bankAccount) {
            message += '\n*Bank Account Details:*\n';
            message += `Bank: ${payee.bankAccount.bankName || 'Not specified'}\n`;

            // Format and mask account number for security
            const accountNumber = payee.bankAccount.bankAccountNumber;
            const maskedNumber = accountNumber ?
                `XXXX-XXXX-${accountNumber.substring(Math.max(0, accountNumber.length - 4))}` :
                'Not specified';

            message += `Account: ${maskedNumber}\n`;
            message += `Type: ${formatBankAccountType(payee.bankAccount.bankAccountType)}\n`;
            message += `Country: ${formatCountry(payee.bankAccount.country)}\n`;
        } else {
            message += '\nNo bank account information available.';
        }

        return message;
    }

    /**
     * Format a list of payees for display
     * @param payees List of payees
     * @returns Formatted payee list string
     */
    public formatPayeeList(payees: Payee[]): string {
        if (!payees || payees.length === 0) {
            return 'You don\'t have any saved recipients yet.';
        }

        let message = '';
        payees.forEach((payee, index) => {
            const displayName = payee.displayName || payee.nickName;
            message += `${index + 1}. *${displayName}*\n`;
            message += `   📧 ${payee.email}\n`;

            if (payee.firstName || payee.lastName) {
                const name = [payee.firstName, payee.lastName].filter(Boolean).join(' ');
                message += `   👤 ${name}\n`;
            }

            message += '\n';
        });

        return message;
    }
}

// Export default instance
export const payeeService = new PayeeService();
export default payeeService; 