import { GlobalContext, GlobalSession } from '../types/session.types';

/**
 * Session utility functions for working with the bot's session data
 */
export const sessionUtils = {
    /**
     * Stores user preferences in the session
     */
    setPreferences: (ctx: GlobalContext, preferences: Partial<GlobalSession['preferences']>) => {
        if (!ctx.session) {
            return false;
        }
        ctx.session.preferences = {
            ...ctx.session.preferences,
            ...preferences,
        };
        return true;
    },

    /**
     * Gets user preferences from the session
     */
    getPreferences: (ctx: GlobalContext): GlobalSession['preferences'] => {
        return ctx.session?.preferences || {};
    },

    /**
     * Gets user language preference or default
     */
    getLanguage: (ctx: GlobalContext): string => {
        return ctx.session?.preferences?.language || 'en';
    },

    /**
     * Sets user language preference
     */
    setLanguage: (ctx: GlobalContext, language: string) => {
        if (!ctx.session) {
            return false;
        }

        if (!ctx.session.preferences) {
            ctx.session.preferences = {};
        }

        ctx.session.preferences.language = language;
        return true;
    },

    /**
     * Gets notification preferences
     */
    getNotificationsEnabled: (ctx: GlobalContext): boolean => {
        return ctx.session?.preferences?.notificationsEnabled !== false; // Default to true
    },

    /**
     * Sets notification preferences
     */
    setNotificationsEnabled: (ctx: GlobalContext, enabled: boolean) => {
        if (!ctx.session) {
            return false;
        }

        if (!ctx.session.preferences) {
            ctx.session.preferences = {};
        }

        ctx.session.preferences.notificationsEnabled = enabled;
        return true;
    }
};