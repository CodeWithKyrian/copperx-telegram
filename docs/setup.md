# CopperX Telegram Bot - Setup Guide

This document provides comprehensive instructions for setting up and configuring the CopperX Telegram bot.

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

   # App server configuration
   APP_PORT=3000
   APP_HOST=0.0.0.0
   APP_DOMAIN=your-app-domain.com

   # Application key (from generate:key command)
   APP_KEY=your_generated_app_key

   # Webhook configuration (optional)
   WEBHOOK_SECRET_PATH=  # Optional path for webhook endpoint
   WEBHOOK_SECRET_TOKEN=your_secret_token  # For additional security

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

## Fastify Server Configuration

The bot uses Fastify, a high-performance web framework, to handle both Telegram webhook requests and provide additional endpoints:

### Health Check Endpoint

A health check endpoint is available at `/health` or the root path (`/`). This endpoint returns a simple JSON response indicating the server status, which is useful for:

- Keep-alive pings to prevent idle timeouts on platforms like Render
- Health checks for container orchestration systems
- Monitoring service status

### Environment Variables

Configure the server with these environment variables:

- `APP_PORT`: The port the server will listen on (defaults to 3000 or the value of `PORT`)
- `APP_HOST`: The host to bind to (defaults to `0.0.0.0` to listen on all network interfaces)
- `APP_DOMAIN`: Your application's domain name (used for webhook configuration)

For Render and similar platforms, binding to `0.0.0.0` is essential to properly expose the server port.

### Development and Production Modes

The application automatically handles both development and production modes:

- **Development Mode**: Uses long polling to receive updates from Telegram
- **Production Mode**: Uses webhook to receive updates, which is more efficient for production environments

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
APP_DOMAIN=your-domain.com  # Without https:// prefix, it will be added automatically
APP_PORT=3000  # Your application port
WEBHOOK_SECRET_PATH=  # Optional, generated automatically if empty
WEBHOOK_SECRET_TOKEN=your_secret_token  # For additional security
```

The application will automatically set up the webhook URL as `https://{APP_DOMAIN}{WEBHOOK_SECRET_PATH}`.

## Deployment Options

### Render

You can deploy the bot on [Render](https://render.com/) for free:

1. Fork or push the repository to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repo
4. Configure build command: `npm install && npm run build`
5. Configure start command: `npm start`
6. Add all environment variables from your `.env` file
7. Set `APP_HOST=0.0.0.0` to ensure the server binds correctly on Render
8. Set `APP_PORT=$PORT` to use the port assigned by Render
9. Set `APP_DOMAIN` to your Render app's URL (e.g., `your-app-name.onrender.com`)

This configuration ensures that Render can detect your application's open port, which is crucial for keeping the service alive.


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

   > **Note:** You don't need to explicitly set `APP_DOMAIN` for Vercel deployments, as the system automatically uses the `VERCEL_URL` environment variable.

5. **Production deployment**

   ```bash
   vercel --prod
   ```

7. **Note about Pusher in serverless environments**

   Pusher real-time notifications may not work immediately in serverless environments like Vercel due to the ephemeral nature of serverless functions. Since serverless functions don't maintain persistent connections, they can't directly receive continuous Pusher events.

   **Workaround solution:**
   - Create a separate serverless function that receives webhooks from Pusher Channels
   - Configure Pusher to send webhook events to this function
   - The function can then process the webhook payload and trigger the appropriate action

   For more details on implementing Pusher with serverless architectures, see [Pusher's guide on webhooks](https://pusher.com/docs/channels/server_api/webhooks/).


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
     -e APP_PORT=3000 \
     -e APP_HOST=0.0.0.0 \
     -e APP_DOMAIN=your-domain.com \
     -e PUSHER_KEY=your_pusher_key \
     -e PUSHER_CLUSTER=your_pusher_cluster \
     -p 3000:3000 \
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
       ports:
         - "3000:3000"
       environment:
         - BOT_TOKEN=your_telegram_bot_token
         - BOT_USERNAME=your_bot_username
         - API_BASE_URL=https://income-api.copperx.io
         - APP_KEY=your_generated_app_key
         - NODE_ENV=production
         - APP_PORT=3000
         - APP_HOST=0.0.0.0
         - APP_DOMAIN=your-domain.com
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
       ports:
         - "3000:3000"
       environment:
         - BOT_TOKEN=your_telegram_bot_token
         - BOT_USERNAME=your_bot_username
         - API_BASE_URL=https://income-api.copperx.io
         - APP_KEY=your_generated_app_key
         - NODE_ENV=production
         - APP_PORT=3000
         - APP_HOST=0.0.0.0
         - APP_DOMAIN=your-domain.com
         - SESSION_DRIVER=redis
         - REDIS_URL=redis://redis-host:6379
   ```


### Other Deployment Options

- **Railway**: Supports easy deployment from GitHub
- **Heroku**: Supports Node.js applications with Procfile

## Verifying Your Setup

After deployment, send a `/start` command to your bot on Telegram. You should receive the welcome message and main menu.

You can also verify the server is running by accessing the health check endpoint:
```
https://your-domain.com/health
```

This should return a JSON response with status "ok" and the current timestamp.

## Troubleshooting

If you encounter issues during setup:

1. Check the application logs for errors
2. Verify all environment variables are set correctly
3. Ensure your bot token is valid
4. Confirm you're using a supported Node.js version
5. Try accessing the health check endpoint to verify the server is running
6. Run the `npm run webhook-info` command to check your webhook status
7. See [troubleshooting.md](troubleshooting.md) for common issues and solutions

## Next Steps

After successful setup, see:
- [Project Structure](project-structure.md) - Understand the codebase architecture and flow
- [Command Reference](commands.md) - Learn about available commands
- [API Integration](api.md) - Details about the CopperX API integration