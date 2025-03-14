import { transactionsCommand } from '../../src/commands/transactions.command';
import { transactionService } from '../../src/services/transaction.service';
import { createMockContext } from '../utils/mock-context';

jest.mock('../../src/services/transaction.service', () => ({
    transactionService: {
        getTransactions: jest.fn().mockResolvedValue({
            data: [],
            page: 1,
            limit: 10,
            count: 0,
            hasMore: false
        }),
        getTransaction: jest.fn().mockResolvedValue(null),
        formatTransactionsList: jest.fn().mockReturnValue('No transactions found.'),
        formatTransaction: jest.fn().mockReturnValue('Transaction details')
    }
}));

describe('Transactions Command', () => {
    let ctx: any;

    beforeEach(() => {
        ctx = createMockContext();
        jest.clearAllMocks();
    });

    it('should display a message when no transactions are found', async () => {
        // Mock the response for no transactions
        (transactionService.getTransactions as jest.Mock).mockResolvedValueOnce({
            data: [],
            page: 1,
            limit: 10,
            count: 0,
            hasMore: false
        });

        // Call the command
        await transactionsCommand(ctx);

        // Assert
        expect(transactionService.getTransactions).toHaveBeenCalled();
        expect(ctx.reply).toHaveBeenCalledWith(
            expect.stringContaining('No Transactions Found'),
            expect.any(Object)
        );
    });

    it('should display transactions when they exist', async () => {
        // Mock the response with some transactions
        const mockTransactions = [
            { id: 'tx1', type: 'send', status: 'success' },
            { id: 'tx2', type: 'receive', status: 'pending' }
        ];

        (transactionService.getTransactions as jest.Mock).mockResolvedValueOnce({
            data: mockTransactions,
            page: 1,
            limit: 10,
            count: 2,
            hasMore: false
        });

        (transactionService.formatTransactionsList as jest.Mock).mockReturnValueOnce('Transaction List');

        // Call the command
        await transactionsCommand(ctx);

        // Assert
        expect(transactionService.getTransactions).toHaveBeenCalled();
        expect(transactionService.formatTransactionsList).toHaveBeenCalledWith(mockTransactions);
        expect(ctx.reply).toHaveBeenCalledWith(
            expect.stringContaining('Transaction History'),
            expect.any(Object)
        );
    });

    it('should handle errors gracefully', async () => {
        // Mock an error response
        (transactionService.getTransactions as jest.Mock).mockRejectedValueOnce(new Error('API error'));

        // Call the command
        await transactionsCommand(ctx);

        // Assert
        expect(transactionService.getTransactions).toHaveBeenCalled();
        expect(ctx.reply).toHaveBeenCalledWith(
            expect.stringContaining('Error Retrieving Transactions'),
            expect.any(Object)
        );
    });
});