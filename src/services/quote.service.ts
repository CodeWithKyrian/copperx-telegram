import {
    OfframpQuoteRequest,
    OfframpQuoteResponse,
    OnrampQuoteRequest,
    OnrampQuoteResponse
} from '../types/api.types';
import quoteApi from '../api/quote.api';
import logger from '../utils/logger.utils';

/**
 * Service for managing quotes
 */
export class QuoteService {
    /**
     * Get an offramp quote for a bank transfer
     */
    public async getOfframpQuote(data: OfframpQuoteRequest): Promise<OfframpQuoteResponse | null> {
        try {
            const response = await quoteApi.getOfframpQuote(data);
            return response;
        } catch (error) {
            logger.error({ error, data }, 'Failed to get offramp quote');
            return null;
        }
    }

    /**
     * Get an onramp quote for depositing funds
     */
    public async getOnrampQuote(data: OnrampQuoteRequest): Promise<OnrampQuoteResponse | null> {
        try {
            const response = await quoteApi.getOnrampQuote(data);
            return response;
        } catch (error) {
            logger.error({ error, data }, 'Failed to get onramp quote');
            return null;
        }
    }

    /**
     * Format a quote for display
     * @param quote Quote response
     * @param amount Original amount requested
     * @param currency Currency code
     * @returns Formatted quote string
     */
    public formatQuote(quote: OfframpQuoteResponse, amount: string, currency: string): string {
        let message = '💰 *Transfer Quote*\n\n';

        // Add amount and currency
        message += `Amount: ${amount} ${currency}\n`;

        // Add min/max amount information if available
        if (quote.minAmount) {
            message += `Minimum Amount: ${quote.minAmount} ${currency}\n`;
        }

        if (quote.maxAmount) {
            message += `Maximum Amount: ${quote.maxAmount} ${currency}\n`;
        }

        // Add arrival time message if available
        if (quote.arrivalTimeMessage) {
            message += `\nEstimated Arrival: ${quote.arrivalTimeMessage}\n`;
        }

        // Add provider information if available
        if (quote.provider) {
            message += `\nProvider: ${quote.provider.providerCode}\n`;
        }

        // Add error message if available
        if (quote.error) {
            message += `\n⚠️ *Error:* ${quote.error}\n`;
        }

        return message;
    }
}

// Export default instance
export const quoteService = new QuoteService();
export default quoteService; 