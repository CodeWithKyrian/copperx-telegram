import { PaginatedResponse, SuccessResponse, UpdatePayeeRequest } from "../types/api.types";
import { CreatePayeeRequest, Payee } from "../types/api.types";
import apiClient from "./client";

class PayeeApi {
    public async getPayees(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Payee>> {
        return apiClient.get<PaginatedResponse<Payee>>('/api/payees', { params: { page, limit } });
    }

    public async createPayee(data: CreatePayeeRequest): Promise<Payee> {
        return apiClient.post<Payee>('/api/payees', data);
    }

    public async getPayee(id: string): Promise<Payee> {
        return apiClient.get<Payee>(`/api/payees/${id}`);
    }

    public async updatePayee(id: string, data: UpdatePayeeRequest): Promise<Payee> {
        return apiClient.put<Payee>(`/api/payees/${id}`, data);
    }

    public async deletePayee(id: string): Promise<SuccessResponse> {
        return apiClient.delete<SuccessResponse>(`/api/payees/${id}`);
    }
}

const payeeApi = new PayeeApi();

export default payeeApi;
