import { profileCommand, profileAction } from '../../src/commands/profile.command';
import { createMockContext } from '../__mocks__/context.mock';
import { authService } from '../../src/services/auth.service';
import { mockAuthUser, mockIncompleteAuthUser } from '../__mocks__/auth.mock';

// Mock dependencies
jest.mock('../../src/services/auth.service');
jest.mock('../../src/utils/logger.utils');

describe('Profile Commands', () => {
    let ctx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();
    });

    describe('profileCommand', () => {
        it('should show loading message before fetching profile', async () => {
            // Arrange
            (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockAuthUser);

            // Act
            await profileCommand(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenNthCalledWith(1, '🔄 Loading profile...');
        });

        describe('when profile is complete', () => {
            beforeEach(() => {
                (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockAuthUser);
            });

            it('should display full profile information', async () => {
                // Act
                await profileCommand(ctx);

                // Assert
                const replyMessage = (ctx.reply as jest.Mock).mock.calls[1][0];
                expect(replyMessage).toContain('YOUR COPPERX PROFILE');
                expect(replyMessage).toContain('Test'); // firstName
                expect(replyMessage).toContain('test@example.com'); // email
                expect(replyMessage).toContain('Active'); // formatted status
                expect(replyMessage).toContain('Individual'); // capitalized type
                expect(replyMessage).toContain('Owner'); // capitalized role
                expect(replyMessage).toContain('org-456'); // organizationId
                expect(replyMessage).toContain('wallet-789'); // walletId
                expect(replyMessage).toContain('0x123456...12345678'); // formatted wallet address
            });

            it('should include all action buttons', async () => {
                // Act
                await profileCommand(ctx);

                // Assert
                const reply = (ctx.reply as jest.Mock).mock.calls[1][1];
                expect(reply.reply_markup.inline_keyboard).toEqual(
                    expect.arrayContaining([
                        expect.arrayContaining([
                            expect.objectContaining({ text: '💼 View Wallets' }),
                            expect.objectContaining({ text: '🔐 KYC Status' })
                        ]),
                        expect.arrayContaining([
                            expect.objectContaining({ text: '💳 Deposit Funds' }),
                            expect.objectContaining({ text: '📤 Send Funds' })
                        ]),
                        expect.arrayContaining([
                            expect.objectContaining({ text: '📜 Transaction History' }),
                            expect.objectContaining({ text: '🔙 Back to Menu' })
                        ]),
                        expect.arrayContaining([
                            expect.objectContaining({ text: '🚪 Logout' })
                        ])
                    ])
                );
            });
        });

        describe('when profile is incomplete', () => {
            beforeEach(() => {
                (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockIncompleteAuthUser);
            });

            it('should handle missing optional fields', async () => {
                // Act
                await profileCommand(ctx);

                // Assert
                const replyMessage = (ctx.reply as jest.Mock).mock.calls[1][0];
                expect(replyMessage).toContain('Not set'); // for missing fields
                expect(replyMessage).toContain('Pending'); // status
                expect(replyMessage).toContain('User'); // role
            });
        });

        describe('error handling', () => {
            it('should handle profile fetch failure', async () => {
                // Arrange
                (authService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

                // Act
                await profileCommand(ctx);

                // Assert
                expect(ctx.reply).toHaveBeenLastCalledWith(
                    expect.stringContaining('Error Retrieving Profile'),
                    expect.objectContaining({
                        parse_mode: 'Markdown',
                        reply_markup: expect.objectContaining({
                            inline_keyboard: expect.arrayContaining([
                                expect.arrayContaining([
                                    expect.objectContaining({ text: '🔄 Try Again' })
                                ])
                            ])
                        })
                    })
                );
            });
        });
    });

    describe('profileAction', () => {
        it('should answer callback query and show profile', async () => {
            // Arrange
            (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockAuthUser);

            // Act
            await profileAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.reply).toHaveBeenCalledWith('🔄 Loading profile...');
        });

        it('should handle errors while maintaining callback', async () => {
            // Arrange
            (authService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));

            // Act
            await profileAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.reply).toHaveBeenLastCalledWith(
                expect.stringContaining('Error Retrieving Profile'),
                expect.any(Object)
            );
        });
    });
}); 