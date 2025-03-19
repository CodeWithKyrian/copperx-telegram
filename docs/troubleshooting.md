# CopperX Telegram Bot - Troubleshooting Guide

This guide aims to help you resolve common issues with the CopperX Telegram Bot.

## Common Issues and Solutions

### Connection Issues

#### Bot not responding to commands

**Symptoms:**
- Bot doesn't respond to any commands
- No error messages

**Possible Causes:**
- Bot service is down
- Telegram API issues
- Rate limiting

**Solutions:**
1. Check if the bot process is running:
   ```bash
   ps aux | grep node
   ```
2. Restart the bot:
   ```bash
   npm run start
   ```
3. Check application logs for errors
4. Verify your bot token is valid
5. Ensure webhook settings are correct (for production)

#### "Bot Error" message in Telegram

**Symptoms:**
- Telegram shows "Sorry, this bot is experiencing technical difficulties"

**Solutions:**
1. Check your application logs for errors
2. Ensure your bot token is correctly set in .env
3. Restart the bot
4. If using webhooks, verify your SSL certificate is valid

### Authentication Issues

#### OTP not being received

**Symptoms:**
- User doesn't receive OTP email during login

**Possible Causes:**
- Email delivery issues
- Incorrect email address
- API connectivity issues

**Solutions:**
1. Check the email address was entered correctly
2. Check application logs for API errors
3. Verify connectivity to CopperX API:
   ```bash
   curl -I https://income-api.copperx.io/api/health
   ```
4. Contact CopperX support if API appears to be down

#### "Authentication Required" message

**Symptoms:**
- Bot responds with "Authentication Required" message for protected commands

**Solutions:**
1. Use `/login` command to authenticate
2. If already logged in, session may have expired - login again
3. Check bot logs for authentication errors
4. Ensure APP_KEY hasn't changed since user sessions were created

### API Integration Issues

#### "Unable to connect to CopperX API" error

**Symptoms:**
- Bot responds with API connection errors

**Solutions:**
1. Verify API_BASE_URL is set correctly in .env
2. Check network connectivity to the API
3. Confirm API is operational
4. Check for API version compatibility

#### "Request failed with status code 401" error

**Symptoms:**
- Commands fail with 401 Unauthorized errors

**Solutions:**
1. User needs to re-authenticate with `/login`
2. Check if access token is being correctly stored and encrypted
3. Verify the session storage is working correctly

### Session Storage Issues

#### User keeps getting logged out

**Symptoms:**
- Users have to login repeatedly
- Session doesn't persist between bot restarts

**Possible Causes:**
- Session storage not configured correctly
- Session TTL too short
- Database connectivity issues

**Solutions:**
1. Check SESSION_DRIVER configuration in .env
2. Increase SESSION_TTL value (default: 7 days)
3. Verify storage connectivity:
   - Redis: `redis-cli ping`
   - MongoDB: `mongo --eval "db.stats()"`
   - PostgreSQL: `psql -U postgres -c "SELECT 1"`
4. Check storage logs for errors

### Wallet Management Issues

#### Wallets not displaying

**Symptoms:**
- No wallets shown when using `/wallet` command

**Solutions:**
1. Verify the user has created wallets in their CopperX account
2. Check API responses in logs for any errors
3. Try creating a new wallet with the "Create Wallet" action

#### "Failed to create wallet" error

**Symptoms:**
- Error when trying to create a new wallet

**Solutions:**
1. Check if the selected chain is supported
2. Verify API response logs for specific error details
3. Ensure the user has permissions to create wallets

### Transfer Issues

#### "Insufficient funds" error

**Symptoms:**
- User gets insufficient funds error when sending/withdrawing

**Solutions:**
1. Verify wallet balance is sufficient (including fees)
2. Check if funds are locked/pending
3. Try with a smaller amount

#### "Invalid recipient" error

**Symptoms:**
- Error when trying to send funds to an email or address

**Solutions:**
1. Verify the email address or wallet address is valid
2. Check for typos or formatting errors
3. For wallet transfers, ensure the address is valid for the selected chain

### Notification Issues

#### No deposit notifications

**Symptoms:**
- User doesn't receive notifications for deposits

**Possible Causes:**
- Pusher configuration issues
- Notification subscription failed
- Webhook configuration issues

**Solutions:**
1. Verify Pusher credentials in .env:
   ```
   PUSHER_APP_ID=...
   PUSHER_KEY=...
   PUSHER_SECRET=...
   PUSHER_CLUSTER=...
   ```
2. Check logs for Pusher connection errors
3. Try reconnecting with `/test_notifications` command (dev mode only)
4. Verify the user has the correct organization ID for notifications

### Deployment Issues

#### Application crash on startup

**Symptoms:**
- Application crashes immediately after starting

**Solutions:**
1. Check logs for startup errors
2. Verify all required environment variables are set
3. Ensure the database migration has run (if applicable)
4. Check Node.js version compatibility
5. Verify dependencies are installed:
   ```bash
   npm install
   ```

#### Memory issues in production

**Symptoms:**
- Bot becomes unresponsive over time
- Out of memory errors in logs

**Solutions:**
1. Increase available memory for the application
2. Add memory monitoring
3. Look for memory leaks in the application
4. Implement proper garbage collection

## Debugging Techniques

### Enabling Debug Logs

Set the log level to debug for more detailed logs:

```
LOG_LEVEL=debug
```

### Testing API Connectivity

Test direct API connectivity:

```bash
curl -I https://income-api.copperx.io/api/health
```

### Checking Session Storage

#### Redis
```bash
redis-cli
> KEYS "user:*"
```

#### SQLite
```bash
sqlite3 .sessions.db
> SELECT * FROM sessions LIMIT 5;
```

#### MongoDB
```bash
mongo
> use copperx_bot
> db.sessions.find().limit(5)
```

#### PostgreSQL
```bash
psql -U postgres -d copperx_bot
> SELECT * FROM sessions LIMIT 5;
```

### Testing Webhook Endpoints

Test your webhook endpoint:

```bash
curl -I https://your-domain.com/your-bot-path
```

## Getting Help

If you've tried the troubleshooting steps above and still have issues:

1. **Check Documentation**:
   - Review the full documentation
   - Check the CopperX API documentation

2. **Contact Support**:
   - Reach out via [CopperX Telegram Community](https://t.me/copperxcommunity/2183)
   - Provide detailed error information and logs

3. **GitHub Issues**:
   - Check existing issues for similar problems
   - Create a new issue with detailed reproduction steps

## Reporting Bugs

When reporting bugs, please include:

1. Description of the problem
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Bot version/commit hash
6. Environment information (OS, Node.js version)
7. Relevant logs (with sensitive information redacted)

## Advanced Troubleshooting

### Bot Performance

#### Slow responses

If the bot is responding slowly:

1. Check API response times in logs
2. Monitor server resource usage (CPU, memory)
3. Consider scaling the application if needed
4. Check for slow database queries

### Security Issues

If you suspect a security issue:

1. Do not post details publicly
2. Contact CopperX security team directly
3. Temporarily disable the bot if necessary
4. Check for unauthorized access in logs 