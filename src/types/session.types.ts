import { Context, Scenes } from "telegraf";

export interface AuthState {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number; // timestamp when token expires
    email?: string; // user's email
    userId?: string;
    organizationId?: string;
    tempOtpSid?: string; // temporary session ID for OTP flow
}

export interface GlobalSessionData extends Scenes.SceneSessionData {

}

export interface GlobalSession extends Scenes.SceneSession<GlobalSessionData> {
    auth?: AuthState;

    rateLimits?: RateLimitsContainer;

    preferences?: {
        language?: string;
        notificationsEnabled?: boolean;
    };

    createdAt?: number;
    updatedAt?: number;
}

export interface GlobalContext extends Context {
    session: GlobalSession;
    scene: Scenes.SceneContextScene<GlobalContext, GlobalSessionData>;
}

export interface RateLimitRecord {
    attempts: number;
    resetAt: number;
}

export interface RateLimitsContainer {
    [key: string]: RateLimitRecord;
}
