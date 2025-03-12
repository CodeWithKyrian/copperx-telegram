import { Context } from 'telegraf';
import { authApi } from '../api/auth.api';
import { AuthenticateResponse, AuthUser, LoginEmailOtpResponse } from '../types/api.types';
import apiClient from '../api/client';
import logger from '../utils/logger';

/**
 * Authentication service for handling user authentication
 */
export class AuthService {
    /**
     * Initiates email-based authentication by requesting an OTP
     * @param ctx Telegraf context
     * @param email User's email address
     * @returns Promise with the result of the operation
     */
    public async initiateEmailAuth(ctx: Context, email: string): Promise<LoginEmailOtpResponse> {
        try {
            // Request OTP to be sent to user's email
            const response = await authApi.loginEmailOtp({ email });

            // Store email and OTP sid in session for verification step
            if (ctx.session) {
                if (!ctx.session.auth) {
                    ctx.session.auth = { isAuthenticated: false };
                }

                ctx.session.auth.email = email;
                ctx.session.auth.tempOtpSid = response.sid;
            }

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
     * @param ctx Telegraf context
     * @param otp One-time password received by the user
     * @returns Promise with the user profile
     */
    public async verifyOtp(ctx: Context, otp: string): Promise<AuthUser> {
        try {
            if (!ctx.session?.auth?.email || !ctx.session?.auth?.tempOtpSid) {
                throw new Error('Authentication session not found. Please start the login process again.');
            }

            // Verify OTP with the API
            const authResponse = await authApi.verifyEmailOtp({
                email: ctx.session.auth.email,
                otp,
                sid: ctx.session.auth.tempOtpSid,
            });

            // Store authentication data in session
            await this.setAuthData(ctx, authResponse);

            // Fetch user profile
            const userProfile = await this.getCurrentUser(ctx);

            return userProfile;
        } catch (error: any) {
            logger.error('Failed to verify OTP', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Stores authentication data in session
     * @param ctx Telegraf context
     * @param authResponse Authentication response from API
     */
    private async setAuthData(ctx: Context, authResponse: AuthenticateResponse): Promise<void> {
        if (!ctx.session) {
            throw new Error('Session not available');
        }

        // Calculate token expiration
        const expiresAt = Date.now() + (authResponse.expireAt.getTime() - Date.now());

        // Set access token for API client
        apiClient.setAccessToken(authResponse.accessToken);

        // Update session with auth data
        ctx.session.auth = {
            isAuthenticated: true,
            accessToken: authResponse.accessToken,
            expiresAt,
            email: ctx.session.auth?.email,
        };

        logger.info('User authenticated successfully', {
            email: ctx.session.auth.email,
            expiresAt: new Date(expiresAt).toISOString(),
        });
    }

    /**
     * Gets the current authenticated user's profile
     * @param ctx Telegraf context
     * @returns Promise with user profile
     */
    public async getCurrentUser(ctx: Context): Promise<AuthUser> {
        try {
            if (!this.isAuthenticated(ctx)) {
                throw new Error('User is not authenticated');
            }

            const userProfile = await authApi.getAuthUser();

            if (ctx.session?.auth) {
                ctx.session.auth.userId = userProfile.id;
                ctx.session.auth.organizationId = userProfile.organizationId;
            }

            return userProfile;
        } catch (error: any) {
            logger.error('Failed to get current user profile', {
                error: error.message,
            });
            throw error;
        }
    }

    /**
     * Logs out the current user
     * @param ctx Telegraf context
     * @returns Promise with logout result
     */
    public async logout(ctx: Context): Promise<void> {
        try {
            if (this.isAuthenticated(ctx)) {
                await authApi.logout();
            }

            if (ctx.session) {
                ctx.session.auth = { isAuthenticated: false };
            }

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
     * Checks if the current user is authenticated
     * @param ctx Telegraf context
     * @returns Whether the user is authenticated
     */
    public isAuthenticated(ctx: Context): boolean {
        if (!ctx.session?.auth?.isAuthenticated || !ctx.session?.auth?.accessToken) {
            return false;
        }

        // Check if token is expired
        const now = Date.now();
        const expiresAt = ctx.session.auth.expiresAt || 0;

        return expiresAt > now;
    }
}

export const authService = new AuthService();
export default authService;