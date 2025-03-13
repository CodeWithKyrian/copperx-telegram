# CopperX Telegram Bot

A Telegram bot that integrates with CopperX Payout's API, enabling users to manage USDC transactions directly through Telegram.

## Features

- User authentication with CopperX credentials
- Wallet management and balance checking
- Fund transfers to email addresses and external wallets
- Bank withdrawals
- Real-time deposit notifications

## Security Setup

### Application Key

The application uses encryption to protect sensitive data like authentication tokens. You need to generate an application key before starting the bot:

```bash
# Generate a secure application key
npm run generate:key

# Add the generated key to your .env file
APP_KEY="your_generated_key_here"
```

This key is used to encrypt authentication tokens and other sensitive data stored in the session. Never share your APP_KEY and don't change it after users have started using your bot (or all their sessions will become invalid).

## Development

This project is currently under development.

## License

[MIT](LICENSE)

