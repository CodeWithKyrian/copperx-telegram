import { Encryption } from '../../src/utils/encryption.utils';

// Mock environment
jest.mock('../../src/config/environment', () => ({
    environment: {
        security: {
            appKey: 'test-app-key-for-encryption-that-is-32-chars',
        },
    },
}));

describe('Encryption Utils', () => {
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
        });

        it('should throw an error when trying to decrypt invalid data', () => {
            const invalidEncrypted = 'invalid-format';

            // Attempt to decrypt invalid data should throw
            expect(() => {
                Encryption.decrypt(invalidEncrypted);
            }).toThrow('Invalid encrypted value format');
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
    });
}); 