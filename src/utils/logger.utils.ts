import { createLogger, format, transports } from 'winston';
import { environment } from '../config/environment';

// Create a Winston logger instance
export const logger = createLogger({
    level: environment.logging.level,
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
if (environment.isProduction) {
    logger.add(
        new transports.File({
            filename: 'logs/error.log',
            level: 'error'
        })
    );
    logger.add(
        new transports.File({
            filename: 'logs/combined.log'
        })
    );
}

export default logger;