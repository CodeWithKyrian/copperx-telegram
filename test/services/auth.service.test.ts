import { authService } from '../../src/services/auth.service';
import { Encryption } from '../../src/utils/encryption.utils';
import apiClient from '../../src/api/client';
import { authApi } from '../../src/api/auth.api';
import { AuthenticateResponse, AuthUser } from '../../src/types';

// Mock dependencies
jest.mock('../../src/api/auth.api');
jest.mock('../../src/api/client');
jest.mock('../../src/utils/encryption.utils');
jest.mock('../../src/utils/logger');

describe('AuthService', () => {
    // Sample test data
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
        user: {
            id: 'user-123',
            email: mockEmail,
            role: 'user',
            status: 'active',
            type: 'individual',
            relayerAddress: '0x123',
        }
    };
    const mockUserProfile: AuthUser = {
        id: 'user-123',
        email: mockEmail,
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
        status: 'active',
        type: 'individual',
        relayerAddress: '0x123',
        organizationId: 'org-123',
    };

    // Mock context with session
    const mockCtx = {
        session: {
            auth: {
                isAuthenticated: false,
                email: mockEmail,
            }
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup encryption mock
        (Encryption.encrypt as jest.Mock).mockReturnValue(mockEncryptedToken);
        (Encryption.decrypt as jest.Mock).mockReturnValue(mockToken);
    });

    describe('verifyOtp', () => {
        it('should verify OTP and return user profile', async () => {
            // Mock API responses
            (authApi.verifyEmailOtp as jest.Mock).mockResolvedValue(mockAuthResponse);
            (authApi.getAuthUser as jest.Mock).mockResolvedValue(mockUserProfile);

            const result = await authService.verifyOtp(mockEmail, mockOtp, mockSid);

            // Verify API was called with correct parameters
            expect(authApi.verifyEmailOtp).toHaveBeenCalledWith({
                email: mockEmail,
                otp: mockOtp,
                sid: mockSid,
            });

            // Verify token was set in API client
            expect(apiClient.setAccessToken).toHaveBeenCalledWith(mockToken);

            // Verify returned user profile
            expect(result).toEqual(mockUserProfile);
        });

        it('should handle errors during OTP verification', async () => {
            // Mock API error
            const mockError = new Error('Invalid OTP');
            (authApi.verifyEmailOtp as jest.Mock).mockRejectedValue(mockError);

            await expect(authService.verifyOtp(mockEmail, mockOtp, mockSid))
                .rejects.toThrow(mockError);
        });
    });

    describe('updateSessionAuth', () => {
        it('should encrypt token and update session with auth data', () => {
            authService.updateSessionAuth(mockCtx as any, mockAuthResponse);

            // Verify token was encrypted
            expect(Encryption.encrypt).toHaveBeenCalledWith(mockToken);

            // Verify session was updated with encrypted token
            expect(mockCtx.session.auth).toEqual({
                isAuthenticated: true,
                accessToken: mockEncryptedToken,
                expiresAt: expect.any(Number),
                email: mockEmail,
            });
        });

        it('should throw error if session is not available', () => {
            const ctxWithoutSession = { /* empty context */ };

            expect(() => {
                authService.updateSessionAuth(ctxWithoutSession as any, mockAuthResponse);
            }).toThrow('Session not available');
        });
    });

    describe('getDecryptedToken', () => {
        it('should return decrypted token from session', () => {
            // Setup authenticated session with encrypted token
            const authenticatedCtx = {
                session: {
                    auth: {
                        isAuthenticated: true,
                        accessToken: mockEncryptedToken,
                    }
                }
            };

            const token = authService.getDecryptedToken(authenticatedCtx as any);

            // Verify token was decrypted
            expect(Encryption.decrypt).toHaveBeenCalledWith(mockEncryptedToken);
            expect(token).toEqual(mockToken);
        });

        it('should return null if not authenticated', () => {
            // Setup unauthenticated session
            const unauthenticatedCtx = {
                session: {
                    auth: {
                        isAuthenticated: false,
                        accessToken: mockEncryptedToken,
                    }
                }
            };

            const token = authService.getDecryptedToken(unauthenticatedCtx as any);

            // Verify no decryption attempt and null return
            expect(Encryption.decrypt).not.toHaveBeenCalled();
            expect(token).toBeNull();
        });

        it('should return null if token is not in session', () => {
            // Setup session without token
            const ctxWithoutToken = {
                session: {
                    auth: {
                        isAuthenticated: true,
                        // No accessToken
                    }
                }
            };

            const token = authService.getDecryptedToken(ctxWithoutToken as any);

            // Verify no decryption attempt and null return
            expect(Encryption.decrypt).not.toHaveBeenCalled();
            expect(token).toBeNull();
        });
    });

    describe('setupApiClientForRequest', () => {
        it('should set up API client with decrypted token', () => {
            // Setup authenticated session with encrypted token
            const authenticatedCtx = {
                session: {
                    auth: {
                        isAuthenticated: true,
                        accessToken: mockEncryptedToken,
                    }
                }
            };

            authService.setupApiClientForRequest(authenticatedCtx as any);

            // Verify token was decrypted and set in API client
            expect(Encryption.decrypt).toHaveBeenCalledWith(mockEncryptedToken);
            expect(apiClient.setAccessToken).toHaveBeenCalledWith(mockToken);
        });
    });
}); 