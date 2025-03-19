import { Wallet, WalletBalance, BalanceResponse } from '../../src/types/api.types';

// Mock wallets
export const mockWallet: Wallet = {
    id: 'wallet-123',
    createdAt: '2024-03-15T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    walletType: 'web3_auth_copperx',
    network: 'ethereum',
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    isDefault: false
};

export const mockDefaultWallet: Wallet = {
    id: 'wallet-456',
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    walletType: 'web3_auth_copperx',
    network: 'polygon',
    walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    isDefault: true
};

export const mockSolanaWallet: Wallet = {
    id: 'wallet-789',
    createdAt: '2024-03-12T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    walletType: 'web3_auth_copperx',
    network: 'solana',
    walletAddress: 'SoLANaWaLLetadDreSS123456789abcdefghijklmnopqrstuv',
    isDefault: false
};

export const mockWalletWithoutAddress: Wallet = {
    id: 'wallet-789',
    createdAt: '2024-03-12T10:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
    walletType: 'web3_auth_copperx',
    network: 'solana',
    walletAddress: undefined,
    isDefault: false
};

// List of mock wallets
export const mockWallets: Wallet[] = [
    mockWallet,
    mockDefaultWallet,
    mockSolanaWallet,
];

// Mock balance responses
export const mockUSDCBalance: BalanceResponse = {
    decimals: 6,
    balance: '1000000000', // 1000 USDC with 6 decimals
    symbol: 'USDC',
    address: '0xusdc_contract_address'
};

export const mockUSDTBalance: BalanceResponse = {
    decimals: 6,
    balance: '500000000', // 500 USDT with 6 decimals
    symbol: 'USDT',
    address: '0xusdt_contract_address'
};

export const mockETHBalance: BalanceResponse = {
    decimals: 18,
    balance: '1000000000000000000', // 1 ETH with 18 decimals
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000'
};

// Mock wallet balances
export const mockWalletBalance: WalletBalance = {
    walletId: mockWallet.id,
    isDefault: mockWallet.isDefault || false,
    network: mockWallet.network || 'ethereum',
    balances: [mockUSDCBalance, mockETHBalance]
};

export const mockDefaultWalletBalance: WalletBalance = {
    walletId: mockDefaultWallet.id,
    isDefault: mockDefaultWallet.isDefault || false,
    network: mockDefaultWallet.network || 'polygon',
    balances: [mockUSDCBalance, mockUSDTBalance]
};

export const mockSolanaWalletBalance: WalletBalance = {
    walletId: mockSolanaWallet.id,
    isDefault: mockSolanaWallet.isDefault || false,
    network: mockSolanaWallet.network || 'solana',
    balances: [mockUSDCBalance]
};

// List of mock wallet balances
export const mockWalletBalances: WalletBalance[] = [
    mockWalletBalance,
    mockDefaultWalletBalance,
    mockSolanaWalletBalance
];

// Mock networks
export const mockSupportedNetworks: string[] = [
    'ethereum',
    'polygon',
    'solana',
    'optimism',
    'arbitrum'
]; 