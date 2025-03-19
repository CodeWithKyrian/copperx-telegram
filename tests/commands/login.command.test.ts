import { loginCommand, loginAction } from '../../src/commands/login.command';
import { createMockContext } from '../__mocks__/context.mock';
import { authService } from '../../src/services/auth.service';
import { mockAuthUser } from '../__mocks__/auth.mock';
import { AUTH_SCENE_ID } from '../../src/scenes/auth.scene';

// Mock dependencies
jest.mock('../../src/services/auth.service');

describe('Login Commands', () => {
    let ctx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();
    });

    describe('loginCommand', () => {
        describe('when user is already authenticated', () => {
            beforeEach(() => {
                (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
            });

            it('should show already logged in message if profile fetch succeeds', async () => {
                // Arrange
                (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockAuthUser);

                // Act
                await loginCommand(ctx);

                // Assert
                expect(authService.getCurrentUser).toHaveBeenCalled();
                expect(authService.updateSessionUserProfile).toHaveBeenCalledWith(ctx, mockAuthUser);
                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('Already Logged In'),
                    expect.objectContaining({ parse_mode: 'Markdown' })
                );
                expect(ctx.scene.enter).not.toHaveBeenCalled();
            });

            it('should handle expired session and redirect to login', async () => {
                // Arrange
                (authService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Invalid token'));

                // Act
                await loginCommand(ctx);

                // Assert
                expect(authService.clearSessionAuth).toHaveBeenCalledWith(ctx);
                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('Session Expired'),
                    expect.objectContaining({ parse_mode: 'Markdown' })
                );
                expect(ctx.scene.enter).toHaveBeenCalledWith(AUTH_SCENE_ID);
            });
        });

        describe('when user is not authenticated', () => {
            beforeEach(() => {
                (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
            });

            it('should redirect to auth scene', async () => {
                // Act
                await loginCommand(ctx);

                // Assert
                expect(ctx.scene.enter).toHaveBeenCalledWith(AUTH_SCENE_ID);
                expect(authService.getCurrentUser).not.toHaveBeenCalled();
            });
        });
    });

    describe('loginAction', () => {
        it('should answer callback query and handle login', async () => {
            // Arrange
            (authService.isAuthenticated as jest.Mock).mockReturnValue(false);

            // Act
            await loginAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.scene.enter).toHaveBeenCalledWith(AUTH_SCENE_ID);
        });
    });
}); 