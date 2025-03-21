# CopperX Telegram Bot - Security Documentation

This document outlines the security features and best practices implemented in the CopperX Telegram Bot.

## Security Overview

The CopperX Telegram Bot is designed with security as a primary concern, especially given that it handles financial transactions and sensitive user data. Key security features include:

- Secure authentication flows
- Encrypted session storage
- Token and credential protection
- Rate limiting
- Protected routes
- HTTPS-only communication
- Comprehensive logging
- Input validation

## Authentication Security

### User Authentication

The bot implements a secure authentication flow:

1. Email-based One-Time Password (OTP) authentication
2. Limited OTP validity period
3. Rate limiting on authentication attempts
4. Automatic session expiration
5. Secure token handling

### Token Management

Access tokens are:

1. Never logged or exposed in plaintext
2. Encrypted in storage using AES-256-GCM
3. Stored with a TTL (time-to-live)
4. Automatically refreshed when needed
5. Invalidated on logout

## Session Security

### Encryption

All sensitive session data, including authentication tokens, is encrypted using:

- **Encryption Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with a high iteration count
- **Key Management**: APP_KEY environment variable

### Session Storage Options

The bot supports multiple session storage options with security considerations:

1. **Memory**: Temporary storage, lost on restart (development only)
2. **SQLite**: File-based storage with proper file permissions
3. **Redis**: Password-protected, optionally with TLS
4. **MongoDB**: Authentication and TLS support
5. **PostgreSQL**: User authentication and TLS support

### Session Expiration

Sessions automatically expire after a configurable period (default: 7 days) to mitigate the risk of unauthorized access.

## API Security

### Request Security

All API requests:

1. Use HTTPS only
2. Include appropriate authorization headers
3. Have request timeouts
4. Include minimal required data
5. Apply proper input validation

### Response Handling

API responses are handled securely:

1. Sensitive data is filtered from logs
2. Error messages don't expose sensitive information to users
3. Authentication errors trigger re-authentication flows

## Infrastructure Security

### Environment Variables

Sensitive configuration is managed through environment variables:

1. No hardcoded secrets in code
2. `.env` files excluded from version control
3. Example `.env.example` with placeholders only
4. Clear documentation on required variables

### Webhook Security

For production deployments with webhooks:

1. HTTPS requirement for webhooks
2. Secret path or token validation
3. IP filtering options
4. Request validation

## Rate Limiting

The bot implements rate limiting to:

1. Prevent brute force attacks on authentication
2. Avoid API quota exhaustion
3. Protect against denial of service
4. Implement exponential backoff for retries

Implementation details:

```typescript
// Rate limit middleware configuration
const rateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // max 10 requests per window
  message: 'Too many requests, please try again later',
  keyGenerator: (ctx) => ctx.from?.id.toString() || 'anonymous'
});
```

## Protected Routes

The bot implements route protection:

1. Commands requiring authentication are clearly defined
2. Middleware checks authentication status before processing
3. Unauthenticated users are redirected to login

Protected commands and actions are defined in configuration:

```typescript
// Example of protected commands configuration
export const PROTECTED_COMMANDS = [
  'logout', 'profile', 'wallet', 'deposit', 'send', 
  'kyc', 'withdraw', 'payees', 'history'
];
```

## Input Validation

All user inputs are validated:

1. Email format validation
2. Amount format and range checks
3. Wallet address format validation
4. Special character escaping/filtering
5. Size limits on inputs

## Logging and Monitoring

Security events are logged:

1. Authentication attempts (success/failure)
2. Access to protected resources
3. Rate limit hits
4. API errors
5. Session management events

Logs include:

1. Timestamp
2. Event type
3. User ID (when available)
4. IP information
5. Relevant context (without sensitive data)

## Log Security and Redaction

The bot implements automatic redaction of sensitive information in logs:

1. **Automatic Redaction** - Sensitive data is automatically redacted from logs
   - Authentication tokens
   - API keys
   - Authorization headers
   - CSRF tokens
   - Other credentials

2. **Implementation**
   ```typescript
   // Configuration for log redaction
   redact: [
       'req.headers.authorization',
       'req.headers.x-api-key',
       'req.headers.x-csrf-token',
       'token',
       'accessToken',
       // ...
   ]
   ```

3. **Benefits**
   - Prevents accidental exposure of credentials in logs
   - Secures debugging information
   - Allows safe log sharing for troubleshooting
   - Compliance with data protection requirements

4. **What Gets Redacted**
   - Access tokens
   - API keys and secrets
   - Session identifiers
   - User credentials
   - Any specified sensitive paths

## Error Handling

Secure error handling:

1. Generic error messages to users
2. Detailed internal logging
3. No stack traces or technical details exposed to users
4. Graceful handling of unexpected errors

## Security Best Practices for Operators

When operating the bot:

1. **Environment Setup**
   - Use a dedicated non-root user
   - Apply principle of least privilege
   - Keep systems updated

2. **Key Management**
   - Generate a strong APP_KEY
   - Rotate keys periodically
   - Secure key storage

3. **Environment Variable Management**
   - Use secrets management services when possible
   - Limit access to production environment variables
   - Never commit .env files to version control

4. **Deployment Security**
   - Use secure deployment platforms
   - Implement proper firewall rules
   - Enable HTTPS with valid certificates
   - Regular security updates

5. **Monitoring**
   - Set up alerts for suspicious activities
   - Monitor authentication failures
   - Watch for unusual usage patterns

## Security Testing

The bot has undergone:

1. Static code analysis for security issues
2. Dependency vulnerability scanning
3. Input validation testing
4. Authentication/authorization testing
5. Session management testing

## Reporting Security Issues

If you discover a security vulnerability:

1. Do NOT disclose it publicly on GitHub issues or forums
2. Email security concerns directly to the CopperX security team
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before disclosure

## Security Compliance

The bot is designed with consideration for:

1. Data protection regulations
2. Financial service security requirements
3. Telegram Bot API security requirements
4. Modern application security best practices

## Additional Security Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security)
- [CopperX API Documentation](https://income-api.copperx.io/api/doc)

## Conclusion

Security is an ongoing process, and the CopperX Telegram Bot is continuously improved to address emerging threats and security best practices. Users are encouraged to report security concerns and follow security best practices when using the bot. 