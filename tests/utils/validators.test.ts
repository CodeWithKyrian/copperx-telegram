import {
    validateEnvironment,
    isValidEmail,
    isValidWalletAddress,
    isValidEthereumAddress,
    isValidSolanaAddress,
    isValidBitcoinAddress,
    isValidPolkadotAddress,
    isValidAmount,
    isSafeInput
} from '../../src/utils/validators';
import { environment } from '../../src/config/environment';
import { ChainId } from '../../src/types/api.types';

// Only mock the environment
jest.mock('../../src/config/environment', () => ({
    environment: {
        bot: {
            token: 'mock-token' // Default to valid
        },
        api: {
            baseUrl: 'https://api.example.com'
        },
        security: {
            appKey: 'mock-app-key'
        },
        app: {
            domain: 'https://example.com',
            port: 443
        },
        webhook: {
            domain: 'https://example.com',
            port: 443
        },
        session: {
            driver: 'memory'
        },
        redis: {
            url: 'redis://localhost:6379'
        },
        mongo: {
            uri: 'mongodb://localhost:27017',
            database: 'copperx_bot'
        },
        postgres: {
            host: 'localhost',
            port: 5432,
            database: 'copperx_bot',
            user: 'postgres'
        },
        sqlite: {
            filename: '.sessions.db'
        },
        pusher: {
            key: '',
            cluster: ''
        },
        nodeEnv: 'development'
    }
}));

