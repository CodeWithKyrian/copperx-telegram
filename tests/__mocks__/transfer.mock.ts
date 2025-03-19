import {
    TransferWithAccount,
    TransferWithTransactions,
    Currency,
    PurposeCode,
    PaginatedResponse,
    TransferStatus,
    CreateSendTransferBatchResponse,
    CreateSendTransferBatchRequest,
    CreateSendTransferBatchSingleResponse
} from '../../src/types/api.types';

// Basic transfer mock for testing
export const mockTransfer: TransferWithAccount = {
    id: 'transfer-123',
    createdAt: '2024-03-20T10:00:00Z',
    updatedAt: '2024-03-20T10:00:00Z',
    organizationId: 'org-123',
    status: 'success' as TransferStatus,
    type: 'send',
    sourceCountry: 'usa',
    destinationCountry: 'usa',
    destinationCurrency: 'USDC',
    amount: '1000000000', // 10 USDC with 8 decimals
    currency: 'USDC' as Currency,
    feeCurrency: 'USDC' as Currency,
    totalFee: '50000000', // 0.5 USDC with 8 decimals
    purposeCode: 'family' as PurposeCode,
    isThirdPartyPayment: false,
    sourceAccount: {
        id: 'account-123',
        createdAt: '2024-03-19T10:00:00Z',
        updatedAt: '2024-03-19T10:00:00Z',
        type: 'send',
        country: 'usa',
        network: 'polygon',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678'
    },
    destinationAccount: {
        id: 'account-456',
        createdAt: '2024-03-19T10:00:00Z',
        updatedAt: '2024-03-19T10:00:00Z',
        type: 'receive',
        payeeEmail: 'recipient@example.com'
    }
};

// Bank transfer mock
export const mockBankTransfer: TransferWithAccount = {
    ...mockTransfer,
    id: 'transfer-456',
    type: 'withdraw',
    sourceCountry: 'usa',
    destinationCountry: 'ind',
    destinationAccount: {
        id: 'account-789',
        createdAt: '2024-03-19T10:00:00Z',
        updatedAt: '2024-03-19T10:00:00Z',
        type: 'withdraw',
        bankName: 'Test Bank',
        bankAccountNumber: 'XXXX1234',
        wireMessage: 'Bank transfer reference'
    }
};

// Wallet withdraw mock
export const mockWalletWithdraw: TransferWithAccount = {
    ...mockTransfer,
    id: 'transfer-789',
    type: 'withdraw',
    destinationAccount: {
        id: 'account-101',
        createdAt: '2024-03-19T10:00:00Z',
        updatedAt: '2024-03-19T10:00:00Z',
        type: 'withdraw',
        network: 'ethereum',
        walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12'
    }
};

// Pending transfer mock
export const mockPendingTransfer: TransferWithAccount = {
    ...mockTransfer,
    id: 'transfer-345',
    status: 'pending',
    totalFee: undefined
};

// Failed transfer mock
export const mockFailedTransfer: TransferWithAccount = {
    ...mockTransfer,
    id: 'transfer-678',
    status: 'failed',
};

// Transfer list mock
export const mockTransferList: TransferWithAccount[] = [
    mockTransfer,
    mockBankTransfer,
    mockWalletWithdraw,
    mockPendingTransfer,
    mockFailedTransfer
];

// Paginated response mock
export const mockPaginatedResponse: PaginatedResponse<TransferWithAccount> = {
    data: mockTransferList,
    page: 1,
    limit: 10,
    count: 5,
    hasMore: false
};

// Transfer with transactions mock
export const mockTransferWithTransactions: TransferWithTransactions = {
    ...mockTransfer,
    transactions: [
        {
            id: 'transaction-123',
            createdAt: '2024-03-20T10:00:00Z',
            updatedAt: '2024-03-20T10:00:00Z',
            organizationId: 'org-123',
            type: 'send',
            providerCode: '0x1',
            status: 'success',
            fromCurrency: 'USDC',
            toCurrency: 'USDC',
            fromAmount: '1000000000',
            toAmount: '950000000',
            transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
        }
    ]
};

// Batch transfer request mock
export const mockBatchTransferRequest: CreateSendTransferBatchRequest = {
    requests: [
        {
            requestId: 'req-1',
            request: {
                email: 'recipient1@example.com',
                amount: '500000000',
                purposeCode: 'family',
                currency: 'USDC'
            }
        },
        {
            requestId: 'req-2',
            request: {
                email: 'recipient2@example.com',
                amount: '300000000',
                purposeCode: 'family',
                currency: 'USDC'
            }
        }
    ]
};

// Batch transfer response mock
export const mockBatchTransferResponse: CreateSendTransferBatchResponse = {
    responses: [
        {
            requestId: 'req-1',
            request: mockBatchTransferRequest.requests[0].request,
            response: {
                ...mockTransfer,
                id: 'batch-transfer-1',
                amount: '500000000'
            }
        },
        {
            requestId: 'req-2',
            request: mockBatchTransferRequest.requests[1].request,
            response: {
                ...mockTransfer,
                id: 'batch-transfer-2',
                amount: '300000000'
            }
        }
    ]
};

// Batch transfer with error response mock
export const mockBatchTransferWithErrorResponse: CreateSendTransferBatchResponse = {
    responses: [
        {
            requestId: 'req-1',
            request: mockBatchTransferRequest.requests[0].request,
            response: {
                ...mockTransfer,
                id: 'batch-transfer-1',
                amount: '500000000'
            }
        },
        {
            requestId: 'req-2',
            request: mockBatchTransferRequest.requests[1].request,
            error: new Error('Insufficient funds')
        } as CreateSendTransferBatchSingleResponse
    ]
}; 