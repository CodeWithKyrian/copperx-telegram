import { config } from '../../src/config';

describe('Config Configuration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.resetModules();
        process.env = { ...originalEnv };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('should use default values when environment variables are not set', () => {
        // Arrange
        delete process.env.BOT_TOKEN;
        delete process.env.SESSION_DRIVER;

        // Act & Assert - these should use default values
        expect(config.session.driver).toBe('memory');
        expect(config.api.baseUrl).toBe('https://income-api.copperx.io');
    });

    it('should use environment variables when set', () => {
        // Arrange
        process.env.BOT_TOKEN = 'test-token';
        process.env.SESSION_DRIVER = 'redis';
        process.env.API_BASE_URL = 'https://test.example.com';

        // We need to re-import the module to pick up new env vars
        jest.resetModules();
        const { config: refreshedConfig } = require('../../src/config');

        // Act & Assert
        expect(refreshedConfig.bot.token).toBe('test-token');
        expect(refreshedConfig.session.driver).toBe('redis');
        expect(refreshedConfig.api.baseUrl).toBe('https://test.example.com');
    });

    it('should properly structure environment flags under env', () => {
        // Test development environment
        process.env.NODE_ENV = 'development';
        jest.resetModules();
        const { config: devConfig } = require('../../src/config');

        expect(devConfig.env.isDevelopment).toBe(true);
        expect(devConfig.env.isProduction).toBe(false);
        expect(devConfig.env.isTest).toBe(false);
        expect(devConfig.nodeEnv).toBe('development');

        // Test production environment
        process.env.NODE_ENV = 'production';
        jest.resetModules();
        const { config: prodConfig } = require('../../src/config');

        expect(prodConfig.env.isDevelopment).toBe(false);
        expect(prodConfig.env.isProduction).toBe(true);
        expect(prodConfig.env.isTest).toBe(false);
        expect(prodConfig.nodeEnv).toBe('production');
    });
});