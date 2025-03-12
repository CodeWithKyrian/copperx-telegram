import { environment } from "../config/environment";

/**
 * Validates that all required environment variables are set
 * @throws Error if any required environment variable is missing
 */
export const validateEnvironment = (): void => {
    const requiredVars = [
        { name: 'BOT_TOKEN', value: environment.bot.token },
    ];

    const missingVars = requiredVars.filter(v => !v.value);

    if (missingVars.length > 0) {
        const missingVarNames = missingVars.map(v => v.name).join(', ');
        throw new Error(`Missing required environment variables: ${missingVarNames}`);
    }
};

export const validate = {
    environment: validateEnvironment,
};