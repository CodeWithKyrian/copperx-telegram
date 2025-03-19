import { Encryption } from '../../src/utils/encryption.utils';

// Mock config
jest.mock('../../src/config', () => ({
    config: {
        app: {
            key: 'test-app-key-for-encryption-that-is-32-chars',
        },
    },
}));

describe('Encryption Utils', () => {
    // Store original console functions for restoration
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    beforeEach(() => {
        // Suppress console output during tests
        console.log = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        // Restore console functions
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    describe('encrypt and decrypt', () => {
        it('should encrypt and decrypt a string correctly', () => {
            const originalText = 'sensitive-token-data-12345';

            // Encrypt the text
            const encrypted = Encryption.encrypt(originalText);

            // Verify encrypted text is different from original
            expect(encrypted).not.toEqual(originalText);

            // Verify encrypted text contains IV separator
            expect(encrypted.includes(':')).toBeTruthy();

            // Decrypt the text
            const decrypted = Encryption.decrypt(encrypted);

            // Verify decryption returns the original text
            expect(decrypted).toEqual(originalText);
        });

        it('should encrypt and decrypt JSON objects correctly', () => {
            // Test with a complex object
            const originalObject = {
                token: 'abc123',
                userId: 12345,
                roles: ['admin', 'user'],
                metadata: {
                    lastLogin: '2023-01-01T00:00:00Z',
                    device: 'mobile'
                }
            };

            const originalJSON = JSON.stringify(originalObject);

            // Encrypt the JSON
            const encrypted = Encryption.encrypt(originalJSON);

            // Decrypt the text
            const decrypted = Encryption.decrypt(encrypted);

            // Parse back to object
            const decryptedObject = JSON.parse(decrypted);

            // Verify decryption returns the original object
            expect(decryptedObject).toEqual(originalObject);
        });

        it('should encrypt and decrypt empty strings correctly', () => {
            const originalText = '';

            // Encrypt the empty text
            const encrypted = Encryption.encrypt(originalText);

            // Verify encrypted text is not empty
            expect(encrypted).not.toEqual('');

            // Decrypt the text
            const decrypted = Encryption.decrypt(encrypted);

            // Verify decryption returns empty string
            expect(decrypted).toEqual(originalText);
        });

        it('should encrypt and decrypt long texts correctly', () => {
            // Create a long string (> 1KB)
            const longText = 'A'.repeat(5000);

            // Encrypt the long text
            const encrypted = Encryption.encrypt(longText);

            // Decrypt the text
            const decrypted = Encryption.decrypt(encrypted);

            // Verify decryption returns the original long text
            expect(decrypted).toEqual(longText);
            expect(decrypted.length).toBe(5000);
        });

        it('should encrypt and decrypt special characters correctly', () => {
            const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>/?`~\\';

            // Encrypt the text with special chars
            const encrypted = Encryption.encrypt(specialChars);

            // Decrypt the text
            const decrypted = Encryption.decrypt(encrypted);

            // Verify decryption returns the original text with special chars
            expect(decrypted).toEqual(specialChars);
        });

        it('should encrypt and decrypt non-ASCII characters correctly', () => {
            const nonAsciiText = '您好, こんにちは, привет, مرحبا, สวัสดี, 안녕하세요';

            // Encrypt the text with non-ASCII chars
            const encrypted = Encryption.encrypt(nonAsciiText);

            // Decrypt the text
            const decrypted = Encryption.decrypt(encrypted);

            // Verify decryption returns the original non-ASCII text
            expect(decrypted).toEqual(nonAsciiText);
        });

        it('should generate different ciphertexts for the same input due to random IV', () => {
            const originalText = 'same-text-to-encrypt';

            // Encrypt the same text twice
            const encrypted1 = Encryption.encrypt(originalText);
            const encrypted2 = Encryption.encrypt(originalText);

            // Verify that the two encrypted values are different
            expect(encrypted1).not.toEqual(encrypted2);

            // But both should decrypt to the same original text
            expect(Encryption.decrypt(encrypted1)).toEqual(originalText);
            expect(Encryption.decrypt(encrypted2)).toEqual(originalText);

            // Extract IVs and verify they're different
            const iv1 = encrypted1.split(':')[0];
            const iv2 = encrypted2.split(':')[0];
            expect(iv1).not.toEqual(iv2);
        });

        it('should throw an error when trying to decrypt invalid data', () => {
            const invalidEncrypted = 'invalid-format';

            // Attempt to decrypt invalid data should throw
            expect(() => {
                Encryption.decrypt(invalidEncrypted);
            }).toThrow('Invalid encrypted value format');
        });

        it('should throw an error when trying to decrypt with invalid IV format', () => {
            const invalidIV = 'not-hex:some-encrypted-data';

            // Attempt to decrypt with invalid IV should throw
            expect(() => {
                Encryption.decrypt(invalidIV);
            }).toThrow();
        });

        it('should throw an error when trying to decrypt tampered data', () => {
            const originalText = 'sensitive-data';

            // Encrypt the original text
            const encrypted = Encryption.encrypt(originalText);

            // Tamper with the encrypted part (after the IV)
            const parts = encrypted.split(':');
            const tamperedEncrypted = parts[0] + ':' + 'tampered-data';

            // Attempt to decrypt tampered data should throw
            expect(() => {
                Encryption.decrypt(tamperedEncrypted);
            }).toThrow();
        });
    });

    describe('generateAppKey', () => {
        it('should generate a valid app key', () => {
            const appKey = Encryption.generateAppKey();

            // Generated key should be a non-empty string
            expect(typeof appKey).toBe('string');
            expect(appKey.length).toBeGreaterThan(0);

            // Generated key should be a valid base64 string
            const base64Regex = /^[A-Za-z0-9+/=]+$/;
            expect(base64Regex.test(appKey)).toBeTruthy();
        });

        it('should generate key of sufficient length for AES-256', () => {
            const appKey = Encryption.generateAppKey();

            // Converting from base64 should yield at least 32 bytes (256 bits)
            const byteLength = Buffer.from(appKey, 'base64').length;
            expect(byteLength).toBeGreaterThanOrEqual(32);
        });

        it('should generate unique keys on each call', () => {
            const key1 = Encryption.generateAppKey();
            const key2 = Encryption.generateAppKey();
            const key3 = Encryption.generateAppKey();

            expect(key1).not.toEqual(key2);
            expect(key1).not.toEqual(key3);
            expect(key2).not.toEqual(key3);
        });
    });

    describe('encryption consistency', () => {
        it('should always decrypt to the same value regardless of IV', () => {
            const originalText = 'consistent-encryption-test';

            // Create multiple encryptions of the same text
            const encrypted1 = Encryption.encrypt(originalText);
            const encrypted2 = Encryption.encrypt(originalText);
            const encrypted3 = Encryption.encrypt(originalText);

            // Verify all decrypt to the original
            expect(Encryption.decrypt(encrypted1)).toBe(originalText);
            expect(Encryption.decrypt(encrypted2)).toBe(originalText);
            expect(Encryption.decrypt(encrypted3)).toBe(originalText);
        });
    });
}); 