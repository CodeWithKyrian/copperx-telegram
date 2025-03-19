import * as crypto from 'crypto';
import { config } from '../config';

/**
 * Provides encryption and decryption functionality for sensitive data
 */
export class Encryption {
    // Key size for AES-256-CBC algorithm
    private static readonly KEY_SIZE = 32; // 256 bits
    private static readonly IV_SIZE = 16;  // 128 bits
    private static readonly ALGORITHM = 'aes-256-cbc';

    /**
     * Encrypts data using the application key
     * @param value Data to encrypt
     * @returns Encrypted data with IV prepended
     */
    public static encrypt(value: string): string {
        if (!config.app.key) {
            throw new Error('APP_KEY is not set in environment variables');
        }

        // Derive a key from the APP_KEY
        const key = this.deriveKeyFromAppKey(config.app.key);

        // Generate a random IV
        const iv = crypto.randomBytes(this.IV_SIZE);

        // Create cipher with key and IV
        const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

        // Encrypt the data
        let encrypted = cipher.update(value, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        // Prepend IV to the encrypted data for use in decryption
        const ivHex = iv.toString('hex');

        // Return IV + encrypted data
        return `${ivHex}:${encrypted}`;
    }

    /**
     * Decrypts data that was encrypted with the encrypt method
     * @param encryptedValue The encrypted data with IV prepended
     * @returns The original decrypted data
     */
    public static decrypt(encryptedValue: string): string {
        if (!config.app.key) {
            throw new Error('APP_KEY is not set in environment variables');
        }

        // Derive the key from APP_KEY
        const key = this.deriveKeyFromAppKey(config.app.key);

        // Split the IV and encrypted data
        const [ivHex, encryptedData] = encryptedValue.split(':');

        if (!ivHex || !encryptedData) {
            throw new Error('Invalid encrypted value format');
        }

        // Convert IV back to Buffer
        const iv = Buffer.from(ivHex, 'hex');

        // Create decipher
        const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);

        // Decrypt the data
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Derives a fixed-length key from the application key
     * @param appKey The application key
     * @returns A fixed-length key suitable for AES-256
     */
    private static deriveKeyFromAppKey(appKey: string): Buffer {
        return crypto.createHash('sha256')
            .update(appKey)
            .digest()
            .slice(0, this.KEY_SIZE);
    }

    /**
     * Generates a random application key
     * @returns A secure random key suitable for use as APP_KEY
     */
    public static generateAppKey(): string {
        return crypto.randomBytes(32).toString('base64');
    }
} 