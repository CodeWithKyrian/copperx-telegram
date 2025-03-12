import { config } from 'dotenv';

config({ path: '.env.test' });

jest.mock('../src/utils/logger', () => ({
    __esModule: true,
    default: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));