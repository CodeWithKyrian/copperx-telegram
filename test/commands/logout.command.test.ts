import { logoutCommand, logoutAction } from '../../src/commands/logout.command';
import { createMockContext } from '../__mocks__/context.mock';
import { authService } from '../../src/services/auth.service';

// Mock dependencies
jest.mock('../../src/services/auth.service');

describe('Logout Commands', () => {
    let ctx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();
    });

    describe('logoutCommand', () => {
        describe('when user is authenticated', () => {
            beforeEach(() => {
                (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
            });

            it('should logout successfully and clear session', async () => {
                // Arrange
                (authService.logout as jest.Mock).mockResolvedValue(undefined);

                // Act
                await logoutCommand(ctx);

                // Assert
                expect(authService.logout).toHaveBeenCalledWith(ctx);
                expect(authService.clearSessionAuth).toHaveBeenCalledWith(ctx);
                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('Logged Out Successfully'),
                    expect.objectContaining({ parse_mode: 'Markdown' })
                );
            });

            it('should handle logout failure', async () => {
                // Arrange
                (authService.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));

                // Act
                await logoutCommand(ctx);

                // Assert
                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('Logout Failed'),
                    expect.objectContaining({ parse_mode: 'Markdown' })
                );
            });
        });

        describe('when user is not authenticated', () => {
            beforeEach(() => {
                (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
            });

            it('should show not logged in message', async () => {
                // Act
                await logoutCommand(ctx);

                // Assert
                expect(authService.logout).not.toHaveBeenCalled();
                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('Not Logged In'),
                    expect.objectContaining({ parse_mode: 'Markdown' })
                );
            });
        });
    });

    describe('logoutAction', () => {
        it('should answer callback query and handle logout', async () => {
            // Arrange
            (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
            (authService.logout as jest.Mock).mockResolvedValue(undefined);

            // Act
            await logoutAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(authService.logout).toHaveBeenCalled();
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('Logged Out Successfully'),
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
        });

        it('should handle errors while maintaining callback', async () => {
            // Arrange
            (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
            (authService.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));

            // Act
            await logoutAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('Logout Failed'),
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
        });
    });
}); 