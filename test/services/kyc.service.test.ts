import { kycService } from '../../src/services/kyc.service';
import kycApi from '../../src/api/kyc.api';
import { authService } from '../../src/services/auth.service';
import { createMockContext } from '../__mocks__/context.mock';
import { mockAuthUser } from '../__mocks__/auth.mock';
import logger from '../../src/utils/logger.utils';
import { KycStatus } from '../../src/types/api.types';

// Mock dependencies
jest.mock('../../src/api/kyc.api');
jest.mock('../../src/services/auth.service');
jest.mock('../../src/utils/logger.utils');

describe('KYC Service', () => {
    const mockEmail = 'test@example.com';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getKycStatus', () => {
        describe('with authenticated user with email in session', () => {
            it('should fetch and return verified status', async () => {
                // Arrange
                const status: KycStatus = 'approved';
                (kycApi.getKycStatusFromEmail as jest.Mock).mockResolvedValue(status);

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: mockEmail
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(kycApi.getKycStatusFromEmail).toHaveBeenCalledWith(mockEmail);
                expect(result).toEqual({
                    status,
                    message: expect.stringContaining('KYC Status: ✅ Approved')
                });
            });

            it('should fetch and return pending status', async () => {
                // Arrange
                const status: KycStatus = 'pending';
                (kycApi.getKycStatusFromEmail as jest.Mock).mockResolvedValue(status);

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: mockEmail
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(result).toEqual({
                    status,
                    message: expect.stringContaining('KYC Status: ⏳ Pending')
                });
                expect(result.message).toContain('Please complete the required steps');
            });

            it('should fetch and return rejected status', async () => {
                // Arrange
                const status: KycStatus = 'rejected';
                (kycApi.getKycStatusFromEmail as jest.Mock).mockResolvedValue(status);

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: mockEmail
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(result).toEqual({
                    status,
                    message: expect.stringContaining('KYC Status: ❌ Rejected')
                });
                expect(result.message).toContain('Unfortunately, your verification was not successful');
            });

            it('should fetch and return in review status', async () => {
                // Arrange
                const status: KycStatus = 'review';
                (kycApi.getKycStatusFromEmail as jest.Mock).mockResolvedValue(status);

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: mockEmail
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(result).toEqual({
                    status,
                    message: expect.stringContaining('KYC Status: 📝 Review')
                });
                expect(result.message).toContain('currently being reviewed');
            });

            it('should fetch and return on hold status', async () => {
                // Arrange
                const status: KycStatus = 'on_hold';
                (kycApi.getKycStatusFromEmail as jest.Mock).mockResolvedValue(status);

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: mockEmail
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(result).toEqual({
                    status,
                    message: expect.stringContaining('KYC Status: ⏸️ On Hold')
                });
                expect(result.message).toContain('currently on hold');
            });

            it('should fetch and return expired status', async () => {
                // Arrange
                const status: KycStatus = 'expired';
                (kycApi.getKycStatusFromEmail as jest.Mock).mockResolvedValue(status);

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: mockEmail
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(result).toEqual({
                    status,
                    message: expect.stringContaining('KYC Status: ⌛ Expired')
                });
                expect(result.message).toContain('has expired');
            });
        });

        describe('with authenticated user but no email in session', () => {
            it('should get email from user profile', async () => {
                // Arrange
                const status: KycStatus = 'approved';
                (kycApi.getKycStatusFromEmail as jest.Mock).mockResolvedValue(status);
                (authService.getCurrentUser as jest.Mock).mockResolvedValue(mockAuthUser);

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: undefined // No email in session
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(authService.getCurrentUser).toHaveBeenCalled();
                expect(kycApi.getKycStatusFromEmail).toHaveBeenCalledWith(mockAuthUser.email);
                expect(result).toEqual({
                    status,
                    message: expect.stringContaining('KYC Status: ✅ Approved')
                });
            });

            it('should handle missing email in both session and profile', async () => {
                // Arrange
                (authService.getCurrentUser as jest.Mock).mockResolvedValue({
                    ...mockAuthUser,
                    email: undefined // No email in profile
                });

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: undefined // No email in session
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(result).toEqual({
                    status: null,
                    message: '❌ You need to log in first to check your KYC status.'
                });
            });
        });

        describe('with unauthenticated user', () => {
            it('should indicate login requirement', async () => {
                // Arrange
                const ctx = createMockContext({
                    session: {
                        auth: undefined // No auth in session
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(result).toEqual({
                    status: null,
                    message: '❌ You need to log in first to check your KYC status.'
                });
            });
        });

        describe('error handling', () => {
            it('should handle KYC API errors', async () => {
                // Arrange
                const mockError = new Error('API error');
                (kycApi.getKycStatusFromEmail as jest.Mock).mockRejectedValue(mockError);

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: mockEmail
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(logger.error).toHaveBeenCalledWith(
                    'Error fetching KYC status',
                    expect.objectContaining({
                        error: mockError,
                        email: mockEmail
                    })
                );
                expect(result).toEqual({
                    status: null,
                    message: '❌ Unable to retrieve your KYC status. Please try again later.'
                });
            });

            it('should handle when no KYC record is found', async () => {
                // Arrange
                (kycApi.getKycStatusFromEmail as jest.Mock).mockResolvedValue(null);

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: mockEmail
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(result).toEqual({
                    status: null,
                    message: '🔍 No KYC verification record found. Please start the verification process.'
                });
            });

            it('should handle unexpected errors', async () => {
                // Arrange
                const mockError = new Error('Unexpected error');
                (authService.getCurrentUser as jest.Mock).mockRejectedValue(mockError);

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: undefined
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(logger.error).toHaveBeenCalledWith(
                    'Error in KYC service',
                    expect.objectContaining({
                        error: mockError
                    })
                );
                expect(result).toEqual({
                    status: null,
                    message: '❌ An unexpected error occurred. Please try again later.'
                });
            });
        });
    });

    describe('formatStatusText', () => {
        it('should properly format status text with underscores', () => {
            // Test this internal method by checking the output message format
            const status: KycStatus = 'provider_manual_review';
            (kycApi.getKycStatusFromEmail as jest.Mock).mockResolvedValue(status);

            const ctx = createMockContext({
                session: {
                    auth: {
                        email: mockEmail
                    }
                }
            });

            // Act
            return kycService.getKycStatus(ctx).then(result => {
                // Assert - check for properly formatted status in the message
                expect(result.message).toContain('KYC Status: 👨‍💼 Provider Manual Review');
            });
        });
    });

    describe('formatKycStatusMessage', () => {
        it('should handle null status', async () => {
            // Arrange
            (kycApi.getKycStatusFromEmail as jest.Mock).mockResolvedValue(null);

            const ctx = createMockContext({
                session: {
                    auth: {
                        email: mockEmail
                    }
                }
            });

            // Act
            const result = await kycService.getKycStatus(ctx);

            // Assert
            expect(result.message).toContain('No KYC verification record found');
        });

        it('should include appropriate emoji for each status', async () => {
            // Test a few status types with their expected emojis
            const statusEmojis: Record<KycStatus, string> = {
                'approved': '✅',
                'rejected': '❌',
                'pending': '⏳',
                'inprogress': '🔄',
                'review': '📝',
                'on_hold': '⏸️',
                'expired': '⌛',
                'initiated': '🔄',
                'review_pending': '📝',
                'provider_manual_review': '👨‍💼',
                'manual_review': '👨‍💼',
                'provider_on_hold': '⏸️'
            };

            // Test a few key statuses
            for (const [status, emoji] of Object.entries(statusEmojis)) {
                // Arrange
                (kycApi.getKycStatusFromEmail as jest.Mock).mockResolvedValue(status as KycStatus);

                const ctx = createMockContext({
                    session: {
                        auth: {
                            email: mockEmail
                        }
                    }
                });

                // Act
                const result = await kycService.getKycStatus(ctx);

                // Assert
                expect(result.message).toContain(`${emoji}`);
            }
        });
    });
}); 