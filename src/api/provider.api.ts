import {
    Page,
    ProviderData,
    CreateProviderRequest,
    Kyc,
    ProviderCode,
    Provider,
    OnboardOnPartnerAccountRequest
} from '../types/api.types';
import apiClient from './client';

export class ProviderApi {
    public async getProviders(params: {
        page?: number;
        limit?: number;
        providerCode?: ProviderCode;
        sync?: boolean;
    }): Promise<Page & { data: Provider[] }> {
        return apiClient.get<Page & { data: Provider[] }>('/api/providers', { params });
    }

    public async createProvider(data: CreateProviderRequest): Promise<ProviderData> {
        return apiClient.post<ProviderData>('/api/providers', data);
    }

    public async getProvider(id: string): Promise<Kyc> {
        return apiClient.get<Kyc>(`/api/providers/${id}`);
    }

    public async getBridgeTosLink(): Promise<string> {
        return apiClient.post<string>('/api/providers/bridge-tos-link');
    }

    public async submitKycOnPartner(data: OnboardOnPartnerAccountRequest): Promise<ProviderData> {
        return apiClient.post<ProviderData>('/api/providers/submit-kyc-on-partner', data);
    }
}

const providerApi = new ProviderApi();
export default providerApi;