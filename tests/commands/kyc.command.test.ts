import { kycCommand, kycStatusAction } from '../../src/commands/kyc.command';
import { createMockContext } from '../__mocks__/context.mock';
import kycService from '../../src/services/kyc.service';
import { mockKycResponses } from '../__mocks__/kyc.mock';
import { KycStatus } from '../../src/types/api.types';

// Mock dependencies
jest.mock('../../src/services/kyc.service');
jest.mock('../../src/utils/logger.utils');

describe('KYC Commands', () => {
    let ctx: ReturnType<typeof createMockContext>;

    beforeEach(() => {
        jest.clearAllMocks();
        ctx = createMockContext();
    });

    describe('kycCommand', () => {
        it('should show loading message before checking status', async () => {
            // Arrange
            (kycService.getKycStatus as jest.Mock).mockResolvedValue(mockKycResponses.approved);

            // Act
            await kycCommand(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenNthCalledWith(1, 'Checking your KYC status...');
        });

        describe('status-specific responses', () => {
            const statuses: (KycStatus | 'null')[] = [
                'approved', 'pending', 'initiated', 'inprogress',
                'expired', 'rejected', 'review_pending', 'review', 'null'
            ];

            test.each(statuses)('should handle %s status correctly', async (status) => {
                // Arrange
                (kycService.getKycStatus as jest.Mock).mockResolvedValue(mockKycResponses[status]);

                // Act
                await kycCommand(ctx);

                // Assert
                expect(ctx.reply).toHaveBeenLastCalledWith(
                    mockKycResponses[status].message,
                    expect.objectContaining({
                        parse_mode: 'Markdown',
                        reply_markup: expect.any(Object)
                    })
                );
            });
        });

        describe('button layouts', () => {
            it('should show wallet button for approved status', async () => {
                // Arrange
                (kycService.getKycStatus as jest.Mock).mockResolvedValue(mockKycResponses.approved);

                // Act
                await kycCommand(ctx);

                // Assert
                const reply = (ctx.reply as jest.Mock).mock.calls[1][1];
                expect(reply.reply_markup.inline_keyboard).toEqual(
                    expect.arrayContaining([
                        expect.arrayContaining([
                            expect.objectContaining({ text: '💼 View Wallet' })
                        ])
                    ])
                );
            });

            it('should show start KYC button for pending status', async () => {
                // Arrange
                (kycService.getKycStatus as jest.Mock).mockResolvedValue(mockKycResponses.pending);

                // Act
                await kycCommand(ctx);

                // Assert
                const reply = (ctx.reply as jest.Mock).mock.calls[1][1];
                expect(reply.reply_markup.inline_keyboard).toEqual(
                    expect.arrayContaining([
                        expect.arrayContaining([
                            expect.objectContaining({
                                text: '🔐 Start KYC Verification',
                                url: 'https://payout.copperx.io/app/kyc'
                            })
                        ])
                    ])
                );
            });

            it('should show complete KYC button for initiated status', async () => {
                // Arrange
                (kycService.getKycStatus as jest.Mock).mockResolvedValue(mockKycResponses.initiated);

                // Act
                await kycCommand(ctx);

                // Assert
                const reply = (ctx.reply as jest.Mock).mock.calls[1][1];
                expect(reply.reply_markup.inline_keyboard).toEqual(
                    expect.arrayContaining([
                        expect.arrayContaining([
                            expect.objectContaining({
                                text: '🔐 Complete KYC Verification',
                                url: 'https://payout.copperx.io/app/kyc'
                            })
                        ])
                    ])
                );
            });

            it('should show view KYC button for review status', async () => {
                // Arrange
                (kycService.getKycStatus as jest.Mock).mockResolvedValue(mockKycResponses.review);

                // Act
                await kycCommand(ctx);

                // Assert
                const reply = (ctx.reply as jest.Mock).mock.calls[1][1];
                expect(reply.reply_markup.inline_keyboard).toEqual(
                    expect.arrayContaining([
                        expect.arrayContaining([
                            expect.objectContaining({
                                text: '🔐 View KYC Verification',
                                url: 'https://payout.copperx.io/app/kyc'
                            })
                        ])
                    ])
                );
            });

            it('should always include back to menu button', async () => {
                // Arrange
                (kycService.getKycStatus as jest.Mock).mockResolvedValue(mockKycResponses.approved);

                // Act
                await kycCommand(ctx);

                // Assert
                const reply = (ctx.reply as jest.Mock).mock.calls[1][1];
                expect(reply.reply_markup.inline_keyboard).toEqual(
                    expect.arrayContaining([
                        expect.arrayContaining([
                            expect.objectContaining({ text: '🔙 Back to Menu' })
                        ])
                    ])
                );
            });
        });

        it('should handle service errors', async () => {
            // Arrange
            (kycService.getKycStatus as jest.Mock).mockRejectedValue(new Error('Service error'));

            // Act
            await kycCommand(ctx);

            // Assert
            expect(ctx.reply).toHaveBeenLastCalledWith(
                '❌ Something went wrong while checking your KYC status.\n' +
                'Please try again later or contact support if the issue persists.'
            );
        });
    });

    describe('kycStatusAction', () => {
        it('should answer callback query and check status', async () => {
            // Arrange
            (kycService.getKycStatus as jest.Mock).mockResolvedValue(mockKycResponses.approved);

            // Act
            await kycStatusAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.reply).toHaveBeenCalledWith('Checking your KYC status...');
        });

        it('should handle errors while maintaining callback', async () => {
            // Arrange
            (kycService.getKycStatus as jest.Mock).mockRejectedValue(new Error('Service error'));

            // Act
            await kycStatusAction(ctx);

            // Assert
            expect(ctx.answerCbQuery).toHaveBeenCalled();
            expect(ctx.reply).toHaveBeenLastCalledWith(
                '❌ Something went wrong while checking your KYC status.\n' +
                'Please try again later or contact support if the issue persists.'
            );
        });
    });
}); 