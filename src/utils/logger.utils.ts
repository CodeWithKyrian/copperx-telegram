import { createLogger, format, transports } from 'winston';
import { config } from '../config';

// Create a Winston logger instance
export const logger = createLogger({
    level: config.logging.level,
    format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, timestamp, ...meta }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
    ),
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            ),
        }),
    ],
});

// Add file transport in production
// if (config.env.isProduction) {
//     logger.add(
//         new transports.File({
//             filename: 'logs/error.log',
//             level: 'error'
//         })
//     );
//     logger.add(
//         new transports.File({
//             filename: 'logs/combined.log'
//         })
//     );
// }

export default logger;