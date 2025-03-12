import { config } from './config';
import { validate } from './utils/validators';

try {
    validate.environment();
    console.log('✓ Environment validation passed');
} catch (error: any) {
    console.error('𐄂 Environment validation failed:', error.message);
    process.exit(1);
}

console.log(`✓ CopperX Telegram Bot starting in ${config.env.nodeEnv} mode...`);