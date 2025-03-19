import { PaginatedResponse, Provider, ProviderCode } from '../../src/types/api.types';

export const mockProviders: Provider[] = [
    {
        id: 'prov_12345',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        organizationId: 'org_123456789',
        status: 'approved',
        providerCode: '0x1' as ProviderCode,
        providerData: {
            kycUrl: 'https://provider.com/kyc',
            tosUrl: 'https://provider.com/tos'
        },
        supportRemittance: true,
        country: 'usa'
    },
    {
        id: 'prov_67890',
        createdAt: '2023-01-02T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
        organizationId: 'org_123456789',
        status: 'approved',
        providerCode: '0x2' as ProviderCode,
        providerData: {
            kycUrl: 'https://provider2.com/kyc',
            tosUrl: 'https://provider2.com/tos'
        },
        supportRemittance: true,
        country: 'usa'
    }
];

export const mockProviderResponse: PaginatedResponse<Provider> = {
    data: mockProviders,
    page: 1,
    limit: 20,
    count: mockProviders.length,
    hasMore: false
}; 