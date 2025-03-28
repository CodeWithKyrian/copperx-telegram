import { Middleware } from 'telegraf';
import { GlobalContext } from '../../src/types';

/**
 * Creates a mock Telegraf context for testing
 */
export function createMockContext(overrides = {}): GlobalContext {
    const defaults = {
        from: {
            id: 123456789,
            is_bot: false,
            first_name: 'Test',
            username: 'testuser',
            language_code: 'en',
        },
        chat: {
            id: 123456789,
            type: 'private',
            first_name: 'Test',
            username: 'testuser',
        },
        message: {
            message_id: 1,
            date: Math.floor(Date.now() / 1000),
            chat: {
                id: 123456789,
                type: 'private',
                first_name: 'Test',
                username: 'testuser',
            },
            text: '/start',
        },
        session: {},
        reply: jest.fn().mockResolvedValue({}),
        replyWithMarkdown: jest.fn().mockResolvedValue({}),
        replyWithHTML: jest.fn().mockResolvedValue({}),
        replyWithPhoto: jest.fn().mockResolvedValue({}),
        deleteMessage: jest.fn().mockResolvedValue(true),
        answerCbQuery: jest.fn().mockResolvedValue(true),
        telegram: {
            sendMessage: jest.fn().mockResolvedValue({}),
            sendPhoto: jest.fn().mockResolvedValue({}),
            deleteMessage: jest.fn().mockResolvedValue(true),
            setMyCommands: jest.fn().mockResolvedValue({}),
        },
        scene: {
            enter: jest.fn().mockResolvedValue({}),
            leave: jest.fn().mockResolvedValue({}),
            reenter: jest.fn().mockResolvedValue({}),
            state: {}
        },
    };

    return {
        ...defaults,
        ...overrides,
    } as unknown as GlobalContext;
}

/**
 * Calls a middleware function
 */
export const callMiddleware = async (
    middleware: Middleware<GlobalContext>,
    ctx: GlobalContext,
    next: () => Promise<void>
): Promise<void> => {
    if (typeof middleware === 'function') {
        await middleware(ctx, next);
    } else if (middleware && typeof middleware.middleware === 'function') {
        const fn = middleware.middleware();
        await fn(ctx, next);
    } else {
        throw new Error('Invalid middleware type');
    }
}; 