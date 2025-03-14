import { Context, Scenes } from "telegraf";
import { WizardContextWizard } from "telegraf/typings/scenes";


export interface GlobalSceneSession extends Scenes.WizardSessionData {
    // available under `ctx.scene.session`
}

export interface GlobalSession extends Scenes.SceneSession<GlobalSceneSession> {
    // available under `ctx.session`
    auth?: AuthState;
    rateLimits?: RateLimitsContainer;
    preferences?: {
        language?: string;
        notificationsEnabled?: boolean;
    };
    createdAt?: number;
    updatedAt?: number;
}


export interface GlobalContext<T extends Scenes.WizardSessionData = Scenes.WizardSessionData> extends Context {
    session: GlobalSession & Scenes.WizardSession<T>;
    scene: Scenes.SceneContextScene<GlobalContext<T>, T>;
    wizard: WizardContextWizard<GlobalContext<T>>;
}

export interface AuthState {
    accessToken?: string;
    expiresAt?: number;
    email?: string;
    userId?: string;
    organizationId?: string;
    tempOtpSid?: string;
}

export interface RateLimitRecord {
    attempts: number;
    resetAt: number;
}

export interface RateLimitsContainer {
    [key: string]: RateLimitRecord;
}
