import { quoteService } from '../../src/services/quote.service';
import quoteApi from '../../src/api/quote.api';
import logger from '../../src/utils/logger.utils';
import {
    mockOfframpQuoteRequest,
    mockOfframpQuoteResponse,
    mockOfframpQuoteErrorResponse,
    mockOnrampQuoteRequest,
    mockOnrampQuoteResponse,
    mockOnrampQuoteErrorResponse
} from '../__mocks__/quote.mock';

// Mock dependencies
jest.mock('../../src/api/quote.api');
jest.mock('../../src/utils/logger.utils');

describe('Quote Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getOfframpQuote', () => {
        it('should return quote when API call succeeds', async () => {
            // Arrange
            (quoteApi.getOfframpQuote as jest.Mock).mockResolvedValue(mockOfframpQuoteResponse);

            // Act
            const result = await quoteService.getOfframpQuote(mockOfframpQuoteRequest);

            // Assert
            expect(quoteApi.getOfframpQuote).toHaveBeenCalledWith(mockOfframpQuoteRequest);
            expect(result).toEqual(mockOfframpQuoteResponse);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('API unavailable');
            (quoteApi.getOfframpQuote as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await quoteService.getOfframpQuote(mockOfframpQuoteRequest);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    data: mockOfframpQuoteRequest
                }),
                'Failed to get offramp quote'
            );
        });

        it('should handle quote with error message', async () => {
            // Arrange
            (quoteApi.getOfframpQuote as jest.Mock).mockResolvedValue(mockOfframpQuoteErrorResponse);

            // Act
            const result = await quoteService.getOfframpQuote(mockOfframpQuoteRequest);

            // Assert
            expect(result).toEqual(mockOfframpQuoteErrorResponse);
            expect(result?.error).toBe(mockOfframpQuoteErrorResponse.error);
        });
    });

    describe('getOnrampQuote', () => {
        it('should return quote when API call succeeds', async () => {
            // Arrange
            (quoteApi.getOnrampQuote as jest.Mock).mockResolvedValue(mockOnrampQuoteResponse);

            // Act
            const result = await quoteService.getOnrampQuote(mockOnrampQuoteRequest);

            // Assert
            expect(quoteApi.getOnrampQuote).toHaveBeenCalledWith(mockOnrampQuoteRequest);
            expect(result).toEqual(mockOnrampQuoteResponse);
        });

        it('should handle API errors and return null', async () => {
            // Arrange
            const mockError = new Error('API unavailable');
            (quoteApi.getOnrampQuote as jest.Mock).mockRejectedValue(mockError);

            // Act
            const result = await quoteService.getOnrampQuote(mockOnrampQuoteRequest);

            // Assert
            expect(result).toBeNull();
            expect(logger.error).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: mockError,
                    data: mockOnrampQuoteRequest
                }),
                'Failed to get onramp quote'
            );
        });

        it('should handle quote with error message', async () => {
            // Arrange
            (quoteApi.getOnrampQuote as jest.Mock).mockResolvedValue(mockOnrampQuoteErrorResponse);

            // Act
            const result = await quoteService.getOnrampQuote(mockOnrampQuoteRequest);

            // Assert
            expect(result).toEqual(mockOnrampQuoteErrorResponse);
            expect(result?.error).toBe(mockOnrampQuoteErrorResponse.error);
        });
    });

    describe('formatQuote', () => {
        it('should format a successful quote correctly', () => {
            // Arrange
            const amount = '1000';
            const currency = 'USDC';

            // Act
            const result = quoteService.formatQuote(mockOfframpQuoteResponse, amount, currency);

            // Assert
            expect(result).toContain('💰 *Transfer Quote*');
            expect(result).toContain(`Amount: ${amount} ${currency}`);
            expect(result).toContain(`Minimum Amount: ${mockOfframpQuoteResponse.minAmount} ${currency}`);
            expect(result).toContain(`Maximum Amount: ${mockOfframpQuoteResponse.maxAmount} ${currency}`);
            expect(result).toContain(`Estimated Arrival: ${mockOfframpQuoteResponse.arrivalTimeMessage}`);
            expect(result).toContain(`Provider: ${mockOfframpQuoteResponse.provider?.providerCode}`);
            expect(result).not.toContain('⚠️ *Error:*');
        });

        it('should format a quote with error correctly', () => {
            // Arrange
            const amount = '10000';
            const currency = 'USDC';

            // Act
            const result = quoteService.formatQuote(mockOfframpQuoteErrorResponse, amount, currency);

            // Assert
            expect(result).toContain('💰 *Transfer Quote*');
            expect(result).toContain(`Amount: ${amount} ${currency}`);
            expect(result).toContain(`Minimum Amount: ${mockOfframpQuoteErrorResponse.minAmount} ${currency}`);
            expect(result).toContain(`Maximum Amount: ${mockOfframpQuoteErrorResponse.maxAmount} ${currency}`);
            expect(result).toContain(`⚠️ *Error:* ${mockOfframpQuoteErrorResponse.error}`);
        });

        it('should handle missing optional fields', () => {
            // Arrange
            const amount = '500';
            const currency = 'USDC';
            const minimalQuote = {
                // No optional fields
            };

            // Act
            const result = quoteService.formatQuote(minimalQuote, amount, currency);

            // Assert
            expect(result).toContain('💰 *Transfer Quote*');
            expect(result).toContain(`Amount: ${amount} ${currency}`);
            expect(result).not.toContain('Minimum Amount:');
            expect(result).not.toContain('Maximum Amount:');
            expect(result).not.toContain('Estimated Arrival:');
            expect(result).not.toContain('Provider:');
            expect(result).not.toContain('⚠️ *Error:*');
        });

        it('should handle quotes with only min amount', () => {
            // Arrange
            const amount = '200';
            const currency = 'USDC';
            const quoteWithOnlyMin = {
                minAmount: '100'
            };

            // Act
            const result = quoteService.formatQuote(quoteWithOnlyMin, amount, currency);

            // Assert
            expect(result).toContain(`Minimum Amount: ${quoteWithOnlyMin.minAmount} ${currency}`);
            expect(result).not.toContain('Maximum Amount:');
        });

        it('should handle quotes with only max amount', () => {
            // Arrange
            const amount = '2000';
            const currency = 'USDC';
            const quoteWithOnlyMax = {
                maxAmount: '5000'
            };

            // Act
            const result = quoteService.formatQuote(quoteWithOnlyMax, amount, currency);

            // Assert
            expect(result).not.toContain('Minimum Amount:');
            expect(result).toContain(`Maximum Amount: ${quoteWithOnlyMax.maxAmount} ${currency}`);
        });

        it('should handle quotes with only arrival time message', () => {
            // Arrange
            const amount = '500';
            const currency = 'USDC';
            const quoteWithOnlyArrival = {
                arrivalTimeMessage: 'Funds will arrive soon'
            };

            // Act
            const result = quoteService.formatQuote(quoteWithOnlyArrival, amount, currency);

            // Assert
            expect(result).toContain(`Estimated Arrival: ${quoteWithOnlyArrival.arrivalTimeMessage}`);
        });

        it('should handle quotes with only provider', () => {
            // Arrange
            const amount = '500';
            const currency = 'USDC';
            const quoteWithOnlyProvider = {
                provider: {
                    ...mockOfframpQuoteResponse.provider!,
                }
            };

            // Act
            const result = quoteService.formatQuote(quoteWithOnlyProvider, amount, currency);

            // Assert
            expect(result).toContain(`Provider: ${quoteWithOnlyProvider.provider.providerCode}`);
        });
    });
}); 