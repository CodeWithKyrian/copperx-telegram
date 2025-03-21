import {
    Account,
    CreateAccountRequest,
    Provider,
} from '../types/api.types';
import { accountApi } from '../api/account.api';
import providerApi from '../api/provider.api';
import logger from '../utils/logger.utils';
import { formatCountry, formatBankAccountType } from '../utils/formatters.utils';

/**
 * Service for managing bank accounts
 */
export class AccountService {
    /**
     * Get all accounts
     */
    public async getAccounts(): Promise<Account[] | null> {
        try {
            const response = await accountApi.getAccounts();
            return response.data;
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve accounts');
            return null;
        }
    }

    /**
     * Get bank accounts (filtered for only bank accounts)
     */
    public async getBankAccounts(): Promise<Account[] | null> {
        try {
            const accounts = await this.getAccounts();
            if (!accounts) return null;

            return accounts.filter(account => account.type === 'bank_account');
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve bank accounts');
            return null;
        }
    }

    /**
     * Create a new bank account
     */
    public async createBankAccount(data: CreateAccountRequest): Promise<Account | null> {
        try {
            const response = await accountApi.createAccount(data);
            return response;
        } catch (error) {
            logger.error({ error, data }, 'Failed to create bank account');
            return null;
        }
    }

    /**
     * Get an account by ID
     * @param id Account ID
     * @returns Account details or null if error occurs
     */
    public async getAccount(id: string): Promise<Account | null> {
        try {
            const response = await accountApi.getAccount(id);
            return response;
        } catch (error) {
            logger.error({ error, id }, 'Failed to retrieve account');
            return null;
        }
    }

    /**
     * Delete an account
     * @param id Account ID
     * @returns Success status or null if error occurs
     */
    public async deleteAccount(id: string): Promise<boolean> {
        try {
            await accountApi.deleteAccount(id);
            return true;
        } catch (error) {
            logger.error({ error, id }, 'Failed to delete account');
            return false;
        }
    }

    /**
     * Get available providers for account creation
     */
    public async getProviders(): Promise<Provider[] | null> {
        try {
            const response = await providerApi.getProviders({
                page: 1,
                limit: 20
            });
            return response.data;
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve providers');
            return null;
        }
    }

    /**
     * Format a bank account for display
     * @param account Account object
     * @returns Formatted account string
     */
    public formatBankAccount(account: Account): string {
        if (!account.bankAccount) {
            return 'No bank account information available.';
        }

        const bankAccount = account.bankAccount;

        let message = `🏦 *Bank Account*\n`;
        message += `Bank: ${bankAccount.bankName || 'Not specified'}\n`;

        // Format and mask account number for security
        const accountNumber = bankAccount.bankAccountNumber;
        const maskedNumber = accountNumber ?
            `XXXX-XXXX-${accountNumber.substring(Math.max(0, accountNumber.length - 4))}` :
            'Not specified';

        message += `Account: ${maskedNumber}\n`;
        message += `Type: ${formatBankAccountType(bankAccount.bankAccountType)}\n`;
        message += `Routing Number: XXXX${bankAccount.bankRoutingNumber.substring(Math.max(0, bankAccount.bankRoutingNumber.length - 4))}\n`;
        message += `Country: ${formatCountry(account.country || 'usa')}\n`;
        message += `Beneficiary: ${bankAccount.bankBeneficiaryName}\n`;

        if (bankAccount.swiftCode) {
            message += `SWIFT: ${bankAccount.swiftCode}\n`;
        }

        return message;
    }

    /**
     * Format a list of bank accounts for display
     * @param accounts List of accounts
     * @returns Formatted account list string
     */
    public formatBankAccountList(accounts: Account[]): string {
        if (!accounts || accounts.length === 0) {
            return 'You don\'t have any saved bank accounts yet.';
        }

        let message = '';
        accounts.forEach((account, index) => {
            if (!account.bankAccount) return;

            const bankName = account.bankAccount.bankName;
            const accountNumber = account.bankAccount.bankAccountNumber;
            const maskedNumber = accountNumber ?
                `XXXX${accountNumber.substring(Math.max(0, accountNumber.length - 4))}` :
                'Unknown';

            message += `${index + 1}. *${bankName}*\n`;
            message += `   💳 Account: ${maskedNumber}\n`;
            message += `   🔍 Type: ${formatBankAccountType(account.bankAccount.bankAccountType)}\n\n`;
        });

        return message;
    }
}

// Export default instance
export const accountService = new AccountService();
export default accountService; 