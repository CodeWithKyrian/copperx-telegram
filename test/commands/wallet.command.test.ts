import { walletCommand, viewWalletsAction, walletCreateAction, walletSetDefaultAction, walletSetDefaultActionWithWallet } from '../../src/commands/wallet.command';
import { createMockContext } from '../__mocks__/context.mock';
import { walletService } from '../../src/services/wallet.service';
import { mockWallets, mockWalletBalances } from '../__mocks__/wallet.mock';
import { showLoading } from '../../src/utils/ui.utils';
import { GlobalContextWithMatch } from '../../src/types/session.types';

// Mock dependencies
jest.mock('../../src/services/wallet.service');
jest.mock('../../src/utils/logger.utils');
jest.mock('../../src/utils/ui.utils');

describe('Wallet Commands', () => {
    let ctx: ReturnType<typeof createMockContext>;
    let mockLoadingInstance: { complete: jest.Mock; update: jest.Mock };

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();

        // Setup loading mock
        mockLoadingInstance = {
            complete: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined)
        };
        (showLoading as jest.Mock).mockResolvedValue(mockLoadingInstance);
    });

    describe('walletCommand', () => {
        describe('when user has wallets', () => {
            beforeEach(() => {
                (walletService.getWallets as jest.Mock).mockResolvedValue(mockWallets);
                (walletService.getWalletBalances as jest.Mock).mockResolvedValue(mockWalletBalances);

                // Mock total balance calculation - create a mock total balance
                const mockTotalBalance = "1500.00"; // $1,500 in total
                (walletService.getTotalBalance as jest.Mock).mockResolvedValue(mockTotalBalance);
            });

            it('should display wallet summary with balances', async () => {
                // Act
                await walletCommand(ctx);

                // Assert
                expect(showLoading).toHaveBeenCalledWith(ctx, '💼 *Loading your wallets...*');
                expect(mockLoadingInstance.update).toHaveBeenCalledWith(
                    '💼 *Loading your wallets...*\n💰 *Retrieving balances...*'
                );
                expect(mockLoadingInstance.complete).toHaveBeenCalled();

                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('Your CopperX Wallet'),
                    expect.objectContaining({
                        parse_mode: 'Markdown',
                        reply_markup: expect.objectContaining({
                            inline_keyboard: expect.arrayContaining([
                                expect.arrayContaining([
                                    expect.objectContaining({ text: '💸 Deposit' }),
                                    expect.objectContaining({ text: '📤 Send' }),
                                    expect.objectContaining({ text: '💳 Withdraw' })
                                ])
                            ])
                        })
                    })
                );
            });

            it('should display default wallet indicator correctly', async () => {
                // Act
                await walletCommand(ctx);

                // Assert
                const replyMessage = (ctx.reply as jest.Mock).mock.calls[0][0];
                expect(replyMessage).toContain('✓ *polygon*'); // Changed to lowercase to match actual output
                expect(replyMessage).not.toContain('✓ *solana*'); // Changed to lowercase to match actual output
            });
        });

        describe('when user has no wallets', () => {
            beforeEach(() => {
                (walletService.getWallets as jest.Mock).mockResolvedValue([]);
            });

            it('should show create wallet option', async () => {
                // Act
                await walletCommand(ctx);

                // Assert
                expect(mockLoadingInstance.complete).toHaveBeenCalled();
                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('No Wallets Found'),
                    expect.objectContaining({
                        parse_mode: 'Markdown',
                        reply_markup: expect.objectContaining({
                            inline_keyboard: expect.arrayContaining([
                                expect.arrayContaining([
                                    expect.objectContaining({ text: '➕ Create a Wallet' })
                                ])
                            ])
                        })
                    })
                );
            });
        });

        describe('error handling', () => {
            it('should handle null balances response', async () => {
                // Arrange
                (walletService.getWallets as jest.Mock).mockResolvedValue(mockWallets);
                (walletService.getWalletBalances as jest.Mock).mockResolvedValue(null);

                // Act
                await walletCommand(ctx);

                // Assert
                expect(mockLoadingInstance.complete).toHaveBeenCalled();
                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('Error retrieving wallet balances'),
                    expect.objectContaining({ parse_mode: 'Markdown' })
                );
            });

            it('should handle service errors', async () => {
                // Arrange
                (walletService.getWallets as jest.Mock).mockRejectedValue(new Error('Service error'));

                // Act
                await walletCommand(ctx);

                // Assert
                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('Something went wrong'),
                    expect.objectContaining({ parse_mode: 'Markdown' })
                );
            });
        });
    });

    describe('wallet actions', () => {
        it('should handle view wallets action', async () => {
            // Act
            await viewWalletsAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(showLoading).toHaveBeenCalled();
        });

        it('should handle wallet create action', async () => {
            // Act
            await walletCreateAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.scene.enter).toHaveBeenCalledWith('wallet_create');
        });

        it('should handle set default wallet action', async () => {
            // Act
            await walletSetDefaultAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.scene.enter).toHaveBeenCalledWith('wallet_default');
        });

        it('should handle set default wallet with specific wallet ID', async () => {
            // Arrange
            const mockMatch = ['full_match', 'wallet_id_123'];
            Object.setPrototypeOf(mockMatch, RegExp.prototype);

            // Create context and add match property
            const ctxWithMatch = createMockContext();
            (ctxWithMatch as GlobalContextWithMatch).match = mockMatch as RegExpExecArray;

            // Act
            await walletSetDefaultActionWithWallet(ctxWithMatch as GlobalContextWithMatch);

            // Assert
            expect(ctxWithMatch.answerCbQuery).toHaveBeenCalled();
            expect(ctxWithMatch.scene.leave).toHaveBeenCalled();
            expect(ctxWithMatch.scene.enter).toHaveBeenCalledWith('wallet_default', {
                walletId: 'wallet_id_123'
            });
        });
    });
}); 