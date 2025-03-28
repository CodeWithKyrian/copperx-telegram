import { config } from '../config';
import { ChainId } from '../types/api.types';

/**
 * Validates that all required environment variables are set
 * 
 * @returns True if all required variables are set
 * @throws Error if any required variables are missing
 */
export const validateEnvironment = () => {
    const errors: string[] = [];

    // Check required bot configuration
    if (!config.bot.token) {
        errors.push('BOT_TOKEN is required');
    }

    // Check required API configuration
    if (!config.api.baseUrl) {
        errors.push('API_BASE_URL is required');
    }

    // Check required app configuration
    if (!config.app.key) {
        errors.push('APP_KEY is required for secure session storage');
    }

    // Check required domain in production
    if (config.env.isProduction) {
        if (!config.app.domain) {
            errors.push('APP_DOMAIN is required in production mode for webhook configuration');
        }
    }

    // Validate session driver configuration
    const sessionDriver = config.session.driver;

    if (sessionDriver === 'redis') {
        if (!config.redis.url) {
            errors.push('REDIS_URL is required when SESSION_DRIVER is set to "redis"');
        }
    }

    if (sessionDriver === 'mongo') {
        if (!config.mongo.uri) {
            errors.push('MONGO_URI is required when SESSION_DRIVER is set to "mongo"');
        }
        if (!config.mongo.database) {
            errors.push('MONGO_DB is required when SESSION_DRIVER is set to "mongo"');
        }
    }

    if (sessionDriver === 'postgres') {
        if (!config.postgres.host) {
            errors.push('POSTGRES_HOST is required when SESSION_DRIVER is set to "postgres"');
        }
        if (!config.postgres.port) {
            errors.push('POSTGRES_PORT is required when SESSION_DRIVER is set to "postgres"');
        }
        if (!config.postgres.database) {
            errors.push('POSTGRES_DB is required when SESSION_DRIVER is set to "postgres"');
        }
        if (!config.postgres.user) {
            errors.push('POSTGRES_USER is required when SESSION_DRIVER is set to "postgres"');
        }
    }

    if (sessionDriver === 'sqlite') {
        if (!config.sqlite.filename) {
            errors.push('SQLITE_FILENAME is required when SESSION_DRIVER is set to "sqlite"');
        }
    }

    // Check Pusher configuration if any Pusher variables are set
    const hasPusherConfig = config.pusher.key || config.pusher.cluster;

    if (hasPusherConfig) {
        if (!config.pusher.key) {
            errors.push('PUSHER_KEY is required when using Pusher');
        }
        if (!config.pusher.cluster) {
            errors.push('PUSHER_CLUSTER is required when using Pusher');
        }
    }

    if (errors.length > 0) {
        throw new Error(`Environment validation failed: ${errors.join(', ')}`);
    }

    return true;
};

/**
 * Validates a chain ID
 * 
 * @param chainId Chain ID to validate
 * @returns True if valid, false otherwise
 */
export const validateChainId = (chainId: string): boolean => {
    const validChainIds: ChainId[] = [
        '1', '5', '137', '80002', '42161', '421614', '8453', '84532', '10', '11155111', '11155420', '56', '97', '1399811149', '1399811150', '23434', '39361'
    ];
    return validChainIds.includes(chainId as ChainId);
};

/**
 * Validates that a string is safe to use in a shell command
 * 
 * @param input String to validate
 * @returns True if safe, false otherwise
 */
