import { KycStatus } from '../../src/types/api.types';

export interface KycStatusResponse {
    status: KycStatus | null;
    message: string;
}

export const mockKycResponses: Record<KycStatus | 'error' | 'null', KycStatusResponse> = {
    approved: {
        status: 'approved',
        message: '✅ *KYC Verified*\n\nYour KYC verification has been approved.'
    },
    pending: {
        status: 'pending',
        message: '⏳ *KYC Pending*\n\nYou need to complete KYC verification to use all features.'
    },
    initiated: {
        status: 'initiated',
        message: '🔄 *KYC In Progress*\n\nPlease complete your KYC verification.'
    },
    inprogress: {
        status: 'inprogress',
        message: '🔄 *KYC In Progress*\n\nYour verification is being processed.'
    },
    expired: {
        status: 'expired',
        message: '⚠️ *KYC Expired*\n\nYour KYC verification has expired. Please complete the process again.'
    },
    rejected: {
        status: 'rejected',
        message: '❌ *KYC Rejected*\n\nYour KYC verification was not approved. Please try again.'
    },
    review_pending: {
        status: 'review_pending',
        message: '👀 *KYC Under Review*\n\nYour verification is pending review.'
    },
    review: {
        status: 'review',
        message: '👀 *KYC Under Review*\n\nYour verification is being reviewed.'
    },
    provider_manual_review: {
        status: 'provider_manual_review',
        message: '👀 *KYC Under Provider Review*\n\nYour verification is being reviewed by our provider.'
    },
    manual_review: {
        status: 'manual_review',
        message: '👀 *KYC Under Manual Review*\n\nYour verification is being reviewed manually.'
    },
    provider_on_hold: {
        status: 'provider_on_hold',
        message: '⏸️ *KYC On Hold*\n\nYour verification is currently on hold by our provider.'
    },
    on_hold: {
        status: 'on_hold',
        message: '⏸️ *KYC On Hold*\n\nYour verification is currently on hold.'
    },
    error: {
        status: null,
        message: '❌ Error retrieving KYC status'
    },
    null: {
        status: null,
        message: '❓ Unknown KYC status'
    }
}; 