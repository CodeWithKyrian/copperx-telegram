export interface SuccessResponse {
    message: string;
    statusCode: number;
}

export interface ErrorResponse {
    message: any;
    statusCode: number;
    error: string;
}

export interface PaginatedResponse<D> {
    data: D[];
    page: number;
    limit: number;
    count: number;
    hasMore: boolean;
}

export interface ListResponse<D> {
    data: D[];
}

export interface LoginEmailOtpRequest {
    email: string;
}

export interface LoginEmailOtpResponse {
    email: string;
    sid: string;
}


export interface VerifyEmailOtpRequest {
    email: string;
    otp: string;
    sid: string;
}

export type UserRole = 'owner' | 'user' | 'admin' | 'member';

export type UserStatus = 'pending' | 'active' | 'suspended';

export type CustomerProfileType = 'individual' | 'business';

export interface AuthUser {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;

    profileImage?: string;
    organizationId?: string;
    role: UserRole;
    status: UserStatus;
    type?: CustomerProfileType;
    relayerAddress: string;
    flags?: string[];
    walletAddress?: string;
    walletId?: string;
    walletAccountType?: string;
}

export interface AuthenticateResponse {
    scheme: string;
    accessToken: string;
    accessTokenId: string;
    expireAt: string;
    user: AuthUser;
}

export interface Web3AuthAuthenticateRequest {
    token: string;
    walletAddress?: string;
}


export type UserFlag = 'intro' | 'disable_offramp' | 'only_31' | 'third_party' | 'virtual_account' | 'manual_submit_kyb';


