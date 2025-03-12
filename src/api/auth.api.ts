import apiClient from './client';
import {
    AuthenticateResponse,
    AuthUser,
    LoginEmailOtpRequest,
    LoginEmailOtpResponse,
    SuccessResponse,
    VerifyEmailOtpRequest,
    Web3AuthAuthenticateRequest
} from '../types/api.types';

/**
 * Auth API service for handling authentication-related endpoints
 */
export class AuthApi {

    public async loginEmailOtp(params: LoginEmailOtpRequest): Promise<LoginEmailOtpResponse> {
        return apiClient.post<LoginEmailOtpResponse>('/api/auth/email-otp/request', params);
    }

    public async verifyEmailOtp(params: VerifyEmailOtpRequest): Promise<AuthenticateResponse> {
        return apiClient.post<AuthenticateResponse>('/api/auth/email-otp/authenticate', params);
    }

    public async web3authAuthenticate(params: Web3AuthAuthenticateRequest): Promise<AuthenticateResponse> {
        return apiClient.post<AuthenticateResponse>('/api/auth/web3auth/authenticate', params);
    }

    public async logout(): Promise<SuccessResponse> {
        return apiClient.post<SuccessResponse>('/api/auth/logout');
    }

    public async getAuthUser(): Promise<AuthUser> {
        return apiClient.get<AuthUser>('/api/auth/me');
    }
}

export const authApi = new AuthApi();
export default authApi;