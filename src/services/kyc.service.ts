import kycApi from '../api/kyc.api';
import { Kyc, KycStatus } from '../types/api.types';
import logger from '../utils/logger.utils';
import { GlobalContext } from '../types/session.types';
import { authService } from './auth.service';

const KYC_APPLICATION_URL = 'https://payout.copperx.io/app/kyc';

export class KycService {
    /**
     * Get the user's KYC status
     */
    public async getKycStatus(ctx: GlobalContext): Promise<{
        status: KycStatus | null;
        message: string;
        kyc?: Kyc;
    }> {
        try {
            let email = ctx.session?.auth?.email;

            if (!email) {
                // Try to get email from profile
                const profile = await authService.getCurrentUser();
                email = profile?.email;
            }

            if (!email) {
                return {
                    status: null,
                    message: '❌ You need to log in first to check your KYC status.'
                };
            }

            // First try to get status directly from email
            try {
                const statusInfo = await kycApi.getKycStatusFromEmail(email) as KycStatus;


                // If we have kyc records, get more detailed information
                if (statusInfo) {
                    return {
                        status: statusInfo,
                        message: this.formatKycStatusMessage(statusInfo)
                    };
                }

                return {
                    status: null,
                    message: '🔍 No KYC verification record found. Please start the verification process.'
                };
            } catch (error) {
                logger.error('Error fetching KYC status', { error, email });
                return {
                    status: null,
                    message: '❌ Unable to retrieve your KYC status. Please try again later.'
                };
            }
        } catch (error) {
            logger.error('Error in KYC service', { error });
            return {
                status: null,
                message: '❌ An unexpected error occurred. Please try again later.'
            };
        }
    }

    /**
     * Format a user-friendly message based on KYC status
     */
    private formatKycStatusMessage(status: KycStatus | null): string {
        if (!status) {
            return '🔍 Your KYC status could not be determined. Please start or continue the verification process at:\n' +
                `${KYC_APPLICATION_URL}`;
        }

        // Emoji for each status type
        const statusEmoji = {
            pending: '⏳',
            initiated: '🔄',
            inprogress: '🔄',
            review_pending: '📝',
            review: '📝',
            provider_manual_review: '👨‍💼',
            manual_review: '👨‍💼',
            provider_on_hold: '⏸️',
            on_hold: '⏸️',
            expired: '⌛',
            approved: '✅',
            rejected: '❌'
        };

        // Title based on status
        let message = `*KYC Status: ${statusEmoji[status] || '🔶'} ${this.formatStatusText(status)}*\n\n`;

        // Add additional information based on the status
        switch (status) {
            case 'approved':
                message += 'Your identity has been verified successfully. You have full access to the platform features.';
                break;
            case 'rejected':
                message += 'Unfortunately, your verification was not successful. Please contact support for more information.';
                break;
            case 'expired':
                message += 'Your verification request has expired. Please start a new verification process.';
                break;
            case 'pending':
            case 'initiated':
                message += 'Your verification has been initiated. Please complete the required steps at:\n' +
                    `${KYC_APPLICATION_URL}`;
                break;
            case 'inprogress':
            case 'review_pending':
            case 'review':
            case 'provider_manual_review':
            case 'manual_review':
                message += 'Your verification is currently being reviewed. Verification can take up to 3 business days after KYC of all UBO. If you haven\'t received a response after this time, Contact compliance@copperx.io';
                break;
            case 'provider_on_hold':
            case 'on_hold':
                message += 'Your verification is currently on hold. This may require additional information. Please contact support.';
                break;
            default:
                message += 'Please contact support for more information about your verification status.';
        }

        return message;
    }

    /**
     * Format status text for display
     */
    private formatStatusText(status: KycStatus): string {
        return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}

export const kycService = new KycService();
export default kycService; 