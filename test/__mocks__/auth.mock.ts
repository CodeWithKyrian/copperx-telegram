import { AuthUser } from '../../src/types/api.types';

export const mockAuthUser: AuthUser = {
    id: 'user-123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    profileImage: 'https://example.com/avatar.jpg',
    organizationId: 'org-456',
    role: 'owner',
    status: 'active',
    type: 'individual',
    relayerAddress: '0xrelay123',
    flags: ['intro'],
    walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
    walletId: 'wallet-789',
    walletAccountType: 'web3_auth_copperx'
};

export const mockIncompleteAuthUser: AuthUser = {
    id: 'user-456',
    role: 'user',
    status: 'pending',
    relayerAddress: '0xrelay456'
}; 