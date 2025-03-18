import { depositCommand, depositAction, depositActionWithWallet, depositDoneAction } from '../../src/commands/deposit.command';
import { createMockContext } from '../__mocks__/context.mock';
import { walletService } from '../../src/services/wallet.service';
import { mockWallets, mockWallet, mockWalletWithoutAddress } from '../__mocks__/wallet.mock';
import { showLoading } from '../../src/utils/ui.utils';
import { generateQRCodeWithLogo } from '../../src/utils/qrcode.utils';
import { GlobalContextWithMatch } from '../../src/types/session.types';

// Mock dependencies
jest.mock('../../src/services/wallet.service');
jest.mock('../../src/utils/logger.utils');
jest.mock('../../src/utils/ui.utils');
jest.mock('../../src/utils/qrcode.utils');

describe('Deposit Commands', () => {
    let ctx: ReturnType<typeof createMockContext>;
    let mockLoadingInstance: { complete: jest.Mock; update: jest.Mock };

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();

        mockLoadingInstance = {
            complete: jest.fn().mockResolvedValue(undefined),
            update: jest.fn().mockResolvedValue(undefined)
        };
        (showLoading as jest.Mock).mockResolvedValue(mockLoadingInstance);
        (generateQRCodeWithLogo as jest.Mock).mockResolvedValue('path/to/qr.png');
    });

    describe('depositCommand', () => {
        describe('when user has wallets', () => {
            beforeEach(() => {
                (walletService.getWallets as jest.Mock).mockResolvedValue(mockWallets);
            });

            it('should display wallet selection options', async () => {
                // Act
                await depositCommand(ctx);

                // Assert
                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('Deposit Funds'),
                    expect.objectContaining({
                        parse_mode: 'Markdown',
                        reply_markup: expect.objectContaining({
                            inline_keyboard: expect.arrayContaining([
                                expect.arrayContaining([
                                    expect.objectContaining({
                                        text: expect.stringContaining('polygon Wallet (Default)'),
                                        callback_data: expect.stringContaining('deposit_funds:')
                                    })
                                ])
                            ])
                        })
                    })
                );
            });
        });

        describe('when user has no wallets', () => {
            beforeEach(() => {
                (walletService.getWallets as jest.Mock).mockResolvedValue([]);
            });

            it('should prompt to create wallet', async () => {
                // Act
                await depositCommand(ctx);

                // Assert
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

        it('should handle service errors', async () => {
            // Arrange
            (walletService.getWallets as jest.Mock).mockRejectedValue(new Error('Service error'));

            // Act
            await depositCommand(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('Error'),
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
        });
    });

    describe('depositActionWithWallet', () => {
        describe('when wallet has address', () => {
            beforeEach(() => {
                (walletService.getWalletById as jest.Mock).mockResolvedValue(mockWallet);
            });

            it('should display deposit instructions and QR code', async () => {
                // Arrange
                const mockMatch = ['full_match', 'wallet-123'];
                Object.setPrototypeOf(mockMatch, RegExp.prototype);
                const ctxWithMatch = createMockContext();
                (ctxWithMatch as GlobalContextWithMatch).match = mockMatch as RegExpExecArray;

                // Act
                await depositActionWithWallet(ctxWithMatch as GlobalContextWithMatch);

                // Assert
                expect(ctxWithMatch.reply).toHaveBeenCalledWith(
                    expect.stringContaining('Deposit to CopperX Wallet'),
                    expect.objectContaining({ parse_mode: 'Markdown' })
                );
                expect(showLoading).toHaveBeenCalledWith(
                    ctxWithMatch,
                    expect.stringContaining('Generating QR code')
                );
                expect(generateQRCodeWithLogo).toHaveBeenCalled();
                expect(ctxWithMatch.replyWithPhoto).toHaveBeenCalled();
            });
        });

        describe('when wallet has no address', () => {
            beforeEach(() => {
                (walletService.getWalletById as jest.Mock).mockResolvedValue(mockWalletWithoutAddress);
            });

            it('should show error message', async () => {
                // Arrange
                const mockMatch = ['full_match', 'wallet-456'];
                Object.setPrototypeOf(mockMatch, RegExp.prototype);
                const ctxWithMatch = createMockContext();
                (ctxWithMatch as GlobalContextWithMatch).match = mockMatch as RegExpExecArray;

                // Act
                await depositActionWithWallet(ctxWithMatch as GlobalContextWithMatch);

                // Assert
                expect(ctxWithMatch.reply).toHaveBeenCalledWith(
                    expect.stringContaining('doesn\'t have a deposit address'),
                    expect.objectContaining({ parse_mode: 'Markdown' })
                );
            });
        });

        it('should handle wallet not found', async () => {
            // Arrange
            (walletService.getWalletById as jest.Mock).mockResolvedValue(null);
            const mockMatch = ['full_match', 'non-existent-wallet'];
            Object.setPrototypeOf(mockMatch, RegExp.prototype);
            const ctxWithMatch = createMockContext();
            (ctxWithMatch as GlobalContextWithMatch).match = mockMatch as RegExpExecArray;

            // Act
            await depositActionWithWallet(ctxWithMatch as GlobalContextWithMatch);

            // Assert
            expect(ctxWithMatch.reply).toHaveBeenCalledWith(
                expect.stringContaining('couldn\'t retrieve your wallet information'),
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
        });

        it('should handle service errors', async () => {
            // Arrange
            (walletService.getWalletById as jest.Mock).mockRejectedValue(new Error('Service error'));
            const mockMatch = ['full_match', 'wallet-123'];
            Object.setPrototypeOf(mockMatch, RegExp.prototype);
            const ctxWithMatch = createMockContext();
            (ctxWithMatch as GlobalContextWithMatch).match = mockMatch as RegExpExecArray;

            // Act
            await depositActionWithWallet(ctxWithMatch as GlobalContextWithMatch);

            // Assert
            expect(ctxWithMatch.reply).toHaveBeenCalledWith(
                expect.stringContaining('Error'),
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
        });
    });

    describe('depositAction', () => {
        it('should answer callback query and show deposit options', async () => {
            // Act
            await depositAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(walletService.getWallets).toHaveBeenCalled();
        });
    });

    describe('depositDoneAction', () => {
        it('should show completion message and leave scene', async () => {
            // Act
            await depositDoneAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('Thank you!')
            );
            expect(ctx.scene.leave).toHaveBeenCalled();
        });
    });
}); 