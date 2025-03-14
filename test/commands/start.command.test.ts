import { startCommand } from '../../src/commands/start.command';
import { createMockContext } from '../utils/mock-context';

describe('Start Command', () => {
    it('should reply with welcome message', async () => {
        // Arrange
        const ctx = createMockContext();

        // Act
        await startCommand(ctx);

        // Assert
        expect(ctx.reply).toHaveBeenCalledWith(
            expect.stringContaining('Welcome to CopperX Telegram Bot')
        );
    });
});