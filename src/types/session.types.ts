export interface SessionData {
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