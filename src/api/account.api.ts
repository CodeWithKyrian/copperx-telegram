import { Account, ListResponse, CreateAccountRequest, SuccessResponse, SubmitPermitRequest, SubmitPermitResponse, Wallet } from '../types/api.types';
import apiClient from './client';


export class AccountApi {
    public async getAccounts(): Promise<ListResponse<Account>> {
        return apiClient.get<ListResponse<Account>>('/api/accounts');
    }

    public async createAccount(params: CreateAccountRequest): Promise<Account> {
        return apiClient.post<Account>('/api/accounts', params);
    }

    public async getAccount(id: string): Promise<Account> {
        return apiClient.get<Account>(`/api/accounts/${id}`);
    }

    public async deleteAccount(id: string): Promise<SuccessResponse> {
        return apiClient.delete<SuccessResponse>(`/api/accounts/${id}`);
    }

    public async submitPermit(id: string, params: SubmitPermitRequest): Promise<SubmitPermitResponse> {
        return apiClient.post<SubmitPermitResponse>(`/api/accounts/${id}/submit-permit`, params);
    }

    public async renewApproval(id: string): Promise<SubmitPermitResponse> {
        return apiClient.post<SubmitPermitResponse>(`/api/accounts/${id}/renew-approval`);
    }

    public async newAccountInfo(): Promise<Wallet> {
        return apiClient.post<Wallet>(`/api/accounts/new-wallet`);
    }

    public async migrateAccount(): Promise<SubmitPermitResponse> {
        return apiClient.post<SubmitPermitResponse>(`/api/accounts/migrate-account`);
    }

}

export const accountApi = new AccountApi();
export default accountApi;