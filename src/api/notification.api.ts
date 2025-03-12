import {
    NotificationAuthRequest,
    NotificationAuthResponse,
    SuccessResponse,
} from '../types/api.types';
import apiClient from './client';

export class NotificationApi {
    public async authenticate(data: NotificationAuthRequest): Promise<NotificationAuthResponse> {
        return apiClient.post<NotificationAuthResponse>('/api/notifications/auth', data);
    }

    public async testNotifications(): Promise<SuccessResponse> {
        return apiClient.get<SuccessResponse>('/api/notifications/test');
    }
}

const notificationApi = new NotificationApi();
export default notificationApi;