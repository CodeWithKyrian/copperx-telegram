import {
    OfframpQuoteRequest,
    OfframpQuoteResponse,
    OnrampQuoteRequest,
    OnrampQuoteResponse,
    Provider,
    ProviderCode,
    Country,
    Currency
} from '../../src/types/api.types';

// Mock provider
export const mockProvider: Provider = {
    id: 'provider-123',
    createdAt: '2024-03-15T12:00:00Z',
    updatedAt: '2024-03-15T12:00:00Z',
    organizationId: 'org-123',
    status: 'approved',
    providerCode: '0x1' as ProviderCode,
    providerData: {
        kycUrl: 'https://example.com/kyc',
        tosUrl: 'https://example.com/tos',
        externalStatus: 'active'
    },
    externalKycId: 'ext-kyc-123',
    externalCustomerId: 'ext-cust-123',
    supportRemittance: true,
    country: 'usa'
};

// Mock offramp quote request
export const mockOfframpQuoteRequest: OfframpQuoteRequest = {
    sourceCountry: 'usa' as Country,
    destinationCountry: 'ind' as Country,
    amount: '1000',
    currency: 'USDC' as Currency,
    preferredDestinationPaymentMethods: ['bank_ach'],
    thirdPartyPayment: false
};

// Mock offramp quote response with success
export const mockOfframpQuoteResponse: OfframpQuoteResponse = {
    minAmount: '100',
    maxAmount: '10000',
    arrivalTimeMessage: 'Funds will arrive within 2-3 business days',
    provider: mockProvider,
    quotePayload: 'encrypted-payload-data',
    quoteSignature: 'valid-signature-hash'
};

// Mock offramp quote with error
export const mockOfframpQuoteErrorResponse: OfframpQuoteResponse = {
    error: 'Amount exceeds the maximum allowed for this destination',
    minAmount: '100',
    maxAmount: '5000'
};

// Mock onramp quote request
export const mockOnrampQuoteRequest: OnrampQuoteRequest = {
    sourceCountry: 'usa' as Country,
    destinationCountry: 'usa' as Country,
    amount: '500',
    currency: 'USDC' as Currency,
    preferredSourcePaymentMethods: ['bank_ach']
};

// Mock onramp quote response with success
export const mockOnrampQuoteResponse: OnrampQuoteResponse = {
    minAmount: '50',
    maxAmount: '5000',
    arrivalTimeMessage: 'Funds will be available in your wallet within 1 hour after payment',
    provider: mockProvider,
    quotePayload: 'encrypted-payload-data',
    quoteSignature: 'valid-signature-hash'
};

// Mock onramp quote with error
export const mockOnrampQuoteErrorResponse: OnrampQuoteResponse = {
    error: 'Service temporarily unavailable for this country',
    minAmount: '50',
    maxAmount: '5000'
}; 