# CopperX Telegram Bot - API Integration

This document explains how the CopperX Telegram Bot integrates with the CopperX Payout API.

## Overview

The bot communicates with the CopperX API to perform various operations including authentication, wallet management, fund transfers, and more. The integration is designed to be type-safe, efficient, and secure.

## API Client Structure

The API integration is modular and organized by resource type:

```
src/api/
├── client.ts             # Base API client with auth and error handling
├── index.ts              # Exports all API modules
├── auth.api.ts           # Authentication endpoints
├── wallet.api.ts         # Wallet management endpoints
├── transfer.api.ts       # Fund transfer endpoints
├── transaction.api.ts    # Transaction history endpoints
├── account.api.ts        # User account endpoints
├── kyc.api.ts            # KYC verification endpoints
├── notification.api.ts   # Pusher notification endpoints
├── payeee.api.ts         # Payee management endpoints
├── quote.api.ts          # Fee quote endpoints
└── ...
```

## Base API Client

The `ApiClient` class in `client.ts` serves as the foundation for all API requests:

- Handles authentication via access tokens
- Manages request/response interceptors
- Provides error handling and logging
- Implements standard HTTP methods (GET, POST, PUT, DELETE)

Each resource-specific API module extends this base client to encapsulate related endpoint calls.

## Authentication Flow

The API uses token-based authentication:

1. User provides email in the bot
2. Bot requests OTP from API (`/api/auth/email-otp/request`)
3. User enters OTP in the bot
4. Bot authenticates with API (`/api/auth/email-otp/authenticate`)
5. API returns access token
6. Token is encrypted and stored in user's session
7. Token is used for all subsequent requests

## Key API Endpoints

### Authentication

- **Request OTP**: `/api/auth/email-otp/request`
  - Method: POST
  - Payload: `{ email: string }`
  - Used to request OTP for user login

- **Authenticate with OTP**: `/api/auth/email-otp/authenticate`
  - Method: POST
  - Payload: `{ email: string, code: string }`
  - Returns access token

- **Get Profile**: `/api/auth/me`
  - Method: GET
  - Returns current user profile information

### Wallet Management

- **List Wallets**: `/api/wallets`
  - Method: GET
  - Returns all user wallets

- **Get Wallet Balances**: `/api/wallets/balances`
  - Method: GET
  - Returns balances across all wallets

- **Create Wallet**: `/api/wallets`
  - Method: POST
  - Payload: `{ chainId: string, code: string }`
  - Creates a new wallet

- **Set Default Wallet**: `/api/wallets/default`
  - Method: PUT
  - Payload: `{ walletId: string }`
  - Sets default wallet for transactions

### Transfers

- **Send to Email**: `/api/transfers/send`
  - Method: POST
  - Payload: `{ email: string, amount: number, description: string, ... }`
  - Sends funds to an email address

- **Send to Wallet**: `/api/transfers/wallet-withdraw`
  - Method: POST
  - Payload: `{ address: string, amount: number, chainId: string, ... }`
  - Sends funds to external wallet

- **Bank Withdrawal**: `/api/transfers/offramp`
  - Method: POST
  - Payload: `{ amount: number, provider: string, accountData: object, ... }`
  - Withdraws funds to bank account

- **Batch Transfer**: `/api/transfers/send-batch`
  - Method: POST
  - Payload: `{ transfers: Array<Transfer> }`
  - Sends funds to multiple recipients

### Transactions & History

- **Get Transfers**: `/api/transfers`
  - Method: GET
  - Query: `page, limit, status, type, ...`
  - Returns transaction history

### KYC Verification

- **Get KYC Status**: `/api/kycs`
  - Method: GET
  - Returns KYC verification status

### Payee Management

- **List Payees**: `/api/payees`
  - Method: GET
  - Returns saved payees

- **Create Payee**: `/api/payees`
  - Method: POST
  - Payload: `{ name: string, email: string, ... }`
  - Creates a new payee

## Error Handling

The API client implements robust error handling:

- HTTP status codes (400, 401, 403, 404, 500, etc.)
- API-specific error codes and messages
- Request/response logging
- User-friendly error transformations

Common error patterns:

```typescript
try {
  const result = await api.someEndpoint();
  // Success handling
} catch (error) {
  if (error.status === 401) {
    // Handle authentication errors
  } else if (error.status === 403) {
    // Handle permission errors
  } else {
    // Handle general errors
  }
}
```

## Typing System

The API integration uses TypeScript interfaces to ensure type safety:

```typescript
// Example of API response types
export interface WalletResponse {
  id: string;
  name: string;
  chainId: string;
  address: string;
  isDefault: boolean;
  createdAt: string;
}

export interface TransferResponse {
  id: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  type: 'deposit' | 'withdrawal' | 'transfer';
  createdAt: string;
  // ...
}
```

## Real-time Notifications

For real-time deposit notifications, the bot integrates with Pusher:

1. Bot authenticates with Pusher through CopperX API
2. Subscribes to organization's private channel
3. Listens for `deposit` events
4. Notifies the user when deposits are received

API endpoint for Pusher authentication:
- `/api/notifications/auth` (POST)
- Payload: `{ socket_id: string, channel_name: string }`

## Rate Limiting

The CopperX API implements rate limiting. The bot handles this through:

- Exponential backoff for retries
- User-friendly error messages when limits are reached
- Throttling of user requests in the middleware

## Security Considerations

- Access tokens are encrypted in storage using the APP_KEY
- No sensitive information is logged
- Secure session management
- Protected routes require authentication
- HTTPS for all API communications

## Testing the API Integration

The project includes comprehensive tests for the API integration:

```bash
# Run API tests
npm test -- --testPathPattern=src/api

# Run integration tests
npm test -- --testPathPattern=integration
```

## API Documentation

For full API documentation, refer to:
- [CopperX API Documentation](https://income-api.copperx.io/api/doc)

The bot also includes a SwaggerUI JSON file in the `docs` directory that can be used with tools like Swagger UI to explore the API. 