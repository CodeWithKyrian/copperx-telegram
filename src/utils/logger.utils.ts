import pino from 'pino';
import { config } from '../config';

export const logger = pino({
    level: config.logging.level,
    timestamp: config.env.isDevelopment,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    },
    redact: [
        'req.headers.authorization',
        'req.headers["x-api-key"]',
        'req.headers["x-csrf-token"]',
        'token',
        'accessToken',
        'refreshToken',
        'apiKey',
        'apiSecret',
        'apiToken',
        'apiKey',
        'password',
        'otp'
    ]
});

// In production, we could add file logging
// if (config.env.isProduction) {
//   const streams = [
//     { stream: process.stdout },
//     { stream: pino.destination('logs/combined.log') },
//     { level: 'error', stream: pino.destination('logs/error.log') },
//   ];
//   logger = pino({ level: config.logging.level }, pino.multistream(streams));
// }

export default logger;