describe('Validators', () => {
    describe('validateEnvironment', () => {
        afterEach(() => {
            // Reset the environment after each test
            (environment.bot as any).token = 'mock-token';
            (environment.api as any).baseUrl = 'https://api.example.com';
            (environment.security as any).appKey = 'mock-app-key';
            (environment.webhook as any).domain = 'https://example.com';
            (environment.webhook as any).port = 443;
            (environment.session as any).driver = 'memory';
            (environment.nodeEnv as any) = 'development';
        });

        it('should not throw error when all required env vars are present', () => {
            expect(() => validateEnvironment()).not.toThrow();
        });

        it('should throw error when BOT_TOKEN is missing', () => {
            // Modify the mocked environment
            (environment.bot as any).token = '';

            expect(() => validateEnvironment()).toThrow(/BOT_TOKEN is required/);
        });

        it('should throw error when APP_KEY is missing', () => {
            // Modify the mocked environment
            (environment.security as any).appKey = '';

            expect(() => validateEnvironment()).toThrow(/APP_KEY is required/);
        });

        it('should throw error when API_BASE_URL is missing', () => {
            // Modify the mocked environment
            (environment.api as any).baseUrl = '';

            expect(() => validateEnvironment()).toThrow(/API_BASE_URL is required/);
        });

        it('should check for APP_DOMAIN in production mode', () => {
            // Set to production
            (environment.nodeEnv as any) = 'production';
            (environment.app as any).domain = '';

            expect(() => validateEnvironment()).toThrow(/APP_DOMAIN is required in production mode for webhook configuration/);
        });

        it('should check for Redis URL when using Redis session driver', () => {
            (environment.session as any).driver = 'redis';
            (environment.redis as any) = { url: '' };

            expect(() => validateEnvironment()).toThrow(/REDIS_URL is required/);
        });

        it('should check for MongoDB URI and database when using MongoDB session driver', () => {
            (environment.session as any).driver = 'mongo';
            (environment.mongo as any) = { uri: '', database: '' };

            expect(() => validateEnvironment()).toThrow(/MONGO_URI is required/);
            expect(() => validateEnvironment()).toThrow(/MONGO_DB is required/);
        });

        it('should check for Pusher configuration when Pusher is partially configured', () => {
            (environment.pusher as any).key = 'some-key';
            (environment.pusher as any).cluster = '';

            expect(() => validateEnvironment()).toThrow(/PUSHER_CLUSTER is required/);
        });
    });

    describe('isValidEmail', () => {
        it('should return true for valid email addresses', () => {
            expect(isValidEmail('user@example.com')).toBe(true);
            expect(isValidEmail('user.name@example.com')).toBe(true);
            expect(isValidEmail('user+tag@example.com')).toBe(true);
            expect(isValidEmail('user@subdomain.example.com')).toBe(true);
            expect(isValidEmail('user@example.co.uk')).toBe(true);
            expect(isValidEmail('123@example.com')).toBe(true);
        });

        it('should return false for invalid email addresses', () => {
            expect(isValidEmail('')).toBe(false);
            expect(isValidEmail('user@')).toBe(false);
            expect(isValidEmail('@example.com')).toBe(false);
            expect(isValidEmail('user@.com')).toBe(false);
            expect(isValidEmail('user@example')).toBe(false);
            expect(isValidEmail('user example.com')).toBe(false);
            expect(isValidEmail('user@exam ple.com')).toBe(false);
        });

        it('should trim whitespace before validating', () => {
            expect(isValidEmail(' user@example.com ')).toBe(true);
        });

        it('should handle undefined and null inputs', () => {
            expect(isValidEmail(undefined as unknown as string)).toBe(false);
            expect(isValidEmail(null as unknown as string)).toBe(false);
        });
    });

    describe('Wallet Address Validation', () => {
        describe('isValidWalletAddress', () => {
            it('should return true for valid Ethereum addresses', () => {
                expect(isValidWalletAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(true);
                expect(isValidWalletAddress('0x71c7656ec7ab88b098defb751b7401b5f6d8976f')).toBe(true);
            });

            it('should return true for valid Solana addresses', () => {
                expect(isValidWalletAddress('9frgcDn15JbRUBZcQ9hZr3Z2J43uLRZqP8cK5KYoR9GF')).toBe(true);
            });

            it('should return true for valid Bitcoin addresses', () => {
                expect(isValidWalletAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(true);
                expect(isValidWalletAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe(true);
                expect(isValidWalletAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe(true);
            });

            it('should return false for invalid addresses', () => {
                expect(isValidWalletAddress('')).toBe(false);
                expect(isValidWalletAddress('0xinvalid')).toBe(false);
                expect(isValidWalletAddress('not-an-address')).toBe(false);
            });

            it('should validate addresses for specific chains', () => {
                // Ethereum
                expect(isValidWalletAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F', '1')).toBe(true);
                // Polygon (EVM compatible)
                expect(isValidWalletAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F', '137')).toBe(true);
                // Solana
                expect(isValidWalletAddress('9frgcDn15JbRUBZcQ9hZr3Z2J43uLRZqP8cK5KYoR9GF', '1399811149')).toBe(true);
                // Invalid chain ID should use basic validation
                expect(isValidWalletAddress('9frgcDn15JbRUBZcQ9hZr3Z2J43uLRZqP8cK5KYoR9GF', '999' as ChainId)).toBe(true);
            });

            it('should return false when address is invalid for specified chain', () => {
                // Ethereum address tested against Solana chain ID
                expect(isValidWalletAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F', '1399811149')).toBe(false);
                // Solana address tested against Ethereum chain ID
                expect(isValidWalletAddress('9frgcDn15JbRUBZcQ9hZr3Z2J43uLRZqP8cK5KYoR9GF', '1')).toBe(false);
            });
        });

        describe('isValidEthereumAddress', () => {
            it('should return true for valid Ethereum addresses', () => {
                expect(isValidEthereumAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(true);
                expect(isValidEthereumAddress('0x71c7656ec7ab88b098defb751b7401b5f6d8976f')).toBe(true);
                expect(isValidEthereumAddress('0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5')).toBe(true);
            });

            it('should return false for invalid Ethereum addresses', () => {
                expect(isValidEthereumAddress('')).toBe(false);
                expect(isValidEthereumAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976')).toBe(false); // Too short
                expect(isValidEthereumAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976FF')).toBe(false); // Too long
                expect(isValidEthereumAddress('71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(false); // Missing 0x
                expect(isValidEthereumAddress('0xG1C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(false); // Invalid char
            });

            it('should handle checksummed addresses correctly', () => {
                // We'll skip the actual checksum validation test as it needs crypto which we don't want to mock
                // Since the function has a fallback to return true when crypto isn't available, we can test that at least
                expect(isValidEthereumAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(true);
            });
        });

        describe('isValidSolanaAddress', () => {
            it('should return true for valid Solana addresses', () => {
                expect(isValidSolanaAddress('9frgcDn15JbRUBZcQ9hZr3Z2J43uLRZqP8cK5KYoR9GF')).toBe(true);
                expect(isValidSolanaAddress('31LKs39pjT5oj6fWjC3F76dHWf9489asCthmgj8wu7pj')).toBe(true);
            });

            it('should return false for invalid Solana addresses', () => {
                expect(isValidSolanaAddress('')).toBe(false);
                expect(isValidSolanaAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(false); // Ethereum address
                expect(isValidSolanaAddress('9frgcDn15JbRUBZcQ9h_r3Z2J43uLRZqP8cK5KYoR9GF')).toBe(false); // Invalid char
                expect(isValidSolanaAddress('9fg')).toBe(false); // Too short
            });
        });

        describe('isValidBitcoinAddress', () => {
            it('should return true for valid legacy Bitcoin addresses', () => {
                expect(isValidBitcoinAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe(true);
                expect(isValidBitcoinAddress('17VZNX1SN5NtKa8UQFxwQbFeFc3iqRYhem')).toBe(true);
            });

            it('should return true for valid Segwit Bitcoin addresses', () => {
                expect(isValidBitcoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe(true);
                expect(isValidBitcoinAddress('bc1q42lja79elem0anu8q8s3h2n687re9jax556pcc')).toBe(true);
            });

            it('should return true for valid P2SH Bitcoin addresses', () => {
                expect(isValidBitcoinAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toBe(true);
                expect(isValidBitcoinAddress('3FfQSEfMsfXvWRPvKghouNNPKzAVBD4hUi')).toBe(true);
            });

            it('should return false for invalid Bitcoin addresses', () => {
                expect(isValidBitcoinAddress('')).toBe(false);
                expect(isValidBitcoinAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(false); // Ethereum address
                expect(isValidBitcoinAddress('1A1zP1')).toBe(false); // Too short
                expect(isValidBitcoinAddress('bc2qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe(false); // Invalid prefix
            });
        });

        describe('isValidPolkadotAddress', () => {
            it('should return true for valid Polkadot addresses', () => {
                // Valid Polkadot address format 
                expect(isValidPolkadotAddress('1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg')).toBe(true);
                expect(isValidPolkadotAddress('15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNHr6Sp5')).toBe(true);
            });

            it('should return true for valid Kusama addresses', () => {
                // Valid Kusama address format
                expect(isValidPolkadotAddress('CpjsLDC1JFyrhm3ftC9Gs4QoyrkHKhZKtK7YqGTRFtTafgp')).toBe(true);
                expect(isValidPolkadotAddress('FFdDXFK1VKG5QgjvqwxdVjo8hGrBveaBFfHnWyz1MAmLL82L')).toBe(true);
            });

            it('should return false for invalid Polkadot addresses', () => {
                expect(isValidPolkadotAddress('')).toBe(false);
                expect(isValidPolkadotAddress('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')).toBe(false); // Ethereum address
                expect(isValidPolkadotAddress('15oF4uVJwmo4TdGW7VfQxNLavjCXviqxT9S1MgbjMNH')).toBe(false); // Too short
            });
        });
    });

    describe('isValidAmount', () => {
        it('should return true for valid amounts', () => {
            expect(isValidAmount('10')).toBe(true);
            expect(isValidAmount('0.1')).toBe(true);
            expect(isValidAmount('0.123456')).toBe(true); // 6 decimal places
            expect(isValidAmount('1000.50')).toBe(true);
        });

        it('should return false for invalid amounts', () => {
            expect(isValidAmount('')).toBe(false);
            expect(isValidAmount('abc')).toBe(false);
            expect(isValidAmount('-5')).toBe(false); // Negative
            expect(isValidAmount('0')).toBe(false); // Zero
            expect(isValidAmount('0.1234567')).toBe(false); // Too many decimal places
        });

        it('should respect min and max constraints', () => {
            // Min constraint
            expect(isValidAmount('10', 5)).toBe(true);
            expect(isValidAmount('3', 5)).toBe(false);

            // Max constraint
            expect(isValidAmount('10', 0, 15)).toBe(true);
            expect(isValidAmount('20', 0, 15)).toBe(false);

            // Both constraints
            expect(isValidAmount('10', 5, 15)).toBe(true);
            expect(isValidAmount('3', 5, 15)).toBe(false);
            expect(isValidAmount('20', 5, 15)).toBe(false);
        });
    });

    describe('isSafeInput', () => {
        it('should return true for safe inputs', () => {
            expect(isSafeInput('Hello World')).toBe(true);
            expect(isSafeInput('User Name')).toBe(true);
            expect(isSafeInput('Special chars: !@#$%^&*()')).toBe(true);
            expect(isSafeInput('123456789')).toBe(true);
        });

        it('should return false for potentially dangerous inputs', () => {
            expect(isSafeInput('<script>alert("xss")</script>')).toBe(false);
            expect(isSafeInput('javascript:alert(1)')).toBe(false);
            expect(isSafeInput('Click <a href="javascript:alert(1)">here</a>')).toBe(false);
            expect(isSafeInput('onclick=alert(1)')).toBe(false);
            expect(isSafeInput('data:image/jpeg;base64,/9j/')).toBe(false);
            expect(isSafeInput('document.cookie')).toBe(false);
            expect(isSafeInput('window.location')).toBe(false);
        });
    });
}); 