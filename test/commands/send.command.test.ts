import { sendCommand, sendAction, sendSingleAction, sendBatchAction, transferDetailsAction } from '../../src/commands/send.command';
import { createMockContext } from '../__mocks__/context.mock';
import { walletService } from '../../src/services/wallet.service';
import { mockDefaultWallet } from '../__mocks__/wallet.mock';

// Mock dependencies
jest.mock('../../src/services/wallet.service');

describe('Send Commands', () => {
    let ctx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();
    });

    describe('sendCommand', () => {
        describe('when default wallet exists', () => {
            beforeEach(() => {
                (walletService.getDefaultWallet as jest.Mock).mockResolvedValue(mockDefaultWallet);
            });

            it('should display send options', async () => {
                // Act
                await sendCommand(ctx);

                // Assert
                expect(walletService.getDefaultWallet).toHaveBeenCalled();
                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('Send Funds'),
                    expect.objectContaining({
                        parse_mode: 'Markdown',
                        reply_markup: expect.objectContaining({
                            inline_keyboard: expect.arrayContaining([
                                expect.arrayContaining([
                                    expect.objectContaining({ text: '👤 Send to Single Recipient' })
                                ]),
                                expect.arrayContaining([
                                    expect.objectContaining({ text: '👥 Send to Multiple Recipients' })
                                ]),
                                expect.arrayContaining([
                                    expect.objectContaining({ text: '❌ Cancel' })
                                ])
                            ])
                        })
                    })
                );
            });
        });

        describe('when no default wallet exists', () => {
            beforeEach(() => {
                (walletService.getDefaultWallet as jest.Mock).mockResolvedValue(null);
            });

            it('should prompt to set a default wallet', async () => {
                // Act
                await sendCommand(ctx);

                // Assert
                expect(walletService.getDefaultWallet).toHaveBeenCalled();
                expect(ctx.reply).toHaveBeenCalledWith(
                    expect.stringContaining('No Default Wallet Set'),
                    expect.objectContaining({
                        parse_mode: 'Markdown',
                        reply_markup: expect.objectContaining({
                            inline_keyboard: expect.arrayContaining([
                                expect.arrayContaining([
                                    expect.objectContaining({ text: '🔹 Set Default Wallet' })
                                ])
                            ])
                        })
                    })
                );
            });
        });
    });

    describe('sendAction', () => {
        it('should answer callback query and call send command', async () => {
            // Arrange
            (walletService.getDefaultWallet as jest.Mock).mockResolvedValue(mockDefaultWallet);

            // Act
            await sendAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(walletService.getDefaultWallet).toHaveBeenCalled();
            expect(ctx.reply).toHaveBeenCalled();
        });
    });

    describe('sendSingleAction', () => {
        it('should enter send_single scene', async () => {
            // Act
            await sendSingleAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.scene.enter).toHaveBeenCalledWith('send_single');
        });
    });

    describe('sendBatchAction', () => {
        it('should enter send_batch scene', async () => {
            // Act
            await sendBatchAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.scene.enter).toHaveBeenCalledWith('send_batch');
        });
    });

    describe('transferDetailsAction', () => {
        it('should enter transfer_details scene', async () => {
            // Act
            await transferDetailsAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.scene.enter).toHaveBeenCalledWith('transfer_details');
        });
    });
}); 