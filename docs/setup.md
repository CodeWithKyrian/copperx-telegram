# CopperX Telegram Bot - Setup Guide

This guide provides comprehensive instructions for setting up and configuring the CopperX Telegram bot.

## Prerequisites

Before you begin, ensure you have the following:

- **Node.js** (v16.x or later) and npm (or yarn)
- **Telegram Bot Token** - Obtain from [@BotFather](https://t.me/BotFather)
- **CopperX API Access** - API credentials for the CopperX Platform
- **Pusher Account** (optional) - For real-time notifications

## Installation

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/copperx-telegram.git
   cd copperx-telegram
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

   Or with yarn:

   ```bash
   yarn install
   ```

3. **Generate Application Key**

   The bot uses encryption to secure sensitive data like authentication tokens. Generate a secure application key:

   ```bash
   npm run generate:key
   ```

   This command will output a secure random key that you'll need to add to your .env file.

4. **Configure Environment Variables**

   Create a `.env` file by copying the example:

   ```bash
   cp .env.example .env
   ```

   Then edit the `.env` file with your configuration:

   ```env
   # Bot configuration
   BOT_TOKEN=your_telegram_bot_token
   BOT_USERNAME=your_bot_username

   # API configuration
   API_BASE_URL=https://income-api.copperx.io
   API_TIMEOUT=30000

   # Application key (from generate:key command)
   APP_KEY=your_generated_app_key

   # Session configuration
   SESSION_DRIVER=memory  # Options: memory, redis, mongo, sqlite, postgres
   SESSION_TTL=604800  # Session time-to-live in seconds (default: 7 days)

   # Logging
   LOG_LEVEL=info  # Options: error, warn, info, debug

   # Environment
   NODE_ENV=development  # production for production mode
   ```

## Session Storage Configuration

The bot supports multiple session storage options. Choose one and configure accordingly:

### Memory Storage (Default)

Good for development or small-scale deployment. Sessions are lost on restart.

```env
SESSION_DRIVER=memory
```

### SQLite Storage

Simple file-based storage suitable for small to medium deployments:

```env
SESSION_DRIVER=sqlite
SQLITE_FILENAME=.sessions.db
```

### Redis Storage

Recommended for production use:

```env
SESSION_DRIVER=redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password  # Optional
```

### MongoDB Storage

For integration with existing MongoDB infrastructure:

```env
SESSION_DRIVER=mongo
MONGO_URI=mongodb://localhost:27017
MONGO_DB=copperx_bot
MONGO_COLLECTION=sessions
```

### PostgreSQL Storage

For integration with existing PostgreSQL infrastructure:

```env
SESSION_DRIVER=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=copperx_bot
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_postgres_password
```

## Pusher Configuration (for Real-time Notifications)

To enable real-time deposit notifications, set up Pusher:

1. Create an account at [Pusher](https://pusher.com/)
2. Create a new Channels app
3. Add these settings to your `.env` file:

```env
PUSHER_KEY=your_pusher_key 
PUSHER_CLUSTER=your_pusher_cluster
```

These credentials are used for client-side connection to receive notifications in real time.

## Running in Development Mode

For local development:

```bash
npm run dev
```

## Running in Production

For production deployment:

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Start the server**
   ```bash
   npm start
   ```

## Webhook Configuration (for Production)

For production environments, it's recommended to use webhooks instead of long polling:

1. Set up a domain with SSL (required by Telegram)
2. Configure your `.env` file:

```env
NODE_ENV=production
WEBHOOK_DOMAIN=https://your-domain.com
WEBHOOK_PORT=8443  # Must be one of 443, 80, 88, or 8443
WEBHOOK_SECRET_PATH=  # Optional, generated automatically if empty
WEBHOOK_SECRET_TOKEN=your_secret_token  # For additional security
```

## Deployment Options

### Render

You can deploy the bot on [Render](https://render.com/) for free:

1. Fork or push the repository to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repo
4. Configure build command: `npm install && npm run build`
5. Configure start command: `npm start`
6. Add all environment variables from your `.env` file
7. Deploy the service


### Vercel Deployment

The bot can be deployed to Vercel's serverless platform:

1. **Install the Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy the project**

   ```bash
   vercel
   ```

4. **Set up environment variables in Vercel**

   You'll need to configure the following environment variables in the Vercel dashboard:
   
   **Required:**
   - `BOT_TOKEN` - Your Telegram bot token
   - `BOT_USERNAME` - Your bot's username
   - `APP_KEY` - Your generated application key
   - `SESSION_DRIVER` - Memory, Redis, MongoDB, etc.

   > **Note:** You don't need to set `WEBHOOK_DOMAIN` or `WEBHOOK_PORT` for Vercel deployments, as the system automatically handles these using the `VERCEL_URL` environment variable.

5. **Production deployment**

   ```bash
   vercel --prod
   ```

6. **Set up your Telegram bot webhook**

   Vercel automatically provides the domain, so you just need to set the webhook with Telegram:

   ```
   https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-vercel-project.vercel.app/api/webhook
   ```

   You can also navigate to your deployment URL to see the webhook status.


### Docker Deployment

The bot can be easily deployed using Docker:

1. **Build the Docker image**

   ```bash
   docker build -t copperx-telegram-bot .
   ```
2. ** Generate your app key**

   ```bash
   npm run generate:key
   ```

2. **Run the container with required environment variables**

   ```bash
   docker run -d --name copperx-bot \
     -e BOT_TOKEN=your_telegram_bot_token \
     -e BOT_USERNAME=your_bot_username \
     -e APP_KEY=your_generated_app_key \
     -e NODE_ENV=production \
     -e WEBHOOK_DOMAIN=https://your-domain.com \
     -e WEBHOOK_PORT=8443 \
     -e PUSHER_KEY=your_pusher_key \
     -e PUSHER_CLUSTER=your_pusher_cluster \
     copperx-telegram-bot
   ```

3. **Or Using Docker Compose**

   Create a `docker-compose.yml` file:

   ```yaml
   version: '3'
   services:
     bot:
       build: .
       restart: always
       environment:
         - BOT_TOKEN=your_telegram_bot_token
         - BOT_USERNAME=your_bot_username
         - API_BASE_URL=https://income-api.copperx.io
         - APP_KEY=your_generated_app_key
         - NODE_ENV=production
         - SESSION_DRIVER=redis
         - REDIS_URL=redis://redis:6379
   ```

   Run with:

   ```bash
   docker-compose up -d
   ```

   If you're using external Redis, MongoDB, or PostgreSQL:

   ```yaml
   version: '3'
   services:
     bot:
       build: .
       restart: always
       environment:
         - BOT_TOKEN=your_telegram_bot_token
         - BOT_USERNAME=your_bot_username
         - API_BASE_URL=https://income-api.copperx.io
         - APP_KEY=your_generated_app_key
         - NODE_ENV=production
         - SESSION_DRIVER=redis
         - REDIS_URL=redis://redis-host:6379
   ```


### Other Deployment Options

- **Railway**: Supports easy deployment from GitHub
- **Heroku**: Supports Node.js applications with Procfile

## Verifying Your Setup

After deployment, send a `/start` command to your bot on Telegram. You should receive the welcome message and main menu.

## Troubleshooting

If you encounter issues during setup:

1. Check the application logs for errors
2. Verify all environment variables are set correctly
3. Ensure your bot token is valid
4. Confirm you're using a supported Node.js version
5. See [troubleshooting.md](troubleshooting.md) for common issues and solutions

## Next Steps

After successful setup, see:
- [Project Structure](project-structure.md) - Understand the codebase architecture and flow
- [Command Reference](commands.md) - Learn about available commands
- [API Integration](api.md) - Details about the CopperX API integration