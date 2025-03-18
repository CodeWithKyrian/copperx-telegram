import {
    InviteCode,
    ListResponse,
} from '../types/api.types';
import apiClient from './client';

export class InviteCodeApi {
    public async validateCode(): Promise<InviteCode> {
        return apiClient.post<InviteCode>('/api/invite-codes/validate');
    }

    public async listCodes(): Promise<ListResponse<InviteCode>> {
        return apiClient.get<ListResponse<InviteCode>>('/api/invite-codes');
    }
}

const inviteCodeApi = new InviteCodeApi();
export default inviteCodeApi;