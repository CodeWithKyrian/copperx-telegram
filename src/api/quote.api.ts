import {
    OfframpQuoteRequest,
    OfframpQuoteResponse,
    OnrampQuoteRequest,
    OnrampQuoteResponse,
    PublicOfframpQuoteRequest,
} from '../types/api.types';
import apiClient from './client';

export class QuoteApi {
    public async getOfframpQuote(data: OfframpQuoteRequest): Promise<OfframpQuoteResponse> {
        return apiClient.post<OfframpQuoteResponse>('/api/quotes/offramp', data);
    }

    public async getOnrampQuote(data: OnrampQuoteRequest): Promise<OnrampQuoteResponse> {
        return apiClient.post<OnrampQuoteResponse>('/api/quotes/onramp', data);
    }

    public async getPublicOfframpQuote(data: PublicOfframpQuoteRequest): Promise<OfframpQuoteResponse> {
        return apiClient.post<OfframpQuoteResponse>('/api/quotes/public-offramp', data);
    }
}

const quoteApi = new QuoteApi();
export default quoteApi;