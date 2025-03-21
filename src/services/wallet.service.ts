import { walletApi } from '../api/wallet.api';
import { Wallet, WalletBalance, BalanceResponse, GenerateWalletRequest } from '../types/api.types';
import logger from '../utils/logger.utils';

/**
 * Service for managing wallet operations
 */
export class WalletService {
    /**
     * Retrieves all wallets for the authenticated user
     * @returns Array of wallets or null if error occurs
     */
    public async getWallets(): Promise<Wallet[] | null> {
        try {
            const wallets = await walletApi.getWallets();
            return wallets;
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve wallets');
            return null;
        }
    }

    /**
     * Retrieves a specific wallet by ID
     * @param walletId The ID of the wallet to retrieve
     * @returns Wallet or null if not found or error occurs
     */
    public async getWalletById(walletId: string): Promise<Wallet | null> {
        try {
            const wallets = await this.getWallets();
            if (!wallets) return null;

            return wallets.find(wallet => wallet.id === walletId) || null;
        } catch (error) {
            logger.error({ error, walletId }, 'Failed to retrieve wallet by ID');
            return null;
        }
    }

    /**
     * Retrieves the default wallet for the authenticated user
     * @returns Default wallet or null if error occurs
     */
    public async getDefaultWallet(): Promise<Wallet | null> {
        try {
            const wallet = await walletApi.getDefaultWallet();
            return wallet;
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve default wallet');
            return null;
        }
    }

    /**
     * Sets a wallet as the default wallet
     * @param walletId ID of the wallet to set as default
     * @returns Updated wallet or null if error occurs
     */
    public async setDefaultWallet(walletId: string): Promise<Wallet | null> {
        try {
            const wallet = await walletApi.setDefaultWallet(walletId);
            return wallet;
        } catch (error) {
            logger.error({ error, walletId }, 'Failed to set default wallet');
            return null;
        }
    }

    /**
     * Generates a new wallet for the authenticated user
     * @param params Parameters for wallet generation
     * @returns Newly created wallet or null if error occurs
     */
    public async generateWallet(params: GenerateWalletRequest): Promise<Wallet | null> {
        try {
            const wallet = await walletApi.generateWallet(params);
            return wallet;
        } catch (error) {
            logger.error({ error, params }, 'Failed to generate wallet');
            return null;
        }
    }

    public async getDefaultWalletBalance(): Promise<BalanceResponse | null> {
        try {
            const balance = await walletApi.getBalance();
            return balance;
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve default wallet balance');
            return null;
        }
    }

    /**
     * Retrieves all wallet balances for the authenticated user
     * @returns Array of wallet balances or null if error occurs
     */
    public async getWalletBalances(): Promise<WalletBalance[] | null> {
        try {
            const balances = await walletApi.getWalletBalances();
            return balances;
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve wallet balances');
            return null;
        }
    }

    /**
     * Gets the total balance across all wallets
     * @returns Object containing total balance or null if error occurs
     */
    public async getTotalBalance(): Promise<BalanceResponse | null> {
        try {
            const balance = await walletApi.getBalance();
            return balance;
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve total balance');
            return null;
        }
    }

    /**
     * Gets the list of supported networks for wallets
     * @returns Array of supported network names or null if error occurs
     */
    public async getSupportedNetworks(): Promise<string[] | null> {
        try {
            const networks = await walletApi.getSupportedNetworks();
            return networks;
        } catch (error) {
            logger.error({ error }, 'Failed to retrieve supported networks');
            return null;
        }
    }
}

// Create and export instance
export const walletService = new WalletService();
export default walletService;