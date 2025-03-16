import { authApi } from '../api/auth.api';
import { AuthenticateResponse, AuthUser, LoginEmailOtpResponse } from '../types/api.types';
import apiClient from '../api/client';
import logger from '../utils/logger';
import { GlobalContext } from '../types';
import { Encryption } from '../utils/encryption.utils';
import { AuthSceneContext } from '../scenes/auth.scene';
import { notificationService } from './notification.service';

/**
 * Authentication service for handling user authentication
 */
export class AuthService {
    /**
     * Initiates email-based authentication by requesting an OTP
     * @param ctx Telegraf context with scene session
     * @param email User's email address
     * @returns Promise with the result of the operation
     */
    public async initiateEmailAuth(ctx: AuthSceneContext, email: string): Promise<LoginEmailOtpResponse> {
        try {
            // Request OTP to be sent to user's email
            const response = await authApi.loginEmailOtp({ email });

            // Store email and sid in scene session
            ctx.scene.session.email = email;
            ctx.scene.session.tempOtpSid = response.sid;
            ctx.scene.session.waitingForOtp = true;

            logger.info('Email authentication initiated', { email });

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
     * @param ctx Telegraf context with scene session
     * @param otp One-time password received by the user
     * @returns Promise with the user profile
     */
    public async verifyOtp(ctx: AuthSceneContext, otp: string): Promise<AuthUser> {
        try {
            const { email, tempOtpSid } = ctx.scene.session;

            if (!email || !tempOtpSid) {
                throw new Error('Missing authentication data. Please restart the login process.');
            }

            // Verify OTP with the API
            const authResponse = await authApi.verifyEmailOtp({
                email,
                otp,
                sid: tempOtpSid,
            });

            // Set token for API client
            apiClient.setAccessToken(authResponse.accessToken);

            // Update session with authentication data
            this.updateSessionAuth(ctx, authResponse);

            // Update user profile data in session
            this.updateSessionUserProfile(ctx, authResponse.user);

            // After successful login, subscribe to notifications if user has ID and organization ID
            if (ctx.from?.id && authResponse.user.organizationId) {
                notificationService.subscribeToDeposits(ctx.from.id, authResponse.user.organizationId);
            }

            logger.info('User authenticated successfully', {
                userId: authResponse.user.id,
                email: email,
            });

            return authResponse.user;
        } catch (error: any) {
            logger.error('Failed to verify OTP', {
                error: error.message,
            });
            throw error;
        }
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
            ctx.session.auth.email = userProfile.email;
        }
    }

    /**
     * Logs out the current user
     * @returns Promise with logout result
     */
    public async logout(ctx: GlobalContext): Promise<void> {
        // Unsubscribe from notifications if user has ID
        if (ctx.from?.id && ctx.session?.auth?.organizationId) {
            notificationService.unsubscribeFromDeposits(
                ctx.from.id,
                ctx.session.auth?.organizationId
            );
        } else if (ctx.from?.id) {
            // Fallback: unsubscribe from all channels if we don't have the org ID
            notificationService.unsubscribeAllForUser(ctx.from.id);
        }

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
            ctx.session.auth = { accessToken: undefined };
        }
    }

    /**
     * Checks if the current user is authenticated
     * @param ctx Telegraf context
     * @returns Whether the user is authenticated
     */
    public isAuthenticated(ctx: GlobalContext): boolean {
        if (!ctx.session?.auth?.accessToken) {
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
        if (!ctx.session?.auth?.accessToken) {
            return null;
        }

        try {
            return Encryption.decrypt(ctx.session.auth.accessToken);
        } catch (error) {
            logger.error('Failed to decrypt token', { error });
            this.handleAuthError(ctx);
            this.clearSessionAuth(ctx);
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

    /**
     * Handles authentication errors
     * @param ctx Telegraf context
     */
    public handleAuthError(ctx: GlobalContext): void {
        // Clean up notification subscriptions
        if (ctx.from?.id) {
            notificationService.unsubscribeAllForUser(ctx.from.id);
        }
    }
}

export const authService = new AuthService();
export default authService;