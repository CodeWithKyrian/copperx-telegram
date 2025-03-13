import { authApi } from '../api/auth.api';
import { AuthenticateResponse, AuthUser, LoginEmailOtpResponse } from '../types/api.types';
import apiClient from '../api/client';
import logger from '../utils/logger';
import { GlobalContext } from '../types';
import { Encryption } from '../utils/encryption.utils';

/**
 * Authentication service for handling user authentication
 */
export class AuthService {
    /**
     * Initiates email-based authentication by requesting an OTP
     * @param email User's email address
     * @returns Promise with the result of the operation
     */
    public async initiateEmailAuth(email: string): Promise<LoginEmailOtpResponse> {
        try {
            // Request OTP to be sent to user's email
            const response = await authApi.loginEmailOtp({ email });
            return response;
        } catch (error: any) {
            logger.error('Failed to initiate email authentication', {
                error: error.message,
                email,
            });
            throw error;
        }
    }

    /**
     * Verifies OTP to complete authentication
     * @param email User's email address
     * @param otp One-time password received by the user
     * @param sid Session ID from the initial OTP request
     * @returns Promise with the user profile
     */
    public async verifyOtp(email: string, otp: string, sid: string): Promise<AuthUser> {
        try {
            // Verify OTP with the API
            const authResponse = await authApi.verifyEmailOtp({
                email,
                otp,
                sid,
            });

            // Store authentication data
            await this.setAuthToken(authResponse);

            // Fetch user profile
            const userProfile = await this.getCurrentUser();

            return userProfile;
        } catch (error: any) {
            logger.error('Failed to verify OTP', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Sets the authentication token in the API client
     * @param authResponse Authentication response from API
     */
    private async setAuthToken(authResponse: AuthenticateResponse): Promise<void> {
        // Set access token for API client
        apiClient.setAccessToken(authResponse.accessToken);

        logger.info('Authentication token set successfully', {
            expiresAt: authResponse.expireAt,
        });
    }

    /**
     * Updates the session with authentication data
     * @param ctx Telegraf context
     * @param authResponse Authentication response
     */
    public updateSessionAuth(ctx: GlobalContext, authResponse: AuthenticateResponse): void {
        if (!ctx.session) {
            throw new Error('Session not available');
        }

        // Parse date string to get expiration time in milliseconds
        let expiresAtMs: number;
        try {
            expiresAtMs = new Date(authResponse.expireAt).getTime();
        } catch (error) {
            // If parsing fails, default to 24 hours from now
            logger.warn('Failed to parse expiration date, using default', {
                expireAt: authResponse.expireAt
            });
            expiresAtMs = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        }

        // Encrypt the access token before storing in session
        const encryptedToken = Encryption.encrypt(authResponse.accessToken);

        // Update session with auth data
        ctx.session.auth = {
            isAuthenticated: true,
            accessToken: encryptedToken, // Store encrypted token
            expiresAt: expiresAtMs,
            email: ctx.session.auth?.email,
        };

        logger.info('User authenticated successfully', {
            email: ctx.session.auth.email,
            expiresAt: new Date(expiresAtMs).toISOString(),
        });
    }

    /**
     * Gets the current authenticated user's profile
     * @returns Promise with user profile
     */
    public async getCurrentUser(): Promise<AuthUser> {
        try {
            const userProfile = await authApi.getAuthUser();
            return userProfile;
        } catch (error: any) {
            logger.error('Failed to get current user profile', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Updates the session with user profile data
     * @param ctx Telegraf context
     * @param userProfile User profile data
     */
    public updateSessionUserProfile(ctx: GlobalContext, userProfile: AuthUser): void {
        if (ctx.session?.auth) {
            ctx.session.auth.userId = userProfile.id;
            ctx.session.auth.organizationId = userProfile.organizationId;
        }
    }

    /**
     * Logs out the current user
     * @returns Promise with logout result
     */
    public async logout(): Promise<void> {
        try {
            await authApi.logout();
            apiClient.setAccessToken(null);
            logger.info('User logged out successfully');
        } catch (error: any) {
            logger.error('Failed to logout', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Clears the authentication data from session
     * @param ctx Telegraf context
     */
    public clearSessionAuth(ctx: GlobalContext): void {
        if (ctx.session) {
            ctx.session.auth = { isAuthenticated: false };
        }
    }

    /**
     * Checks if the current user is authenticated
     * @param ctx Telegraf context
     * @returns Whether the user is authenticated
     */
    public isAuthenticated(ctx: GlobalContext): boolean {
        if (!ctx.session?.auth?.isAuthenticated || !ctx.session?.auth?.accessToken) {
            return false;
        }

        // Check if token is expired
        const now = Date.now();
        const expiresAt = ctx.session.auth.expiresAt || 0;

        return expiresAt > now;
    }

    /**
     * Gets the decrypted token from session for API requests
     * @param ctx Telegraf context
     * @returns Decrypted access token or null if not available
     */
    public getDecryptedToken(ctx: GlobalContext): string | null {
        if (!ctx.session?.auth?.accessToken || !ctx.session.auth.isAuthenticated) {
            return null;
        }

        try {
            return Encryption.decrypt(ctx.session.auth.accessToken);
        } catch (error) {
            logger.error('Failed to decrypt token', { error });
            return null;
        }
    }

    /**
     * Sets up the API client with the current user's token
     * @param ctx Telegraf context
     */
    public setupApiClientForRequest(ctx: GlobalContext): void {
        const token = this.getDecryptedToken(ctx);
        apiClient.setAccessToken(token);
    }
}

export const authService = new AuthService();
export default authService;