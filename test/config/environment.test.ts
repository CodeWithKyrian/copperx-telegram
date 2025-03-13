import { environment } from '../../src/config/environment';

describe('Environment Configuration', () => {
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
        expect(environment.session.driver).toBe('memory');
        expect(environment.api.baseUrl).toBe('https://income-api.copperx.io');
    });

    it('should use environment variables when set', () => {
        // Arrange
        process.env.BOT_TOKEN = 'test-token';
        process.env.SESSION_DRIVER = 'redis';
        process.env.API_BASE_URL = 'https://test.example.com/api';

        // We need to re-import the module to pick up new env vars
        jest.resetModules();
        const { environment: refreshedEnv } = require('../../src/config/environment');

        // Act & Assert
        expect(refreshedEnv.bot.token).toBe('test-token');
        expect(refreshedEnv.session.driver).toBe('redis');
        expect(refreshedEnv.api.baseUrl).toBe('https://test.example.com/api');
    });
});