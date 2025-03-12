import {
    TransferStatus,
    Page,
    TransferWithTransactionsOnly,
    CreateOfframpTransferRequest,
    CreateOnrampTransferRequest,
    CreateWalletWithdrawTransferRequest,
    CreateSendTransferRequest,
    CreateSendTransferBatchRequest,
    CreateSendTransferBatchResponse,
    CreateSolanaDepositTransferRequest,
    CreateBridgeTransferRequest,
    BridgeTransferBalances,
    TransferWithTransactions,
    Country,
    TransferType,
    TransferWithAccount,
} from '../types/api.types';
import apiClient from './client';

/**
 * Transfer API service for handling transfer-related endpoints
 */
export class TransferApi {
    public async getTransferStatus(transferId: string): Promise<TransferStatus> {
        return apiClient.get<TransferStatus>(`/api/transfers/${transferId}`);
    }

    public async getTransfers(params: {
        page?: number;
        limit?: number;
        sourceCountry?: Country;
        destinationCountry?: Country;
        status?: TransferStatus;
        sync?: boolean;
        type?: TransferType[];
        startDate?: Date;
        endDate?: Date;
    }): Promise<Page & { data: TransferWithTransactionsOnly[] }> {
        return apiClient.get<Page & { data: TransferWithTransactionsOnly[] }>('/api/transfers', { params });
    }

    public async createOfframpTransfer(data: CreateOfframpTransferRequest): Promise<TransferWithAccount> {
        return apiClient.post<TransferWithAccount>('/api/transfers/offramp', data);
    }

    public async createOnrampTransfer(data: CreateOnrampTransferRequest): Promise<TransferWithAccount> {
        return apiClient.post<TransferWithAccount>('/api/transfers/onramp', data);
    }

    public async createWalletWithdraw(data: CreateWalletWithdrawTransferRequest): Promise<TransferWithAccount> {
        return apiClient.post<TransferWithAccount>('/api/transfers/wallet-withdraw', data);
    }

    public async createSend(data: CreateSendTransferRequest): Promise<TransferWithAccount> {
        return apiClient.post<TransferWithAccount>('/api/transfers/send', data);
    }

    public async createSendBatch(data: CreateSendTransferBatchRequest): Promise<CreateSendTransferBatchResponse> {
        return apiClient.post<CreateSendTransferBatchResponse>('/api/transfers/send-batch', data);
    }

    public async createDepositTransfer(data: CreateSolanaDepositTransferRequest): Promise<TransferWithTransactionsOnly> {
        return apiClient.post<TransferWithTransactionsOnly>('/api/transfers/deposit', data);
    }

    public async createBridgeTransfer(data: CreateBridgeTransferRequest): Promise<TransferWithTransactionsOnly> {
        return apiClient.post<TransferWithTransactionsOnly>('/api/transfers/bridge', data);
    }

    public async getBalances(): Promise<BridgeTransferBalances> {
        return apiClient.get<BridgeTransferBalances>('/api/transfers/balances');
    }

    public async getTransfer(id: string): Promise<TransferWithTransactions> {
        return apiClient.get<TransferWithTransactions>(`/api/transfers/${id}`);
    }
}

export const transferApi = new TransferApi();
export default transferApi;