import { VercelRequest, VercelResponse } from '@vercel/node';
import { config } from '../src/config';
import logger from '../src/utils/logger.utils';
import { bot } from './init';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        if (!bot) {
            throw new Error('Bot is not initialized');
        }

        const secretToken = config.webhook.secretToken;
        if (secretToken) {
            if (req.headers['x-telegram-bot-api-secret-token'] !== secretToken) {
                logger.warn('Invalid webhook secret token');
                res.status(403).send('Forbidden');
            }
        }

        if (req.method === 'POST') {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } else {
            const webhookInfo = await bot.telegram.getWebhookInfo();
            res.status(200).json({ status: 'Webhook is active', webhookInfo });
        }
    } catch (error: any) {
        logger.error('Webhook error', {
            error: error.message,
            stack: error.stack
        });

        res.status(500).send('Internal Server Error');
    }
}