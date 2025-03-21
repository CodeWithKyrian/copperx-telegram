# CopperX Telegram Bot

A Telegram bot built with TypeScript and Node.js that integrates with CopperX Payout's API, enabling users to deposit, withdraw, and transfer USDC directly through Telegram without visiting the web app.

## ✨ Features

- **Authentication & Account Management**
  - Secure user login with CopperX credentials
  - View account profile and KYC/KYB approval status
  - Session management with multiple storage options

- **Wallet Management**
  - View all wallet balances across networks
  - Create new wallets
  - Set default wallet for transactions
  - Generate deposit addresses and QR codes

- **Fund Transfers**
  - Send funds to email addresses
  - Send funds to external wallet addresses
  - Bulk transfers to multiple recipients
  - Withdraw funds to bank accounts
  - View transaction history

- **Payee Management**
  - Save and manage frequent recipients
  - Add, view, and remove payees

- **Real-time Notifications**
  - Receive deposit notifications via Pusher integration

- **Natural Language Processing**
  - Basic support for natural language queries

- **Deployment and Health Monitoring**
  - Health check endpoints for monitoring
  - Easy deployment on various platforms
  - Support for webhook and long polling modes

## 🔒 Security Features

- Strong type safety throughout the codebase
- Encrypted session storage
- Secure handling of authentication tokens
- Protected routes and commands
- Rate limiting to prevent abuse
- Comprehensive error handling
- Automatic session expiration based on configurable TTL

## 🧩 Technical Stack

- **TypeScript/Node.js** - Strongly typed JavaScript
- **Telegraf** - Modern Telegram Bot API framework
- **Fastify** - High-performance web framework
- **Axios** - Promise-based HTTP client
- **Pusher** - Real-time notifications
- **Multiple session storage options** - Redis, SQLite, MongoDB, PostgreSQL
- **Winston** - Logging
- **Docker** - Containerized deployment

## 🚀 Quick Start

### Prerequisites

- Node.js (16.x or later)
- npm or yarn
- A Telegram Bot Token (from @BotFather)
- CopperX API access

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/CodeWithKyrian/copperx-telegram.git
   cd copperx-telegram
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate an application key (used for encrypting sensitive data):
   ```bash
   npm run generate:key
   ```

4. Create a `.env` file by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Configure your environment variables in the `.env` file:
   ```
   BOT_TOKEN=your_telegram_bot_token
   BOT_USERNAME=your_bot_username
   API_BASE_URL=https://income-api.copperx.io
   APP_KEY=your_generated_app_key
   APP_PORT=3000
   APP_HOST=0.0.0.0
   ```

### Running the Bot

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

Once the bot is running, you can verify it's working by accessing the health check endpoint:
```
http://localhost:3000/health
```

For a more comprehensive documentation on deployment, see the [Setup Guide](docs/setup.md#docker-deployment).

## 🧪 Testing

The project includes a comprehensive test suite with a fair code coverage:

- **Unit Tests**: For individual components and functions
- **Integration Tests**: For API clients and services

The tests are automatically run on GitHub Actions CI for every pull request and push to the main branch.

Run the test suite locally:
```bash
npm test
```

Generate test coverage report:
```bash
npm run test:cov
```

## 📚 Documentation

For detailed documentation, see:

- [Setup Guide](docs/setup.md) - Detailed installation and configuration
- [Project Structure](docs/project-structure.md) - Architecture and code flow explanation
- [Command Reference](docs/commands.md) - Available bot commands and examples
- [API Integration](docs/api.md) - How the bot interacts with CopperX API
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions
- [Security](docs/security.md) - Security considerations and practices

## 🤝 Support

For questions or issues, please contact CopperX support:
[CopperX Telegram Community](https://t.me/copperxcommunity/2183)