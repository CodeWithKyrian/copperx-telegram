# CopperX Telegram Bot - Command Reference

This document provides a complete reference of all available commands and interactions in the CopperX Telegram Bot.

## Core Commands

| Command | Description | Authentication Required |
|---------|-------------|-------------------------|
| `/start` | Initializes the bot and displays the main menu | No |
| `/login` | Authenticate with your CopperX account | No |
| `/logout` | Log out from your CopperX account | Yes |
| `/help` | Display help information and available commands | No |
| `/about` | Show information about the bot | No |

## Account & Wallet Management

| Command | Description | Authentication Required |
|---------|-------------|-------------------------|
| `/profile` | View your account profile | Yes |
| `/wallet` | View and manage your wallets | Yes |
| `/kyc` | Check your KYC verification status | Yes |
| `/payees` | View and manage your saved payees | Yes |

## Transaction Commands

| Command | Description | Authentication Required |
|---------|-------------|-------------------------|
| `/deposit` | Generate addresses to deposit funds | Yes |
| `/send` | Send funds to email or wallet addresses | Yes |
| `/withdraw` | Withdraw funds to bank account | Yes |
| `/history` | View your transaction history | Yes |

## Command Details

### `/start`

Initializes the bot and displays the welcome message and main menu.

Example:
```
/start
```

Response:
```
🌟 Welcome to CopperX Telegram Bot!

This bot allows you to:
- Check your wallet balances
- Deposit and withdraw funds
- Send payments to others
- View transaction history

Use /help to see all available commands.
```

### `/login`

Starts the authentication flow to connect your CopperX account.

Example:
```
/login
```

The bot will enter an interactive scene that guides you through:
1. Entering your email address
2. Receiving an OTP code
3. Entering the OTP code to complete authentication

### `/logout`

Logs out from your CopperX account and clears your session data.

Example:
```
/logout
```

Response:
```
✅ You have been successfully logged out.
```

### `/profile`

Displays your account profile information.

Example:
```
/profile
```

Response:
```
👤 Account Profile

Name: John Doe
Email: john@example.com
Organization: Example Corp
Verified: Yes

KYC Status: Approved
```

### `/wallet`

Shows your wallet balances and options for wallet management.

Example:
```
/wallet
```

Response:
```
💼 Your Wallets

Default Wallet (Solana):
Balance: 1,250.00 USDC

Available Actions:
- View Wallets
- Create Wallet
- Set Default Wallet
```

### `/deposit`

Provides deposit addresses for adding funds to your wallet.

Example:
```
/deposit
```

The bot will:
1. Display your available wallets
2. After selection, generate a deposit address and QR code
3. Provide instructions for depositing

### `/send`

Initiates the flow to send funds to an email address or external wallet.

Example:
```
/send
```

The bot will guide you through:
1. Selecting single or batch transfer
2. Entering recipient details (email or wallet address)
3. Specifying amount to send
4. Confirming the transaction

### `/withdraw`

Starts the flow to withdraw funds to a bank account.

Example:
```
/withdraw
```

The bot will guide you through:
1. Selecting a withdrawal method
2. Entering bank details
3. Specifying amount to withdraw
4. Reviewing and confirming the withdrawal

### `/history`

Shows your recent transaction history.

Example:
```
/history
```

Response:
```
📜 Transaction History (Last 10)

1. Deposit: +500 USDC (Mar 15, 2023)
2. Withdrawal: -200 USDC (Mar 10, 2023)
3. Send to john@example.com: -50 USDC (Mar 5, 2023)
...
```

### `/kyc`

Checks your Know Your Customer (KYC) verification status.

Example:
```
/kyc
```

Response:
```
✅ KYC Status: Approved

Your account has been verified and has full access to all features.
```

### `/payees`

Manages your saved payees for quick transfers.

Example:
```
/payees
```

Response:
```
👥 Your Saved Payees

1. John Smith (john@example.com)
2. Acme Corp (acme@example.com)

Available Actions:
- Add Payee
- Remove Payee
```

## Interactive Menus

The bot uses interactive menus with buttons for easier navigation:

- **Main Menu**: Access all primary features
- **Wallet Menu**: Options for wallet management
- **Transfer Menu**: Options for sending funds
- **Payee Menu**: Options for managing payees

## Inline Actions

Many responses include inline buttons for related actions, such as:

- View transfer details after a transaction
- Set a wallet as default
- Access deposit options for a specific wallet
- Save a recipient as a payee

## Natural Language Support

The bot can respond to certain natural language queries, such as:

- "What's my balance?"
- "I want to send money"
- "Show my recent transactions"
- "How do I deposit funds?"

## Error Handling

If you encounter an error while using a command, the bot will provide:

- A clear error message
- Possible causes for the error
- Suggestions to fix the issue
- Options to restart or cancel the current operation

## Cancelation

You can cancel any ongoing operation:

- Use the "Cancel" button when available
- Type `/cancel` during any interactive scene

## Notes

- Commands with authentication requirements will prompt you to login if you're not authenticated
- Session timeout is 7 days by default (configurable)
- All financial transactions require confirmation before processing 