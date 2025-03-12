import apiClient from './client';
import { authApi } from './auth.api';
import { walletApi } from './wallet.api';
import inviteCodeApi from './invite-code.api';
import notificationApi from './notification.api';
import pointApi from './point.api';
import quoteApi from './quote.api';
import providerApi from './provider.api';
import transactionApi from './transaction.api';
import transferApi from './transfer.api';

export const api = {
    client: apiClient,
    auth: authApi,
    wallet: walletApi,
    inviteCode: inviteCodeApi,
    notification: notificationApi,
    point: pointApi,
    quote: quoteApi,
    provider: providerApi,
    transaction: transactionApi,
    transfer: transferApi,
};

export default api;