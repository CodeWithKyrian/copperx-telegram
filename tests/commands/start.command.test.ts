import { startCommand, showMainMenu } from '../../src/commands/start.command';
import { createMockContext } from '../__mocks__/context.mock';

describe('Start Command', () => {
    describe('startCommand', () => {
        it('should show welcome message for any user regardless of authentication', async () => {
            // Arrange
            const ctx = createMockContext({
                session: { auth: { accessToken: null } }
            });

            // Act
            await startCommand(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('Hello, *testuser*!'),
                expect.objectContaining({
                    parse_mode: 'Markdown'
                })
            );
        });

        it('should show the same welcome message for authenticated users', async () => {
            // Arrange
            const ctx = createMockContext({
                session: { auth: { accessToken: 'valid-token' } }
            });

            // Act
            await startCommand(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('Hello, *testuser*!'),
                expect.objectContaining({
                    parse_mode: 'Markdown'
                })
            );
        });

        it('should handle users without username gracefully', async () => {
            // Arrange
            const ctx = createMockContext({
                from: { username: undefined },
                session: { auth: { accessToken: null } }
            });

            // Act
            await startCommand(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('Hello, *there*!'),
                expect.any(Object)
            );
        });

        it('should handle errors gracefully', async () => {
            // Arrange
            const ctx = createMockContext();
            const mockReply = jest.fn().mockRejectedValueOnce(new Error('Network error'));
            ctx.reply = mockReply;

            // Act
            await startCommand(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenLastCalledWith(
                'Sorry, something went wrong while starting the bot. Please try again.'
            );
        });
    });

    describe('showMainMenu', () => {
        it('should show authenticated menu options when user is logged in', async () => {
            // Arrange
            const ctx = createMockContext({
                session: { auth: { accessToken: 'valid-token' } }
            });

            // Act
            await showMainMenu(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenCalledWith(
                'What would you like to do today?',
                expect.objectContaining({
                    parse_mode: 'Markdown',
                    reply_markup: expect.objectContaining({
                        inline_keyboard: expect.arrayContaining([
                            expect.arrayContaining([
                                expect.objectContaining({ text: '👤 View Profile' }),
                                expect.objectContaining({ text: '💼 View Wallets' })
                            ])
                        ])
                    })
                })
            );
        });

        it('should show login options when user is not authenticated', async () => {
            // Arrange
            const ctx = createMockContext({
                session: { auth: { accessToken: null } }
            });

            // Act
            await showMainMenu(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenCalledWith(
                'Please login to access all features:',
                expect.objectContaining({
                    parse_mode: 'Markdown',
                    reply_markup: expect.objectContaining({
                        inline_keyboard: expect.arrayContaining([
                            expect.arrayContaining([
                                expect.objectContaining({ text: '🔑 Login to CopperX' })
                            ])
                        ])
                    })
                })
            );
        });

        it('should handle errors gracefully', async () => {
            // Arrange
            const ctx = createMockContext();
            const mockReply = jest.fn().mockRejectedValueOnce(new Error('Network error'));
            ctx.reply = mockReply;

            // Act
            await showMainMenu(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenLastCalledWith(
                'Sorry, something went wrong. Please try again.'
            );
        });
    });
});