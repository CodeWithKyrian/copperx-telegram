import {
    AllPointsTotal,
    AllPoints,
    ListResponse,
    TransactionPoint,
    ReferrerPoint,
} from '../types/api.types';
import apiClient from './client';

export class PointApi {
    public async getTotalPoints(email: string): Promise<AllPointsTotal> {
        return apiClient.get<AllPointsTotal>('/api/points/total', { params: { email } });
    }

    public async getAllPoints(): Promise<AllPoints> {
        return apiClient.get<AllPoints>('/api/points/all');
    }

    public async getOfframpTransferPoints(): Promise<ListResponse & { data: TransactionPoint[] }> {
        return apiClient.get<ListResponse & { data: TransactionPoint[] }>('/api/points/offramp-transfer-points');
    }

    public async getReferrerPoints(): Promise<ListResponse & { data: ReferrerPoint[] }> {
        return apiClient.get<ListResponse & { data: ReferrerPoint[] }>('/api/points/referrer-points');
    }
}

const pointApi = new PointApi();
export default pointApi;