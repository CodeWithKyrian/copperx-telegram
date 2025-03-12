// src/api/wallet.api.ts
import { BalanceResponse, GenerateWalletRequest, Wallet, WalletBalance } from '../types/api.types';
import apiClient from './client';

/**
 * Wallet API service for handling wallet-related endpoints
 */
export class WalletApi {

    public async getWallets(): Promise<Wallet[]> {
        return apiClient.get<Wallet[]>('/api/wallets');
    }

    public async generateWallet(params: GenerateWalletRequest): Promise<Wallet> {
        return apiClient.post<Wallet>('/api/wallets', params);
    }

    public async getDefaultWallet(): Promise<Wallet> {
        return apiClient.get<Wallet>('/api/wallets/default');
    }

    public async setDefaultWallet(walletId: string): Promise<Wallet> {
        return apiClient.put<Wallet>('/api/wallets/default', { walletId });
    }

    public async getBalance(): Promise<BalanceResponse> {
        return apiClient.get<BalanceResponse>('/api/wallets/balance');
    }

    public async getWalletBalances(): Promise<WalletBalance[]> {
        return apiClient.get<WalletBalance[]>('/api/wallets/balances');
    }

    public async getSupportedNetworks(): Promise<string[]> {
        return apiClient.get<string[]>('/api/wallets/networks');
    }

    public async getTokenBalance(params: { chainId: string, token: string }): Promise<BalanceResponse> {
        return apiClient.get<BalanceResponse>(`/api/wallets/${params.chainId}/tokens/${params.token}/balance`);
    }
}

// Create and export default instance
export const walletApi = new WalletApi();
export default walletApi;