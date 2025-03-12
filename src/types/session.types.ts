export interface AuthState {
    isAuthenticated: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number; // timestamp when token expires
    email?: string; // user's email
    userId?: string;
    organizationId?: string;
    tempOtpSid?: string; // temporary session ID for OTP flow
}

export interface SessionData {
    auth?: AuthState;

    preferences?: {
        language?: string;
        notificationsEnabled?: boolean;
    };

    createdAt?: number;
    updatedAt?: number;
}

declare module 'telegraf' {
    interface Context {
        session: SessionData;
    }
}