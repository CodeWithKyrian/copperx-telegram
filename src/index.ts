import { initBot } from './bot';
import { config } from './config';
import { validate } from './utils/validators';

try {
    validate.environment();
    console.log('✓ Environment validation passed');
} catch (error: any) {
    console.error('𐄂 Environment validation failed:', error.message);
    process.exit(1);
}

const bot = initBot();

bot.launch()
    .then(() => {
        console.log(`✓ CopperX Telegram Bot starting in ${config.env.nodeEnv} mode...`);
    })
    .catch((error: any) => {
        console.error('𐄂 CopperX Telegram Bot failed to start:', error.message);
        process.exit(1);
    });

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));