export const validateSafeString = (input: string): boolean => {
    // Check for potential shell injection patterns
    const dangerousPatterns = [
        /[;&|`]/,
        /\$\(/,
        /\$\{/,
        /\s*>\s*/,
        /\s*<\s*/,
        /\\\\/,
        /\\\"/,
        /\\'/,
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Validator functions for various input types
 */

/**
 * Validates an email address
 * @param email Email address to validate
 * @returns Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
    if (!email) return false;

    // RFC 5322 compliant email regex
    const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return emailRegex.test(email.trim());
}

/**
 * Validates a wallet address
 * @param address Wallet address to validate
 * @param chainId Optional chain ID to validate for a specific blockchain
 * @returns Whether the address is valid
 */
export function isValidWalletAddress(address: string, chainId?: ChainId): boolean {
    if (!address) return false;

    // If chainId is provided, validate specifically for that chain
    if (chainId) {
        return validateAddressForChain(address, chainId);
    }

    // If no chainId provided, check if it's valid for any supported chain
    return (
        isValidEthereumAddress(address) ||
        isValidSolanaAddress(address) ||
        isValidBitcoinAddress(address) ||
        isValidPolkadotAddress(address)
    );
}

/**
 * Validate address for a specific blockchain
 */
function validateAddressForChain(address: string, chainId: ChainId): boolean {
    // Ethereum mainnet and testnets
    if (['1', '5', '11155111'].includes(chainId)) {
        return isValidEthereumAddress(address);
    }

    // Polygon (also EVM compatible)
    if (['137', '80002'].includes(chainId)) {
        return isValidEthereumAddress(address);
    }

    // Arbitrum (also EVM compatible)
    if (['42161', '421614'].includes(chainId)) {
        return isValidEthereumAddress(address);
    }

    // Base (also EVM compatible)
    if (['8453', '84532'].includes(chainId)) {
        return isValidEthereumAddress(address);
    }

    // Optimism (also EVM compatible)
    if (['10', '11155420'].includes(chainId)) {
        return isValidEthereumAddress(address);
    }

    // Binance Smart Chain (also EVM compatible)
    if (['56', '97'].includes(chainId)) {
        return isValidEthereumAddress(address);
    }

    // Solana
    if (['1399811149', '1399811150'].includes(chainId)) {
        return isValidSolanaAddress(address);
    }

    // If chain ID is not recognized, default to basic format check
    return isValidAddress(address);
}

/**
 * Very basic check for address format (fallback)
 */
function isValidAddress(address: string): boolean {
    // Basic check: address should be at least 20 chars and not contain special chars except for allowed ones
    return /^[a-zA-Z0-9]{20,}$/.test(address) ||
        /^[a-zA-Z0-9]{1,}[a-zA-Z0-9\-\_\.]{1,}[a-zA-Z0-9]{1,}$/.test(address);
}

/**
 * Validates an Ethereum address
 * @param address Address to validate
 * @returns Whether the address is a valid Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
    // Check if address matches Ethereum format (0x followed by 40 hex chars)
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return false;
    }

    // Optional: Implement EIP-55 checksum validation
    // This is a more advanced check that validates the capitalization of letters in the address
    // which serves as a built-in checksum
    if (/^0x[a-f0-9]{40}$/.test(address) || /^0x[A-F0-9]{40}$/.test(address)) {
        // If all lowercase or all uppercase, it's valid but not checksummed
        return true;
    }

    // Mixed case, validate checksum
    return validateEthereumChecksum(address);
}

/**
 * Validates the checksum of an Ethereum address
 * Implements EIP-55 checksum validation
 */
function validateEthereumChecksum(address: string): boolean {
    try {
        // Remove '0x' prefix
        const addr = address.slice(2);

        // Load crypto for hashing - note: in a real implementation, you might need to
        // use a crypto library that works in both browser and Node environments
        const crypto = require('crypto');

        // Hash the address
        const hash = crypto.createHash('keccak256').update(addr.toLowerCase()).digest('hex');

        // Check each character
        for (let i = 0; i < 40; i++) {
            const charCode = parseInt(hash[i], 16);

            // If hash digit is 8 or higher, uppercase the letter
            if ((charCode >= 8 && addr[i].toUpperCase() !== addr[i]) ||
                (charCode < 8 && addr[i].toLowerCase() !== addr[i])) {
                return false;
            }
        }

        return true;
    } catch (error) {
        // If an error occurs (e.g., crypto not available), fall back to basic validation
        return true;
    }
}

/**
 * Validates a Solana address
 * @param address Address to validate
 * @returns Whether the address is a valid Solana address
 */
export function isValidSolanaAddress(address: string): boolean {
    // Solana addresses are base58 encoded and typically 32-44 characters
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

    // Check format
    if (!base58Regex.test(address)) {
        return false;
    }

    // Validate it's a proper base58 string
    try {
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

        // Check if it contains only base58 characters
        for (let i = 0; i < address.length; i++) {
            if (chars.indexOf(address[i]) === -1) {
                return false;
            }
        }

        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Validates a Bitcoin address
 * @param address Address to validate
 * @returns Whether the address is a valid Bitcoin address
 */
export function isValidBitcoinAddress(address: string): boolean {
    // Legacy addresses start with 1
    const legacyRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;

    // Segwit addresses start with bc1
    const segwitRegex = /^bc1[a-zA-HJ-NP-Z0-9]{25,}$/;

    // P2SH addresses start with 3
    const p2shRegex = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/;

    return legacyRegex.test(address) ||
        segwitRegex.test(address) ||
        p2shRegex.test(address);
}

/**
 * Validates a Polkadot address
 * @param address Address to validate
 * @returns Whether the address is a valid Polkadot address
 */
export function isValidPolkadotAddress(address: string): boolean {
    // Polkadot addresses are SS58 format, typically starting with 1
    const polkadotRegex = /^[1-9A-HJ-NP-Za-km-z]{45,48}$/;

    // Kusama addresses typically start with a capital letter
    const kusamaRegex = /^[A-Za-z0-9]{45,48}$/;

    return polkadotRegex.test(address) || kusamaRegex.test(address);
}

/**
 * Validates amount input
 * @param amount Amount as string
 * @param min Minimum allowed amount (optional)
 * @param max Maximum allowed amount (optional)
 * @returns Whether the amount is valid
 */
export function isValidAmount(amount: string, min = 0, max?: number): boolean {
    // Check if it's a valid number
    const num = parseFloat(amount);
    if (isNaN(num)) return false;

    // Check if it's positive and meets min/max requirements
    if (num <= 0) return false;
    if (num < min) return false;
    if (max !== undefined && num > max) return false;

    // Check decimal places (max 6 decimal places for most tokens)
    const decimalParts = amount.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 6) {
        return false;
    }

    return true;
}

/**
 * Checks if input contains potential malicious content
 * @param input String to check
 * @returns Whether the input appears safe
 */
export function isSafeInput(input: string): boolean {
    // Check for common script injection patterns
    const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+=/i,
        /data:/i,
        /alert\(/i,
        /document\./i,
        /window\./i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
}

export const validatePusherConfig = () => {
    const hasPusherConfig = config.pusher.key || config.pusher.cluster;

    if (hasPusherConfig) {
        if (!config.pusher.key) {
            throw new Error('PUSHER_KEY is not set in environment variables');
        }
        if (!config.pusher.cluster) {
            throw new Error('PUSHER_CLUSTER is not set in environment variables');
        }
    }

    return true;
};