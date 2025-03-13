const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Mock crypto.randomBytes
jest.mock('crypto', () => {
    return {
        randomBytes: jest.fn(),
    };
});

// Mock console.log
console.log = jest.fn();

describe('Generate App Key Script', () => {
    let originalRandomBytes;

    beforeEach(() => {
        // Clear console mock
        console.log.mockClear();

        // Store original randomBytes implementation
        originalRandomBytes = crypto.randomBytes;

        // Mock randomBytes to return predictable value
        crypto.randomBytes.mockImplementation((size) => {
            return Buffer.from('a'.repeat(size));
        });
    });

    afterEach(() => {
        // Restore original randomBytes implementation
        crypto.randomBytes = originalRandomBytes;
    });

    it('should generate a valid app key', () => {
        // Load and execute the script
        const scriptPath = path.resolve(__dirname, '../../scripts/generate-app-key.js');
        require(scriptPath);

        // Check that crypto.randomBytes was called with correct size
        expect(crypto.randomBytes).toHaveBeenCalledWith(32);

        // Check that console.log was called with expected output
        expect(console.log).toHaveBeenCalledWith('Generated APP_KEY:');

        // The second call should have the base64 encoded key
        const expectedKey = Buffer.from('a'.repeat(32)).toString('base64');
        expect(console.log).toHaveBeenCalledWith(expectedKey);

        // Check instructions were logged
        expect(console.log).toHaveBeenCalledWith('\nAdd this to your .env file:');
        expect(console.log).toHaveBeenCalledWith(`APP_KEY="${expectedKey}"`);
    });
}); 