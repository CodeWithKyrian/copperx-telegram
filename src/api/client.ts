import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from '../config';
import { ErrorResponse } from '../types/api.types';
import logger from '../utils/logger.utils';

/**
 * API request configuration
 */
interface ApiClientConfig {
    baseURL?: string;
    timeout?: number;
    headers?: Record<string, string>;
}

/**
 * Base API client for making requests to the CopperX API
 */
export class ApiClient {
    private client: AxiosInstance;
    private token: string | null = null;

    /**
     * Creates a new API client
     * @param clientConfig Optional configuration for the client
     */
    constructor(clientConfig: ApiClientConfig = {}) {
        this.client = axios.create({
            baseURL: clientConfig.baseURL || config.api.baseUrl,
            timeout: clientConfig.timeout || config.api.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...clientConfig.headers,
            },
        });

        // Set up request interceptor for auth
        this.setupInterceptors();
    }

    /**
     * Sets up request and response interceptors
     */
    private setupInterceptors(): void {
        // Request interceptor - add auth header if token exists
        this.client.interceptors.request.use(
            (config) => {
                if (this.token) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor - handle common errors
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError<ErrorResponse>) => {
                this.handleApiError(error);
                return Promise.reject(error);
            }
        );
    }

    /**
     * Handles API errors and logs them
     * @param error Axios error
     */
    private handleApiError(error: AxiosError<ErrorResponse>): void {
        const { response, request, message } = error;

        if (response) {
            // The request was made and the server responded with an error status
            const { status, data } = response;
            logger.error({ status, data, url: request.url }, `API Error: ${status}`);
        } else if (request) {
            // The request was made but no response was received
            logger.error({ request }, 'API Error: No response received');
        } else {
            // Something happened in setting up the request
            logger.error({ error: message }, 'API Error: No response received');
        }
    }

    /**
     * Sets the access token for authenticated requests
     * @param token Access token
     */
    public setAccessToken(token: string | null): void {
        this.token = token;
        this.client.defaults.headers.common.Authorization = token ? `Bearer ${token}` : undefined;
    }

    /**
     * Gets the current access token
     * @returns Current access token or null
     */
    public getAccessToken(): string | null {
        return this.token;
    }

    /**
     * Makes a GET request to the API
     * @param url URL to request
     * @param config Optional Axios config
     * @returns Promise with response data
     */
    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.client.get<T>(url, config);
            return response.data;
        } catch (error) {
            throw this.normalizeError(error);
        }
    }

    /**
     * Makes a POST request to the API
     * @param url URL to request
     * @param data Data to send
     * @param config Optional Axios config
     * @returns Promise with response data
     */
    public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.client.post<T>(url, data, config);
            return response.data;
        } catch (error) {
            throw this.normalizeError(error);
        }
    }

    /**
     * Makes a PUT request to the API
     * @param url URL to request
     * @param data Data to send
     * @param config Optional Axios config
     * @returns Promise with response data
     */
    public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.client.put<T>(url, data, config);
            return response.data;
        } catch (error) {
            throw this.normalizeError(error);
        }
    }

    /**
     * Makes a DELETE request to the API
     * @param url URL to request
     * @param config Optional Axios config
     * @returns Promise with response data
     */
    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.client.delete<T>(url, config);
            return response.data;
        } catch (error) {
            throw this.normalizeError(error);
        }
    }

    /**
     * Normalizes errors for consistent handling
     * @param error Any error
     * @returns Normalized error
     */
    private normalizeError(error: any): Error {
        if (axios.isAxiosError(error) && error.response?.data) {
            const errorData = error.response.data as ErrorResponse;
            const message = typeof errorData.message === 'string'
                ? errorData.message
                : JSON.stringify(errorData.message);

            return new Error(`API Error (${errorData.statusCode}): ${message}`);
        }

        return error instanceof Error ? error : new Error(String(error));
    }
}

// Create and export default client instance
export const apiClient = new ApiClient();
export default apiClient;