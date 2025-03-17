import { ChainId } from '../types/api.types';

/**
 * Interface for chain information
 */
export interface ChainInfo {
    name: string;           // Human-readable name
    fullName: string;       // Full network name
    isTestnet: boolean;     // Whether this is a testnet
    explorerUrl: string;    // Block explorer URL
    logoUrl?: string;       // Logo URL (optional)
}

/**
 * Mapping of chain IDs to their information
 */
export const CHAIN_INFO: Record<ChainId, ChainInfo> = {
    // Ethereum
    '1': {
        name: 'Ethereum',
        fullName: 'Ethereum Mainnet',
        isTestnet: false,
        explorerUrl: 'https://etherscan.io',
        logoUrl: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/13c43/eth-diamond-black.png'
    },
    '5': {
        name: 'Goerli',
        fullName: 'Goerli Testnet',
        isTestnet: true,
        explorerUrl: 'https://goerli.etherscan.io'
    },
    '11155111': {
        name: 'Sepolia',
        fullName: 'Sepolia Testnet',
        isTestnet: true,
        explorerUrl: 'https://sepolia.etherscan.io'
    },

    // Polygon
    '137': {
        name: 'Polygon',
        fullName: 'Polygon Mainnet',
        isTestnet: false,
        explorerUrl: 'https://polygonscan.com',
        logoUrl: 'https://polygon.technology/favicon.ico'
    },
    '80002': {
        name: 'Polygon Amoy',
        fullName: 'Polygon Amoy Testnet',
        isTestnet: true,
        explorerUrl: 'https://amoy.polygonscan.com'
    },

    // Arbitrum
    '42161': {
        name: 'Arbitrum',
        fullName: 'Arbitrum One',
        isTestnet: false,
        explorerUrl: 'https://arbiscan.io',
        logoUrl: 'https://arbitrum.io/favicon.ico'
    },
    '421614': {
        name: 'Arbitrum Sepolia',
        fullName: 'Arbitrum Sepolia Testnet',
        isTestnet: true,
        explorerUrl: 'https://sepolia.arbiscan.io'
    },

    // Base
    '8453': {
        name: 'Base',
        fullName: 'Base Mainnet',
        isTestnet: false,
        explorerUrl: 'https://basescan.org',
        logoUrl: 'https://base.org/favicon.ico'
    },
    '84532': {
        name: 'Base Sepolia',
        fullName: 'Base Sepolia Testnet',
        isTestnet: true,
        explorerUrl: 'https://sepolia.basescan.org'
    },

    // Optimism
    '10': {
        name: 'Optimism',
        fullName: 'Optimism Mainnet',
        isTestnet: false,
        explorerUrl: 'https://optimistic.etherscan.io',
        logoUrl: 'https://optimism.io/favicon.ico'
    },
    '11155420': {
        name: 'Optimism Sepolia',
        fullName: 'Optimism Sepolia Testnet',
        isTestnet: true,
        explorerUrl: 'https://sepolia-optimism.etherscan.io'
    },

    // Binance Smart Chain
    '56': {
        name: 'BSC',
        fullName: 'BNB Smart Chain',
        isTestnet: false,
        explorerUrl: 'https://bscscan.com',
        logoUrl: 'https://bscscan.com/favicon.ico'
    },
    '97': {
        name: 'BSC Testnet',
        fullName: 'BNB Smart Chain Testnet',
        isTestnet: true,
        explorerUrl: 'https://testnet.bscscan.com'
    },

    // Solana
    '1399811149': {
        name: 'Solana',
        fullName: 'Solana Mainnet',
        isTestnet: false,
        explorerUrl: 'https://explorer.solana.com',
        logoUrl: 'https://solana.com/favicon.ico'
    },
    '1399811150': {
        name: 'Solana Testnet',
        fullName: 'Solana Testnet',
        isTestnet: true,
        explorerUrl: 'https://explorer.solana.com/?cluster=testnet'
    },

    // Avalanche
    '23434': {
        name: 'Starknet',
        fullName: 'Starknet Mainnet',
        isTestnet: false,
        explorerUrl: 'https://starknet.io',
        logoUrl: 'https://starknet.io/favicon.ico'
    },
    '39361': {
        name: 'Starknet Sepolia',
        fullName: 'Starknet Sepolia Testnet',
        isTestnet: true,
        explorerUrl: 'https://testnet.starknet.io'
    }
};

/**
 * Gets the human-readable network name for a chain ID
 * @param chainId Chain ID
 * @param useFull Whether to use the full name
 * @returns Network name or the chain ID if not found
 */
export function getNetworkName(chainId: string | undefined, useFull = false): string {
    if (!chainId) return 'Unknown Network';

    const chainInfo = CHAIN_INFO[chainId as ChainId];
    if (!chainInfo) return chainId; // Fallback to chain ID if not found

    return useFull ? chainInfo.fullName : chainInfo.name;
}

/**
 * Gets the chain ID for a network name
 * @param networkName Network name to look up
 * @returns Chain ID or undefined if not found
 */
export function getChainId(networkName: string): ChainId | undefined {
    const normalizedName = networkName.toLowerCase().trim();

    for (const [chainId, info] of Object.entries(CHAIN_INFO)) {
        if (
            info.name.toLowerCase() === normalizedName ||
            info.fullName.toLowerCase() === normalizedName
        ) {
            return chainId as ChainId;
        }
    }

    return undefined;
}

/**
 * Gets the block explorer URL for a transaction on a specific chain
 * @param chainId Chain ID
 * @param txHash Transaction hash
 * @returns Explorer URL for the transaction
 */
export function getExplorerTxUrl(chainId: string, txHash: string): string {
    const chainInfo = CHAIN_INFO[chainId as ChainId];
    if (!chainInfo) return '';

    return `${chainInfo.explorerUrl}/tx/${txHash}`;
}

/**
 * Gets the block explorer URL for an address on a specific chain
 * @param chainId Chain ID
 * @param address Wallet address
 * @returns Explorer URL for the address
 */
export function getExplorerAddressUrl(chainId: string, address: string): string {
    const chainInfo = CHAIN_INFO[chainId as ChainId];
    if (!chainInfo) return '';

    return `${chainInfo.explorerUrl}/address/${address}`;
}

/**
 * Formats a network name for display, with optional testnet indicator
 * @param chainId Chain ID
 * @param showTestnet Whether to show testnet indicator
 * @returns Formatted network name
 */
export function formatNetworkName(chainId: string | undefined, showTestnet = true): string {
    if (!chainId) return 'Unknown Network';

    const chainInfo = CHAIN_INFO[chainId as ChainId];
    if (!chainInfo) return chainId; // Fallback to chain ID if not found

    return chainInfo.name + (showTestnet && chainInfo.isTestnet ? ' (Testnet)' : '');
} 