import {
    PaginatedResponse,
    Kyc,
    KycUrl,
} from '../types/api.types';
import apiClient from './client';

export class KycApi {
    /**
     * Retrieves a list of KYC records based on the specified parameters.
     */
    public async getKycs(params: { page?: number; limit?: number; }): Promise<PaginatedResponse<Kyc>> {
        return apiClient.get<PaginatedResponse<Kyc>>('/api/kycs', { params });
    }

    /**
     * Retrieves a specific KYC record by its ID.
     */
    public async getKyc(id: string): Promise<Kyc> {
        return apiClient.get<Kyc>(`/api/kycs/${id}`);
    }

    /**
     * Retrieves KYC details for public pages using a signature.
     */
    public async getKycPublicDetail(signature: string): Promise<KycUrl> {
        return apiClient.get<KycUrl>(`/api/kycs/public/${signature}/detail`);
    }

    /**
     * Retrieves the latest KYC URL using a signature.
     */
    public async getLatestKyc(signature: string): Promise<KycUrl> {
        return apiClient.get<KycUrl>(`/api/kycs/public/${signature}/kyc-url`);
    }

    /**
     * Returns the KYC status from an email address for public pages.
     */
    public async getKycStatusFromEmail(email: string): Promise<string> {
        return apiClient.get<string>(`/api/kycs/status/${email}`);
    }
}

const kycApi = new KycApi();
export default kycApi;