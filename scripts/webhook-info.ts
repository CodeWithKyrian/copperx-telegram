import { initBot } from '../src/bot';
import { getWebhookInfo } from '../src/server';
import { config } from '../src/config';
import '../src/config'; // Load environment variables

/**
 * Script to get webhook information from Telegram
 * Usage: npm run webhook-info
 */
async function main() {
    try {
        console.log('Fetching webhook information for Telegram bot...');

        const bot = initBot();

        const webhookInfo = await getWebhookInfo(bot);

        console.log('\nWebhook Information:');
        console.log('--------------------------');
        console.log(`URL: ${webhookInfo.url || 'Not set'}`);
        console.log(`Has Custom Certificate: ${webhookInfo.has_custom_certificate}`);
        console.log(`Pending Update Count: ${webhookInfo.pending_update_count}`);
        console.log(`Max Connections: ${webhookInfo.max_connections}`);
        console.log(`IP Address: ${webhookInfo.ip_address || 'Not set'}`);
        console.log(`Last Error Date: ${webhookInfo.last_error_date ? new Date(webhookInfo.last_error_date * 1000).toISOString() : 'None'}`);
        console.log(`Last Error Message: ${webhookInfo.last_error_message || 'None'}`);
        console.log(`Last Synchronization Error Date: ${webhookInfo.last_synchronization_error_date ? new Date(webhookInfo.last_synchronization_error_date * 1000).toISOString() : 'None'}`);
        console.log(`Allowed Updates: ${webhookInfo.allowed_updates ? webhookInfo.allowed_updates.join(', ') : 'All'}`);

        // Show current environment configuration
        console.log('\nCurrent Environment Configuration:');
        console.log('--------------------------');
        console.log(`Environment: ${config.env.nodeEnv}`);
        console.log(`App Domain: ${config.env.app.domain || 'Not set'}`);
        console.log(`App Port: ${config.env.app.port}`);
        console.log(`Webhook Secret Path: ${config.env.webhook.secretPath || 'Not set'}`);
        console.log(`Webhook Secret Token: ${config.env.webhook.secretToken ? '****' : 'Not set'}`);

        process.exit(0);
    } catch (error) {
        console.error('Error fetching webhook information:');
        console.error(error);
        process.exit(1);
    }
}

// Run the script
main(); 