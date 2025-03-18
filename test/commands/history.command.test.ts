import { historyCommand, historyAction } from '../../src/commands/history.command';
import { createMockContext } from '../__mocks__/context.mock';
import { transferService } from '../../src/services/transfer.service';
import { mockTransferList, mockPaginatedResponse } from '../__mocks__/transfer.mock';

// Mock dependencies
jest.mock('../../src/services/transfer.service');
jest.mock('../../src/utils/logger.utils');

describe('History Commands', () => {
    let ctx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();

        // Mock the formatTransferList method
        (transferService.formatTransferList as jest.Mock) = jest.fn().mockReturnValue(
            'Transfer 1: 1,000 USDC to recipient@example.com\n' +
            'Transfer 2: 500 USDC deposit from Ethereum'
        );
    });

    describe('historyCommand', () => {
        describe('when user has transactions', () => {
            beforeEach(() => {
                (transferService.getTransferHistory as jest.Mock).mockResolvedValue(mockPaginatedResponse);
            });

            it('should display transaction history with formatting', async () => {
                // Act
                await historyCommand(ctx);

                // Assert
                expect(ctx.reply).toHaveBeenCalledTimes(2);

                // Check loading message
                expect(ctx.reply).toHaveBeenNthCalledWith(1,
                    '🔍 Fetching your recent transactions...'
                );

                // Check formatted history message
                expect(ctx.reply).toHaveBeenNthCalledWith(2,
                    expect.stringContaining('Your Recent Transactions'),
                    expect.objectContaining({
                        parse_mode: 'Markdown',
                        reply_markup: expect.objectContaining({
                            inline_keyboard: expect.arrayContaining([
                                expect.arrayContaining([
                                    expect.objectContaining({
                                        text: '📊 View Transaction Details'
                                    })
                                ]),
                                expect.arrayContaining([
                                    expect.objectContaining({
                                        text: '🔙 Back to Menu'
                                    })
                                ])
                            ])
                        })
                    })
                );

                expect(transferService.getTransferHistory).toHaveBeenCalledWith(1, 10);
                expect(transferService.formatTransferList).toHaveBeenCalledWith(mockTransferList);
            });
        });

        describe('when user has no transactions', () => {
            beforeEach(() => {
                (transferService.getTransferHistory as jest.Mock).mockResolvedValue({
                    data: [],
                    meta: { currentPage: 1, totalPages: 0, totalItems: 0 }
                });
            });

            it('should show no transactions message with action buttons', async () => {
                // Act
                await historyCommand(ctx);

                // Assert
                expect(ctx.reply).toHaveBeenCalledTimes(2);
                expect(ctx.reply).toHaveBeenLastCalledWith(
                    expect.stringContaining('No Transactions Found'),
                    expect.objectContaining({
                        parse_mode: 'Markdown',
                        reply_markup: expect.objectContaining({
                            inline_keyboard: expect.arrayContaining([
                                expect.arrayContaining([
                                    expect.objectContaining({ text: '💸 Send' }),
                                    expect.objectContaining({ text: '📤 Withdraw' })
                                ])
                            ])
                        })
                    })
                );
            });
        });

        describe('error handling', () => {
            it('should handle null response', async () => {
                // Arrange
                (transferService.getTransferHistory as jest.Mock).mockResolvedValue(null);

                // Act
                await historyCommand(ctx);

                // Assert
                expect(ctx.reply).toHaveBeenLastCalledWith(
                    expect.stringContaining('No Transactions Found'),
                    expect.any(Object)
                );
            });

            it('should handle service errors', async () => {
                // Arrange
                (transferService.getTransferHistory as jest.Mock).mockRejectedValue(
                    new Error('Service error')
                );

                // Act
                await historyCommand(ctx);

                // Assert
                expect(ctx.reply).toHaveBeenLastCalledWith(
                    expect.stringContaining('Error Retrieving Transaction History'),
                    expect.objectContaining({ parse_mode: 'Markdown' })
                );
            });
        });
    });

    describe('historyAction', () => {
        it('should answer callback query and show history', async () => {
            // Arrange
            (transferService.getTransferHistory as jest.Mock).mockResolvedValue(mockPaginatedResponse);

            // Act
            await historyAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(transferService.getTransferHistory).toHaveBeenCalled();
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('Fetching your recent transactions')
            );
        });

        it('should handle errors while maintaining callback', async () => {
            // Arrange
            (transferService.getTransferHistory as jest.Mock).mockRejectedValue(
                new Error('Service error')
            );

            // Act
            await historyAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.reply).toHaveBeenLastCalledWith(
                expect.stringContaining('Error Retrieving Transaction History'),
                expect.any(Object)
            );
        });
    });
}); 