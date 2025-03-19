import { authService } from '../../src/services/auth.service';
import { Encryption } from '../../src/utils/encryption.utils';
import apiClient from '../../src/api/client';
import { authApi } from '../../src/api/auth.api';
import { AuthenticateResponse } from '../../src/types/api.types';
import { createMockContext } from '../__mocks__/context.mock';
import { mockAuthUser } from '../__mocks__/auth.mock';
import { notificationService } from '../../src/services/notification.service';
import logger from '../../src/utils/logger.utils';

// Mock dependencies
jest.mock('../../src/api/auth.api');
jest.mock('../../src/api/client');
jest.mock('../../src/utils/encryption.utils');
jest.mock('../../src/utils/logger.utils');
jest.mock('../../src/services/notification.service');

describe('Auth Service', () => {
    // Test data
    const mockEmail = 'test@example.com';
    const mockOtp = '123456';
    const mockSid = 'session-id-123';
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const mockEncryptedToken = 'iv-hex:encrypted-token-data';
    const mockAuthResponse: AuthenticateResponse = {
        scheme: 'Bearer',
        accessToken: mockToken,
        accessTokenId: 'token-id-123',
        expireAt: '2023-12-31T23:59:59Z',
        user: { ...mockAuthUser }
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Default mocks
        (Encryption.encrypt as jest.Mock).mockReturnValue(mockEncryptedToken);
        (Encryption.decrypt as jest.Mock).mockReturnValue(mockToken);
    });

    describe('initiateEmailAuth', () => {
        const mockResponse = { email: mockEmail, sid: mockSid };

        beforeEach(() => {
            (authApi.loginEmailOtp as jest.Mock).mockResolvedValue(mockResponse);
        });

        it('should request OTP and update scene session', async () => {
            // Arrange
            const ctx = createMockContext();
            ctx.scene = {
                session: {}
            } as any;

            // Act
            const result = await authService.initiateEmailAuth(ctx as any, mockEmail);

            // Assert
            expect(authApi.loginEmailOtp).toHaveBeenCalledWith({ email: mockEmail });
            expect(ctx.scene.session).toEqual({
                email: mockEmail,
                tempOtpSid: mockSid,
                waitingForOtp: true
            });
            expect(result).toEqual(mockResponse);
            expect(logger.info).toHaveBeenCalledWith('Email authentication initiated', { email: mockEmail });
        });

        it('should handle and log errors', async () => {
            // Arrange
            const mockError = new Error('API error');
            (authApi.loginEmailOtp as jest.Mock).mockRejectedValueOnce(mockError);
            const ctx = createMockContext();
            ctx.scene = { session: {} } as any;

            // Act & Assert
            await expect(authService.initiateEmailAuth(ctx as any, mockEmail))
                .rejects.toThrow(mockError);

            expect(logger.error).toHaveBeenCalledWith(
                'Failed to initiate email authentication',
                expect.objectContaining({
                    error: mockError.message,
                    email: mockEmail
                })
            );
        });
    });

    describe('verifyOtp', () => {
        beforeEach(() => {
            (authApi.verifyEmailOtp as jest.Mock).mockResolvedValue(mockAuthResponse);
        });

        it('should verify OTP and complete authentication flow', async () => {
            // Arrange
            const ctx = createMockContext({
                from: { id: 123456789 }
            });

            ctx.scene = {
                session: {
                    email: mockEmail,
                    tempOtpSid: mockSid
                }
            } as any;

            // Act
            const result = await authService.verifyOtp(ctx as any, mockOtp);

            // Assert
            expect(authApi.verifyEmailOtp).toHaveBeenCalledWith({
                email: mockEmail,
                otp: mockOtp,
                sid: mockSid
            });

            expect(apiClient.setAccessToken).toHaveBeenCalledWith(mockToken);
            expect(result).toEqual(mockAuthResponse.user);
            expect(logger.info).toHaveBeenCalledWith(
                'User authenticated successfully',
                expect.objectContaining({
                    userId: mockAuthResponse.user.id,
                    email: mockEmail
                })
            );
        });

        it('should set up notifications for authenticated user', async () => {
            // Arrange
            const userId = 123456789;
            const ctx = createMockContext({
                from: { id: userId }
            });

            ctx.scene = {
                session: {
                    email: mockEmail,
                    tempOtpSid: mockSid
                }
            } as any;

            // Act
            await authService.verifyOtp(ctx as any, mockOtp);

            // Assert
            expect(notificationService.subscribeToDeposits).toHaveBeenCalledWith(
                userId,
                mockAuthResponse.user.organizationId
            );
        });

        it('should throw error when scene session is missing required data', async () => {
            // Arrange
            const ctx = createMockContext();
            ctx.scene = { session: {} } as any;

            // Act & Assert
            await expect(authService.verifyOtp(ctx as any, mockOtp))
                .rejects.toThrow('Missing authentication data');
        });

        it('should not set up notifications when user ID is missing', async () => {
            // Arrange
            const ctx = createMockContext({
                from: undefined // No user ID
            });

            ctx.scene = {
                session: {
                    email: mockEmail,
                    tempOtpSid: mockSid
                }
            } as any;

            // Act
            await authService.verifyOtp(ctx as any, mockOtp);

            // Assert
            expect(notificationService.subscribeToDeposits).not.toHaveBeenCalled();
        });

        it('should handle and log API errors', async () => {
            // Arrange
            const mockError = new Error('Invalid OTP');
            (authApi.verifyEmailOtp as jest.Mock).mockRejectedValueOnce(mockError);

            const ctx = createMockContext();
            ctx.scene = {
                session: {
                    email: mockEmail,
                    tempOtpSid: mockSid
                }
            } as any;

            // Act & Assert
            await expect(authService.verifyOtp(ctx as any, mockOtp))
                .rejects.toThrow(mockError);

            expect(logger.error).toHaveBeenCalledWith(
                'Failed to verify OTP',
                expect.objectContaining({
                    error: mockError.message
                })
            );
        });
    });

    describe('updateSessionAuth', () => {
        it('should encrypt and store the token with expiration time', () => {
            // Arrange
            const ctx = createMockContext();
            const expectedExpiryMs = new Date(mockAuthResponse.expireAt).getTime();

            // Act
            authService.updateSessionAuth(ctx, mockAuthResponse);

            // Assert
            expect(Encryption.encrypt).toHaveBeenCalledWith(mockToken);
            expect(ctx.session.auth).toEqual({
                accessToken: mockEncryptedToken,
                expiresAt: expectedExpiryMs,
                email: ctx.session.auth?.email
            });
        });

        it('should throw error when session is not available', () => {
            // Arrange
            const ctxWithoutSession = {} as any;

            // Act & Assert
            expect(() => {
                authService.updateSessionAuth(ctxWithoutSession, mockAuthResponse);
            }).toThrow('Session not available');
        });
    });

    describe('getCurrentUser', () => {
        it('should fetch and return user profile', async () => {
            // Arrange
            (authApi.getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);

            // Act
            const result = await authService.getCurrentUser();

            // Assert
            expect(authApi.getAuthUser).toHaveBeenCalled();
            expect(result).toEqual(mockAuthUser);
        });

        it('should handle and log API errors', async () => {
            // Arrange
            const mockError = new Error('API error');
            (authApi.getAuthUser as jest.Mock).mockRejectedValue(mockError);

            // Act & Assert
            await expect(authService.getCurrentUser())
                .rejects.toThrow(mockError);

            expect(logger.error).toHaveBeenCalledWith(
                'Failed to get current user profile',
                expect.objectContaining({
                    error: mockError.message
                })
            );
        });
    });

    describe('updateSessionUserProfile', () => {
        it('should update session with user profile information', () => {
            // Arrange
            const ctx = createMockContext();

            // Ensure auth object is properly set up
            ctx.session.auth = {
                ...ctx.session.auth,
                // Initialize with empty values to make sure they're replaced
                userId: undefined,
                organizationId: undefined,
                email: undefined
            };

            // Act
            authService.updateSessionUserProfile(ctx, mockAuthUser);

            // Assert - use hasOwnProperty() to check if the property exists
            expect(ctx.session.auth.userId).toBe(mockAuthUser.id);
            expect(ctx.session.auth.organizationId).toBe(mockAuthUser.organizationId);
            expect(ctx.session.auth.email).toBe(mockAuthUser.email);
        });

        it('should do nothing when session auth is undefined', () => {
            // Arrange
            const ctx = createMockContext();
            ctx.session.auth = undefined as any;

            // Act & Assert - should not throw
            authService.updateSessionUserProfile(ctx, mockAuthUser);
        });
    });

    describe('logout', () => {
        beforeEach(() => {
            (authApi.logout as jest.Mock).mockResolvedValue(undefined);
        });

        it('should log out user and unsubscribe from notifications', async () => {
            // Arrange
            const userId = 123456789;
            const orgId = 'org-123';
            const ctx = createMockContext({
                from: { id: userId }
            });

            ctx.session.auth = {
                ...ctx.session.auth,
                organizationId: orgId
            };

            // Act
            await authService.logout(ctx);

            // Assert
            expect(authApi.logout).toHaveBeenCalled();
            expect(apiClient.setAccessToken).toHaveBeenCalledWith(null);
            expect(notificationService.unsubscribeFromDeposits).toHaveBeenCalledWith(userId, orgId);
            expect(logger.info).toHaveBeenCalledWith('User logged out successfully');
        });

        it('should unsubscribe from all when organization ID is missing', async () => {
            // Arrange
            const userId = 123456789;
            const ctx = createMockContext({
                from: { id: userId }
            });

            ctx.session.auth = {
                ...ctx.session.auth,
                organizationId: undefined
            };

            // Act
            await authService.logout(ctx);

            // Assert
            expect(notificationService.unsubscribeAllForUser).toHaveBeenCalledWith(userId);
        });

        it('should skip notification unsubscribe when user ID is missing', async () => {
            // Arrange
            const ctx = createMockContext({
                from: undefined // No user ID
            });

            // Act
            await authService.logout(ctx);

            // Assert
            expect(notificationService.unsubscribeFromDeposits).not.toHaveBeenCalled();
            expect(notificationService.unsubscribeAllForUser).not.toHaveBeenCalled();
        });

        it('should handle and log API errors', async () => {
            // Arrange
            const mockError = new Error('API error');
            (authApi.logout as jest.Mock).mockRejectedValueOnce(mockError);

            const ctx = createMockContext();

            // Act & Assert
            await expect(authService.logout(ctx))
                .rejects.toThrow(mockError);

            expect(logger.error).toHaveBeenCalledWith(
                'Failed to logout',
                expect.objectContaining({
                    error: mockError.message
                })
            );
        });
    });

    describe('clearSessionAuth', () => {
        it('should clear auth data from session', () => {
            // Arrange
            const ctx = createMockContext();
            ctx.session.auth = {
                accessToken: mockEncryptedToken,
                expiresAt: 1234567890,
                email: mockEmail
            };

            // Act
            authService.clearSessionAuth(ctx);

            // Assert
            expect(ctx.session.auth).toEqual({ accessToken: undefined });
        });

        it('should do nothing when session is undefined', () => {
            // Arrange
            const ctxWithoutSession = {} as any;

            // Act & Assert - should not throw
            authService.clearSessionAuth(ctxWithoutSession);
        });
    });

    describe('isAuthenticated', () => {
        it('should return true when token is valid and not expired', () => {
            // Arrange
            const ctx = createMockContext();
            const futureTime = Date.now() + 3600000; // 1 hour in future

            ctx.session.auth = {
                accessToken: mockEncryptedToken,
                expiresAt: futureTime,
                email: mockEmail
            };

            // Act
            const result = authService.isAuthenticated(ctx);

            // Assert
            expect(result).toBe(true);
        });

        it('should return false when token is expired', () => {
            // Arrange
            const ctx = createMockContext();
            const pastTime = Date.now() - 3600000; // 1 hour in past

            ctx.session.auth = {
                accessToken: mockEncryptedToken,
                expiresAt: pastTime,
                email: mockEmail
            };

            // Act
            const result = authService.isAuthenticated(ctx);

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when token is missing', () => {
            // Arrange
            const ctx = createMockContext();
            ctx.session.auth = {
                accessToken: undefined,
                expiresAt: Date.now() + 3600000,
                email: mockEmail
            };

            // Act
            const result = authService.isAuthenticated(ctx);

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when auth is missing', () => {
            // Arrange
            const ctx = createMockContext();
            ctx.session.auth = undefined as any;

            // Act
            const result = authService.isAuthenticated(ctx);

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when session is missing', () => {
            // Arrange
            const ctx = {} as any;

            // Act
            const result = authService.isAuthenticated(ctx);

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('getDecryptedToken', () => {
        it('should decrypt and return the token', () => {
            // Arrange
            const ctx = createMockContext();
            ctx.session.auth = {
                ...ctx.session.auth,
                accessToken: mockEncryptedToken
            };

            // Act
            const result = authService.getDecryptedToken(ctx);

            // Assert
            expect(Encryption.decrypt).toHaveBeenCalledWith(mockEncryptedToken);
            expect(result).toBe(mockToken);
        });

        it('should return null when token is missing', () => {
            // Arrange
            const ctx = createMockContext();
            ctx.session.auth = {
                ...ctx.session.auth,
                accessToken: undefined
            };

            // Act
            const result = authService.getDecryptedToken(ctx);

            // Assert
            expect(Encryption.decrypt).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        it('should handle decryption errors and clear auth', () => {
            // Arrange
            const ctx = createMockContext();
            ctx.session.auth = {
                ...ctx.session.auth,
                accessToken: mockEncryptedToken
            };

            const mockError = new Error('Decryption error');
            (Encryption.decrypt as jest.Mock).mockImplementationOnce(() => {
                throw mockError;
            });

            // Spy on methods that should be called
            jest.spyOn(authService, 'handleAuthError');
            jest.spyOn(authService, 'clearSessionAuth');

            // Act
            const result = authService.getDecryptedToken(ctx);

            // Assert
            expect(logger.error).toHaveBeenCalledWith(
                'Failed to decrypt token',
                expect.objectContaining({ error: mockError })
            );
            expect(authService.handleAuthError).toHaveBeenCalledWith(ctx);
            expect(authService.clearSessionAuth).toHaveBeenCalledWith(ctx);
            expect(result).toBeNull();
        });
    });

    describe('setupApiClientForRequest', () => {
        it('should set access token in API client', () => {
            // Arrange
            const ctx = createMockContext();
            ctx.session.auth = {
                ...ctx.session.auth,
                accessToken: mockEncryptedToken
            };

            // Act
            authService.setupApiClientForRequest(ctx);

            // Assert
            expect(apiClient.setAccessToken).toHaveBeenCalledWith(mockToken);
        });

        it('should handle missing token gracefully', () => {
            // Arrange
            const ctx = createMockContext();
            ctx.session.auth = {
                ...ctx.session.auth,
                accessToken: undefined
            };

            // Spy on getDecryptedToken
            jest.spyOn(authService, 'getDecryptedToken').mockReturnValueOnce(null);

            // Act
            authService.setupApiClientForRequest(ctx);

            // Assert
            expect(apiClient.setAccessToken).toHaveBeenCalledWith(null);
        });
    });

    describe('handleAuthError', () => {
        it('should unsubscribe user from all notifications', () => {
            // Arrange
            const userId = 123456789;
            const ctx = createMockContext({
                from: { id: userId }
            });

            // Act
            authService.handleAuthError(ctx);

            // Assert
            expect(notificationService.unsubscribeAllForUser).toHaveBeenCalledWith(userId);
        });

        it('should do nothing when user ID is missing', () => {
            // Arrange
            const ctx = createMockContext({
                from: undefined // No user ID
            });

            // Act - should not throw
            authService.handleAuthError(ctx);

            // Assert
            expect(notificationService.unsubscribeAllForUser).not.toHaveBeenCalled();
        });
    });
}); 