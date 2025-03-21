import {
    payeesCommand,
    payeesPageAction,
    addPayeeAction,
    removePayeeAction,
    savePayeeAction,
    noSavePayeeAction
} from '../../src/commands/payee.command';
import { createMockContext } from '../__mocks__/context.mock';
import { payeeService } from '../../src/services/payee.service';
import { mockPayeeResponse, mockPayeeResponseWithPagination } from '../__mocks__/payee.mock';
import { GlobalContext } from '../../src/types';

// Mock dependencies
jest.mock('../../src/services/payee.service');
jest.mock('../../src/utils/logger.utils');

describe('Payee Commands', () => {
    let ctx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();
    });

    describe('payeesCommand', () => {
        it('should show loading message before fetching payees', async () => {
            // Arrange
            (payeeService.getPayees as jest.Mock).mockResolvedValue(mockPayeeResponse);

            // Act
            await payeesCommand(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenNthCalledWith(1, '🔍 Fetching your saved payees...');
        });

        describe('when user has payees', () => {
            it('should display payee list without pagination', async () => {
                // Arrange
                (payeeService.getPayees as jest.Mock).mockResolvedValue(mockPayeeResponse);

                // Act
                await payeesCommand(ctx);

                // Assert
                expect(ctx.reply).toHaveBeenLastCalledWith(
                    expect.stringContaining('Your Saved Payees'),
                    expect.objectContaining({
                        parse_mode: 'Markdown',
                        reply_markup: expect.objectContaining({
                            inline_keyboard: expect.arrayContaining([
                                expect.arrayContaining([
                                    expect.objectContaining({ text: '➕ Add New Payee' })
                                ])
                            ])
                        })
                    })
                );
            });

            it('should display payee list with pagination when hasMore is true', async () => {
                // Arrange
                (payeeService.getPayees as jest.Mock).mockResolvedValue(mockPayeeResponseWithPagination);

                // Act
                await payeesCommand(ctx);

                // Assert
                const reply = (ctx.reply as jest.Mock).mock.calls[1][1];
                expect(reply.reply_markup.inline_keyboard).toEqual(
                    expect.arrayContaining([
                        expect.arrayContaining([
                            expect.objectContaining({ text: '⏩ Next Page' })
                        ])
                    ])
                );
            });

            it('should format payee details correctly', async () => {
                // Arrange
                (payeeService.getPayees as jest.Mock).mockResolvedValue(mockPayeeResponse);

                // Act
                await payeesCommand(ctx);

                // Assert
                const replyMessage = (ctx.reply as jest.Mock).mock.calls[1][0];
                expect(replyMessage).toContain('John Work');
                expect(replyMessage).toContain('john@example.com');
                expect(replyMessage).toContain('John D.');
                expect(replyMessage).toContain('Has Bank Account: Yes');
            });
        });

        describe('when user has no payees', () => {
            beforeEach(() => {
                (payeeService.getPayees as jest.Mock).mockResolvedValue({
                    data: [],
                    page: 1,
                    limit: 10,
                    count: 0,
                    hasMore: false
                });
            });

            it('should show no payees message with add option', async () => {
                // Act
                await payeesCommand(ctx);

                // Assert
                expect(ctx.reply).toHaveBeenLastCalledWith(
                    expect.stringContaining('No Saved Payees'),
                    expect.objectContaining({
                        parse_mode: 'Markdown',
                        reply_markup: expect.objectContaining({
                            inline_keyboard: expect.arrayContaining([
                                expect.arrayContaining([
                                    expect.objectContaining({ text: '➕ Add Payee' })
                                ])
                            ])
                        })
                    })
                );
            });
        });

        it('should handle service errors', async () => {
            // Arrange
            (payeeService.getPayees as jest.Mock).mockRejectedValue(new Error('Service error'));

            // Act
            await payeesCommand(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenLastCalledWith(
                expect.stringContaining('Error Retrieving Payees'),
                expect.objectContaining({ parse_mode: 'Markdown' })
            );
        });
    });

    describe('payeesPageAction', () => {
        it('should handle pagination correctly', async () => {
            // Arrange
            const mockMatch = ['full_match', '2'];
            Object.setPrototypeOf(mockMatch, RegExp.prototype);
            const ctxWithMatch = createMockContext();
            (ctxWithMatch as GlobalContext & { match: RegExpExecArray }).match = mockMatch as RegExpExecArray;

            (payeeService.getPayees as jest.Mock).mockResolvedValue(mockPayeeResponse);

            // Act
            await payeesPageAction(ctxWithMatch as GlobalContext & { match: RegExpExecArray });

            // Assert
            expect(payeeService.getPayees).toHaveBeenCalledWith(2, 10);
            expect(ctxWithMatch.reply).toHaveBeenCalledWith(
                expect.stringContaining('Your Saved Payees (Page 2)'),
                expect.any(Object)
            );
        });

        it('should show navigation buttons correctly', async () => {
            // Arrange
            const mockMatch = ['full_match', '2'];
            Object.setPrototypeOf(mockMatch, RegExp.prototype);
            const ctxWithMatch = createMockContext();
            (ctxWithMatch as GlobalContext & { match: RegExpExecArray }).match = mockMatch as RegExpExecArray;

            (payeeService.getPayees as jest.Mock).mockResolvedValue({
                ...mockPayeeResponse,
                hasMore: true
            });

            // Act
            await payeesPageAction(ctxWithMatch as GlobalContext & { match: RegExpExecArray });

            // Assert
            const reply = (ctxWithMatch.reply as jest.Mock).mock.calls[0][1];
            expect(reply.reply_markup.inline_keyboard).toEqual(
                expect.arrayContaining([
                    expect.arrayContaining([
                        expect.objectContaining({ text: '⏪ Previous' }),
                        expect.objectContaining({ text: '⏩ Next' })
                    ])
                ])
            );
        });

        it('should handle empty pages', async () => {
            // Arrange
            const mockMatch = ['full_match', '999'];
            Object.setPrototypeOf(mockMatch, RegExp.prototype);
            const ctxWithMatch = createMockContext();
            (ctxWithMatch as GlobalContext & { match: RegExpExecArray }).match = mockMatch as RegExpExecArray;

            (payeeService.getPayees as jest.Mock).mockResolvedValue({
                data: [],
                page: 999,
                limit: 10,
                count: 0,
                hasMore: false
            });

            // Act
            await payeesPageAction(ctxWithMatch as GlobalContext & { match: RegExpExecArray });

            // Assert
            expect(ctxWithMatch.reply).toHaveBeenCalledWith(
                'No payees found on this page.'
            );
        });
    });

    describe('addPayeeAction', () => {
        it('should enter create payee scene', async () => {
            // Act
            await addPayeeAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.scene.enter).toHaveBeenCalledWith('create_payee');
        });
    });

    describe('removePayeeAction', () => {
        it('should enter remove payee scene', async () => {
            // Act
            await removePayeeAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.scene.enter).toHaveBeenCalledWith('remove_payee');
        });
    });

    describe('savePayeeAction', () => {
        it('should handle valid email and enter create payee scene', async () => {
            // Arrange
            const mockMatch = ['full_match', 'test@example.com'];
            Object.setPrototypeOf(mockMatch, RegExp.prototype);
            const ctxWithMatch = createMockContext();
            (ctxWithMatch as GlobalContext & { match: RegExpExecArray }).match = mockMatch as RegExpExecArray;

            // Act
            await savePayeeAction(ctxWithMatch as GlobalContext & { match: RegExpExecArray });

            // Assert
            expect(ctxWithMatch.answerCbQuery).toHaveBeenCalled();
            expect(ctxWithMatch.scene.enter).toHaveBeenCalledWith('create_payee');
            expect(ctxWithMatch.scene.state).toEqual({ email: 'test@example.com' });
        });

        it('should handle missing email', async () => {
            // Arrange
            const mockMatch = ['full_match', ''];
            Object.setPrototypeOf(mockMatch, RegExp.prototype);
            const ctxWithMatch = createMockContext();
            (ctxWithMatch as GlobalContext & { match: RegExpExecArray }).match = mockMatch as RegExpExecArray;

            // Act
            await savePayeeAction(ctxWithMatch as GlobalContext & { match: RegExpExecArray });

            // Assert
            expect(ctxWithMatch.reply).toHaveBeenCalledWith('❌ Error: No email address provided.');
        });
    });

    describe('noSavePayeeAction', () => {
        it('should show confirmation message', async () => {
            // Act
            await noSavePayeeAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.reply).toHaveBeenCalledWith(
                expect.stringContaining('You can add payees later')
            );
        });
    });
}); 