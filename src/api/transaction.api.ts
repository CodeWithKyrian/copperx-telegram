import {
    PaginatedResponse,
    TransactionWithAccount,
} from '../types/api.types';
import apiClient from './client';

export interface GetTransactionsParams {
    page?: number;
    limit?: number;
    transferId?: string;
    kycId?: string;
}

export class TransactionApi {
    public async getTransactions(params: GetTransactionsParams): Promise<PaginatedResponse<TransactionWithAccount>> {
        return apiClient.get<PaginatedResponse<TransactionWithAccount>>('/api/transactions', { params });
    }

    /**
     * Retrieves a specific transaction by its ID.
     * @param id - The ID of the transaction to retrieve.
     * @returns A Promise that resolves to a TransactionWithAccount object.
     * @throws An error if the API request fails.
     */
    public async getTransaction(id: string): Promise<TransactionWithAccount> {
        return apiClient.get<TransactionWithAccount>(`/api/transactions/${id}`);
    }

    /**
     * Confirms a bank transfer for a specific transaction ID.
     * This does not guarantee the money is actually deposited.
     * @param id - The ID of the transaction to confirm the bank transfer for.
     * @returns A Promise that resolves to a SuccessDto object.
     * @throws An error if the API request fails.
     */
    public async confirmBankTransfer(id: string): Promise<{ success: boolean }> {
        return apiClient.post<{ success: boolean }>(`/api/transactions/${id}/confirm-bank-transfer`);
    }
}

const transactionApi = new TransactionApi();
export default transactionApi;