export interface PersonalAccessToken {
    id: string;
    name: string;
    tokenIdentifier: string;
    organizationId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePersonalAccessToken {
    name: string;
}

export interface PersonalAccessTokenWithPlainToken {
    id: string;
    name: string;
    tokenIdentifier: string;
    organizationId: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
    token: string;
}

export interface UpdatePersonalAccessToken {
    name: string;
}

export type WalletAccountType = 'web3_auth_copperx' | 'safe' | 'circle_dev' | 'eoa' | 'other' | 'quantum';

export interface Wallet {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    walletType: WalletAccountType;
    network?: string;
    walletAddress?: string;
    isDefault?: boolean;
}

export interface BalanceResponse {
    decimals: number;
    balance: string;
    symbol: 'USDC' | 'USDT' | 'DAI' | 'ETH' | 'USDCE' | 'STRK';
    address: string;
}

export interface WalletBalance {
    walletId: string;
    isDefault: boolean;
    network: string;
    balances: BalanceResponse[];
}

export interface SetDefaultWallet {
    walletId: string;
}

export interface GenerateWalletRequest {
    network: string;
}

export type ChainId = '1' | '5' | '137' | '80002' | '42161' | '421614' | '8453' | '84532' | '10' | '11155111' | '11155420' | '56' | '97' | '1399811149' | '1399811150' | '23434' | '39361';

export type Currency = "USD" | "INR" | "AED" | "IDR" | "PKR" | "SGD" | "EUR" | "MYR" | "CAD" | "KYD" | "LBP" | "TRY" | "XCD" | "VND" | "THB" | "HKD" | "BDT" | "PHP" | "KHR" | "AUD" | "GBP" | "NPR" | "LKR" | "XOF" | "XAF" | "GHS" | "KES" | "MZN" | "TZS" | "UGX" | "NZD" | "KRW" | "MMK" | "JPY" | "BRL" | "CNY" | "USDC" | "USDT" | "DAI" | "ETH" | "USDCE" | "STRK";

export type KycStatus = 'pending' | 'initiated' | 'inprogress' | 'review_pending' | 'review' | 'provider_manual_review' | 'manual_review' | 'provider_on_hold' | 'on_hold' | 'expired' | 'approved' | 'rejected';

export type ProviderCode = '0x0' | '0x1' | '0x2' | '0x11' | '0x21' | '0x22' | '0x31' | '0x41' | '0x23' | '0x24' | '0xffff';

export type KycProviderCode = 'sumsub' | 'sumsub_uae' | 'sumsub_global' | 'hyperverge_ind' | 'persona' | 'manual';

export interface KycVerification {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    organizationId: string;
    kycDetailId: string;
    kycProviderCode: KycProviderCode;
    externalCustomerId?: string;
    status: KycStatus;
    externalStatus?: string;
    verifiedAt?: string;
}

export type KycDocumentType = 'passport' | 'aadhar_card' | 'pan_card' | 'driving_license' | 'national_id' | 'tax_id' | 'voter_id' | 'utility_bill' | 'bank_statement' | 'credit_card_statement' | 'other';

export type KycDocumentVerificationStatus = 'pending' | 'initiated' | 'inprogress' | 'review_pending' | 'review' | 'provider_manual_review' | 'manual_review' | 'provider_on_hold' | 'on_hold' | 'expired' | 'approved' | 'rejected';

export interface KycDocument {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    organizationId: string;
    kycDetailId: string;
    documentType: KycDocumentType;
    status: KycDocumentVerificationStatus;
    frontFileName?: string;
    backFileName?: string;
}

export type UBOType = 'owner' | 'signer' | 'control';

export interface KycDetail {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    organizationId: string;
    kycDetailId?: string;
    nationality?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    email?: string;
    phoneNumber?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    positionAtCompany?: string;
    sourceOfFund?: string;
    currentKycVerificationId?: string;
    dateOfBirth?: string;
    placeOfBirth?: string;
    currentKycVerification?: KycVerification;
    kycDocuments?: KycDocument[];
    kycUrl?: string;
    uboType: UBOType;
    kycStatus?: KycStatus;
    kycDocumentStatus?: KycDocumentVerificationStatus;
    percentageOfShares: number;
    joiningDate: string;
}

export type AccountType = 'web3_wallet' | 'bank_account';

export type TransferAccountType = 'web3_wallet' | 'bank_ach' | 'bank_ach_push' | 'bank_wire' | 'bank_transfer' | 'bank_ifsc' | 'bank_iban';

export type Country = 'usa' | 'ind' | 'are' | 'idn' | 'pak' | 'sgp' | 'esp' | 'can' | 'cym' | 'lbn' | 'mys' | 'deu' | 'ita' | 'fra' | 'gbr' | 'aus' | 'bra' | 'chn' | 'usdc' | 'usdt' | 'dai' | 'eth' | 'usdce' | 'strk';

export type BankAccountType = 'savings' | 'checking';

export interface BankAccount {
    bankName: string;
    bankAddress: string;
    method: TransferAccountType;
    bankAccountType: BankAccountType;
    bankRoutingNumber: string;
    bankAccountNumber: string;
    bankBeneficiaryName: string;
    swiftCode: string;
}

export type AccountStatus = 'pending' | 'initiated' | 'inprogress' | 'review_pending' | 'review' | 'manual_review' | 'on_hold' | 'verified' | 'rejected';

export interface AccountProviderSlim {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    accountId: string;
    providerId: string;
    status: AccountStatus;
    supportRemittance?: boolean;
    providerCode?: ProviderCode;
}


export interface Account {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    organizationId: string;
    type: AccountType;
    walletAccountType: WalletAccountType;
    method?: TransferAccountType;
    country?: Country;
    network?: string;
    walletAddress?: string;
    isDefault?: boolean;
    bankAccount?: BankAccount;
    accountKycs?: KycDetail[];
}

export interface CreateAccountRequest {
    country: Country;
    network: string;
    walletAddress: string;
    isDefault: boolean;
    bankAccount: BankAccount;
    providerId: string;
}

export type TransferStatus = 'pending' | 'initiated' | 'processing' | 'success' | 'canceled' | 'failed' | 'refunded';

export interface SubmitPermitRequest {
    signature: string;
    args: string;
    argsHash: string;
}

export interface SubmitPermitResponse {
    hash: string;
}

export interface Customer {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    name?: string;
    businessName?: string;
    email?: string;
    country?: string;
}

export type TransferType = 'send' | 'receive' | 'withdraw' | 'deposit' | 'bridge' | 'bank_deposit';

export type PurposeCode = 'self' | 'salary' | 'gift' | 'income' | 'saving' | 'education_support' | 'family' | 'home_improvement' | 'reimbursement';

export type SourceOfFunds = 'salary' | 'savings' | 'lottery' | 'investment' | 'loan' | 'business_income' | 'others';

export type RecipientRelationship = 'self' | 'spouse' | 'son' | 'daughter' | 'father' | 'mother' | 'other';

export type TransferMode = 'on_ramp' | 'off_ramp' | 'remittance' | 'on_chain';

export type TransactionType = 'send' | 'receive' | 'withdraw' | 'deposit' | 'bridge' | 'bank_deposit';

export type TransactionStatus = 'pending' | 'initiated' | 'processing' | 'success' | 'canceled' | 'failed' | 'refunded';

export interface TransferAccount {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    type: TransferType;
    country?: Country;
    network?: string;
    accountId?: string;
    walletAddress?: string;
    bankName?: string;
    bankAddress?: string;
    bankAccountNumber?: string;
    bankRoutingNumber?: string;
    bankDepositMessage?: string;
    wireMessage?: string;
    payeeEmail?: string;
    payeeOrganizationId?: string;
    payeeId?: string;
    payeeName?: string;
}

export interface Transaction {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    organizationId: string;
    type: TransactionType;
    providerCode: ProviderCode;
    kycId?: string;
    transferId?: string;
    status: TransactionStatus;
    externalStatus?: string;
    fromAccountId?: string;
    toAccountId?: string;
    fromAmount?: string;
    fromCurrency: Currency;
    toAmount?: string;
    toCurrency: Currency;
    totalFee?: string;
    feeCurrency?: Currency;
    feeAmount?: string;
    transactionHash?: string;
    depositAccount?: TransferAccount;
    externalTransactionId?: string;
    externalCustomerId?: string;
    depositUrl?: string;
}

export interface TransferWithTransactionsOnly {
    id: string;
    createdAt?: string;
    updatedAt?: string;
    organizationId: string;
    status: TransferStatus;
    customerId: string;
    customer: Customer;
    type: TransferType;
    sourceCountry: Country;
    destinationCountry: Country;
    destinationCurrency: Currency;
    amount: string;
    currency: Currency;
    amountSubtotal: string;
    totalFee: string;
    feePercentage: string;
    feeCurrency: Currency;
    invoiceNumber: string;
    invoiceUrl: string;
    sourceOfFundsFile: string;
    note: string;
    purposeCode: PurposeCode;
    sourceOfFunds: SourceOfFunds;
    recipientRelationship: RecipientRelationship;
    sourceAccountId: string;
    sourceAccount: TransferAccount;
    destinationAccountId: string;
    destinationAccount: TransferAccount;
    paymentUrl: string;
    mode: TransferMode;
    isThirdPartyPayment: boolean;
    transactions: Transaction[];
}

export interface CustomerData {
    name?: string;
    businessName?: string;
    email?: string;
    country?: string;
}

export interface CreateOfframpTransferRequest {
    invoiceNumber?: string;
    invoiceUrl?: string;
    purposeCode?: PurposeCode;
    sourceOfFunds?: SourceOfFunds;
    recipientRelationship?: RecipientRelationship;
    quotePayload: string;
    quoteSignature: string;
    preferredWalletId?: string;
    customerData?: CustomerData;
    sourceOfFundsFile?: string;
    note?: string;
}

export interface TransferWithAccount {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    status: TransferStatus;
    customerId?: string;
    customer?: Customer;
    type: TransferType;
    sourceCountry: Country;
    destinationCountry: Country;
    destinationCurrency: Currency;
    amount: string;
    currency: Currency;
    amountSubtotal?: string;
    totalFee?: string;
    feePercentage?: string;
    feeCurrency: Currency;
    invoiceNumber?: string;
    invoiceUrl?: string;
    sourceOfFundsFile?: string;
    note?: string;
    purposeCode?: PurposeCode;
    sourceOfFunds?: SourceOfFunds;
    recipientRelationship?: RecipientRelationship;
    sourceAccountId?: string;
    destinationAccountId?: string;
    paymentUrl?: string;
    mode?: TransferMode;
    isThirdPartyPayment: boolean;
    sourceAccount?: TransferAccount;
    destinationAccount?: TransferAccount;
    senderDisplayName?: string;
}

export interface CreateOnrampTransferRequest {
    invoiceNumber?: string;
    invoiceUrl?: string;
    purposeCode?: PurposeCode;
    sourceOfFunds?: SourceOfFunds;
    recipientRelationship?: RecipientRelationship;
    quotePayload: string;
    quoteSignature: string;
    preferredWalletId?: string;
    customerData?: CustomerData;
}

export interface CreateWalletWithdrawTransferRequest {
    walletAddress: string;
    amount: string;
    purposeCode: PurposeCode;
    currency?: Currency;
}

export interface CreateSendTransferRequest {
    walletAddress?: string;
    email?: string;
    payeeId?: string;
    amount: string;
    purposeCode: PurposeCode;
    currency?: Currency;
}

export interface CreateSendTransferBatchSingleRequest {
    requestId: string;
    request: CreateSendTransferRequest;
}

export interface CreateSendTransferBatchRequest {
    requests: CreateSendTransferBatchSingleRequest[];
}

export interface Transfer {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    status: TransferStatus;
    customerId?: string;
    customer?: Customer;
    type: TransferType;
    sourceCountry: Country;
    destinationCountry: Country;
    destinationCurrency: Currency;
    amount: string;
    currency: Currency;
    amountSubtotal?: string;
    totalFee?: string;
    feePercentage?: string;
    feeCurrency: Currency;
    invoiceNumber?: string;
    invoiceUrl?: string;
    sourceOfFundsFile?: string;
    note?: string;
    purposeCode?: PurposeCode;
    sourceOfFunds?: SourceOfFunds;
    recipientRelationship?: RecipientRelationship;
    sourceAccountId?: string;
    destinationAccountId?: string;
    paymentUrl?: string;
    mode?: TransferMode;
    isThirdPartyPayment: boolean;
}

export interface CreateSendTransferBatchSingleResponse {
    requestId: string;
    request: CreateSendTransferRequest;
    response: Transfer;
    error?: Error;
}

export interface CreateSendTransferBatchResponse {
    responses: CreateSendTransferBatchSingleResponse[];
}

export interface CreateSolanaDepositTransferRequest {
    amount: string;
    sourceOfFunds?: SourceOfFunds;
    depositChainId?: number;
}

export interface CreateBridgeTransferRequest {
    sourceNetwork: ChainId;
    amount: string;
    sourceOfFunds?: SourceOfFunds;
}

export interface BridgeTransferBalance {
    chainId: ChainId;
    balance: string;
}

export interface BridgeTransferBalances {
    balances: BridgeTransferBalance[];
}

export interface TransferWithTransactions {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    status: TransferStatus;
    customerId?: string;
    customer?: Customer;
    type: TransferType;
    sourceCountry: Country;
    destinationCountry: Country;
    destinationCurrency: Currency;
    amount: string;
    currency: Currency;
    amountSubtotal?: string;
    totalFee?: string;
    feePercentage?: string;
    feeCurrency: Currency;
    invoiceNumber?: string;
    invoiceUrl?: string;
    sourceOfFundsFile?: string;
    note?: string;
    purposeCode?: PurposeCode;
    sourceOfFunds?: SourceOfFunds;
    recipientRelationship?: RecipientRelationship;
    sourceAccountId?: string;
    destinationAccountId?: string;
    paymentUrl?: string;
    mode?: TransferMode;
    isThirdPartyPayment: boolean;
    sourceAccount?: TransferAccount;
    destinationAccount?: TransferAccount;
    senderDisplayName?: string;
    transactions?: Transaction[];
}

export interface TransactionWithAccount {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    type: TransactionType;
    providerCode: ProviderCode;
    kycId?: string;
    transferId?: string;
    status: TransactionStatus;
    externalStatus?: string;
    fromAccountId?: string;
    toAccountId?: string;
    fromAmount?: string;
    fromCurrency: Currency;
    toAmount?: string;
    toCurrency: Currency;
    totalFee?: string;
    feeCurrency: Currency;
    transactionHash?: string;
    depositAccount?: TransferAccount;
    externalTransactionId?: string;
    externalCustomerId?: string;
    depositUrl?: string;
    fromAccount?: TransferAccount;
    toAccount?: TransferAccount;
}

export interface PaymentAccountPublic {
    type: TransferAccountType;
    country: Country;
    network?: string;
    walletAddress?: string;
    bankName?: string;
    bankAddress?: string;
    bankRoutingNumber?: string;
    bankAccountNumber?: string;
    bankDepositMessage?: string;
    wireMessage?: string;
    amount: string;
    currency: string;
}

export interface PublicCustomerProfile {
    type: CustomerProfileType;
    firstName?: string;
    lastName?: string;
    businessName?: string;
    email?: string;
    receiverName: string;
}

export interface PaymentPublic {
    status: TransferStatus;
    customer?: Customer;
    type: TransferType;
    amount: string;
    currency: Currency;
    invoiceNumber?: string;
    invoiceUrl?: string;
    purposeCode?: PurposeCode;
    depositAccount?: PaymentAccountPublic;
    receiverCustomer?: PublicCustomerProfile;
}

export type RouteStatus =
    | "active"
    | "inactive"
    | "kyc_required"
    | "kyc_for_country_required"
    | "kyc_in_progress"
    | "kyc_rejected"
    | "bank_account_required"
    | "bank_account_verification_required"
    | "wallet_account_required"
    | "invalid_amount";

export interface Route {
    sourceCountry: Country;
    sourceCurrency: Currency;
    sourceMethod: TransferAccountType;
    destinationCountry: Country;
    destinationCurrency: Currency;
    destinationMethod: TransferAccountType;
    mode: TransferMode;
    providerCode: ProviderCode;
    status: RouteStatus;
    kycId?: string;
    kycStatus?: string;
    info?: string;
}

export interface Routes {
    routes: Route[];
    approvedProviders: ProviderCode[];
}

export interface DepositBankAccount {
    bankName?: string;
    bankAddress?: string;
    method?: TransferAccountType;
    country?: Country;
    bankAccountType?: string;
    bankRoutingNumber?: string;
    bankAccountNumber?: string;
    bankBeneficiaryName?: string;
    bankDepositMessage?: string;
    swiftCode?: string;
    feePercentage?: string;
}

export interface CreateVirtualAccount {
    network?: string;
}

export interface PayeeBankAccount {
    country: Country;
    bankName: string;
    bankAddress: string;
    type: TransferAccountType;
    bankAccountType: BankAccountType;
    bankRoutingNumber: string;
    bankAccountNumber: string;
    bankBeneficiaryName: string;
    bankBeneficiaryAddress: string;
    swiftCode: string;
}

export interface Payee {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    nickName: string;
    firstName?: string;
    lastName?: string;
    email: string;
    phoneNumber?: string;
    displayName?: string;
    bankAccount?: PayeeBankAccount;
    isGuest?: boolean;
    hasBankAccount: boolean;
}

export interface CreatePayeeBankAccountRequest {
    country: Country;
    bankName: string;
    bankAddress: string;
    type: TransferAccountType;
    bankAccountType: BankAccountType;
    bankRoutingNumber: string;
    bankAccountNumber: string;
    bankBeneficiaryName: string;
    bankBeneficiaryAddress: string;
    swiftCode: string;
}

export interface CreatePayeeRequest {
    nickName: string;
    firstName?: string;
    lastName?: string;
    email: string;
    bankAccount?: CreatePayeeBankAccountRequest;
}

export interface UpdatePayeeRequest {
    nickName: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
}

export interface ProviderData {
    kycUrl?: string;
    tosUrl?: string;
    externalStatus?: string;
}

export interface Provider {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    status: KycStatus;
    providerCode: ProviderCode;
    providerData: ProviderData;
    externalKycId?: string;
    externalCustomerId?: string;
    supportRemittance?: boolean;
    country: string;
}

export interface CreateProviderRequest {
    providerCode: ProviderCode;
    country?: string;
}

export interface UboAdditionalData {
    state?: string;
    has_ownership?: boolean;
    is_signer?: boolean;
    has_control?: boolean;
    relationship_established_at?: string;
    tax_identification_number?: string;
    ownership_percent?: number;
    gov_id_number?: string;
}

export interface OnboardOnPartnerAccountRequest {
    kycId?: string;
    providerCode: ProviderCode;
    auto?: boolean;
    state?: string;
    tax_identification_number?: string;
    gov_id_number?: string;
    business_industry?: string;
    country?: string;
    ubo_details?: UboAdditionalData[];
    signedAgreementId?: string;
}

export interface OfframpQuoteRequest {
    sourceCountry: Country;
    destinationCountry: Country;
    amount: string;
    currency: Currency;
    preferredDestinationPaymentMethods?: string[];
    preferredProviderId?: string;
    thirdPartyPayment?: boolean;
    destinationCurrency?: Currency;
    onlyRemittance?: boolean;
    preferredBankAccountId?: string;
    payeeId?: string;
}

export interface OfframpQuoteResponse {
    minAmount?: string;
    maxAmount?: string;
    arrivalTimeMessage?: string;
    provider?: Provider;
    error?: string;
    quotePayload?: string;
    quoteSignature?: string;
}

export interface OnrampQuoteRequest {
    sourceCountry: Country;
    destinationCountry: Country;
    amount: string;
    currency: Currency;
    preferredSourcePaymentMethods?: string[];
    preferredProviderId?: string;
}

export interface OnrampQuoteResponse {
    minAmount?: string;
    maxAmount?: string;
    arrivalTimeMessage?: string;
    provider?: Provider;
    error?: string;
    quotePayload?: string;
    quoteSignature?: string;
}

export interface PublicOfframpQuoteRequest {
    sourceCountry: Country;
    destinationCountry: string;
    amount: string;
}

export type TransferScheduleStatus = "active" | "inactive";

export type TransferScheduleRepeatType = "daily" | "weekly" | "monthly" | "one_time";

export interface TransferSchedule {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    status: TransferScheduleStatus;
    type: TransferMode;
    sourceCountry: Country;
    destinationCountry: Country;
    amount: string;
    currency: Currency;
    purposeCode?: PurposeCode;
    sourceOfFunds?: SourceOfFunds;
    recipientRelationship?: RecipientRelationship;
    walletAddress?: string;
    email?: string;
    payeeId?: string;
    payee?: Payee;
    repeatType: TransferScheduleRepeatType;
    schedule: string;
}

export interface CreateTransferSchedule {
    amount: string;
    purposeCode?: PurposeCode;
    walletAddress?: string;
    email?: string;
    payeeId?: string;
    repeatType: TransferScheduleRepeatType;
    schedule: string;
}

export interface AllPointsTotal {
    total: number;
}

export interface AllPoints {
    offrampTransferPoints: ListResponse<TransactionPoint>;
    payoutReferralPoints: ListResponse<ReferrerPoint>;
}

export interface TransactionPoint {
    amountUSD: string;
    noOfTransactions: number;
    multiplier: number;
    perUsdPoint: number;
    points: number;
}

export interface ReferrerPoint {
    reference: string;
    totalPoints: number;
    transactionPoints: number;
    referralPoints: number;
    totalTransactions: number;
}

export interface Organization {
    id: string;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
    supportEmail?: string;
    referralCode?: string;
    referrerId?: string;
}

export interface ApplyReferralCode {
    referralCode: string;
}

export type InviteCodeType = "virtual_account_us";

export type InviteCodeStatus = "active" | "used" | "expired";

export interface InviteCode {
    id: string;
    createdAt: string;
    updatedAt: string;
    code: string;
    type: InviteCodeType;
    status: InviteCodeStatus;
    expirationDate: string;
    createdByOrgId: string;
    usedByOrgId?: string;
}

export interface NotificationAuthRequest {
    socket_id: string;
    channel_name?: string;
}

export interface NotificationAuthResponse {
    auth: string;
    user_data?: string;
}

export type PurposeOfFund = "business_transactions" | "charitable_donations" | "investment_purposes" | "payments_to_friends_or_family_abroad" | "payroll" | "personal_or_living_expenses" | "protect_wealth" | "purchase_goods_and_services" | "receive_payments_for_goods_and_services" | "tax_optimization" | "other";

export type HighRiskActivity = "marijuana_or_related_services" | "adult_entertainment" | "gambling" | "hold_client_funds" | "investment_services" | "lending_banking" | "money_services" | "operate_foreign_exchange_virtual_currencies_brokerage_otc" | "safe_deposit_box_rentals" | "third_party_payment_processing" | "weapons_firearms_and_explosives" | "none_of_the_above";


export interface KybDetail {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    companyName: string;
    companyDescription: string;
    website: string;
    incorporationDate: string | null;
    incorporationCountry: string;
    incorporationNumber: string;
    companyType: string;
    companyTypeOther: string;
    natureOfBusiness: string;
    natureOfBusinessOther: string;
    sourceOfFund: string;
    sourceOfFundOther: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    email: string;
    phoneNumber: string;
    currentKybVerificationId: string;
    currentKybVerification: KybVerification;
    kybDocuments: KybDocument[];
    kycDetails: KycDetail[];
    sourceOfFundDescription: string;
    expectedMonthlyVolume: number;
    purposeOfFund: PurposeOfFund;
    purposeOfFundOther: string;
    operatesInProhibitedCountries: boolean;
    taxIdentificationNumber: string;
    highRiskActivities: HighRiskActivity[];

}

export interface KycAdditionalDocument {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    kycId: string;
    name: string;
    fileName: string;
}

export interface Kyc {
    id: string;
    createdAt: string;
    updatedAt: string;
    organizationId: string;
    status: KycStatus;
    type: CustomerProfileType;
    country: string;
    providerCode: ProviderCode;
    kycProviderCode: KycProviderCode;
    kycDetailId: string;
    kycDetail: KycDetail;
    kycAdditionalDocuments: KycAdditionalDocument[];
    statusUpdates: string;
}

export interface KycUrl {
    kycDetailId: string;
    kycUrl: string;
    kycStatus: KycStatus;
    firstName: string;
    lastName: string;
    kycProviderCode: KycProviderCode;
}

export interface CreateKycDetailRequest {
    nationality: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    email: string;
    sourceOfFund?: string;
    positionAtCompany?: string;
    uboType?: UBOType;
    percentageOfShares?: number;
    joiningDate?: string;
}


export interface KybVerification {
    id: string;
    status: string;
}

export interface KybDocument {
    id: string;
    name: string;
    url: string;
}