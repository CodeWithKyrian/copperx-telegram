import {
    getNetworkName,
    getChainId,
    getExplorerTxUrl,
    getExplorerAddressUrl,
    formatNetworkName,
    CHAIN_INFO
} from '../../src/utils/chain.utils';
import { ChainId } from '../../src/types/api.types';

describe('Chain Utilities', () => {
    describe('CHAIN_INFO constant', () => {
        it('should contain information for all supported chains', () => {
            // Assert
            expect(Object.keys(CHAIN_INFO).length).toBeGreaterThan(0);

            // Check for mainnet chains
            expect(CHAIN_INFO['1']).toBeDefined();
            expect(CHAIN_INFO['137']).toBeDefined();
            expect(CHAIN_INFO['42161']).toBeDefined();
            expect(CHAIN_INFO['8453']).toBeDefined();
            expect(CHAIN_INFO['10']).toBeDefined();
            expect(CHAIN_INFO['56']).toBeDefined();
            expect(CHAIN_INFO['1399811149']).toBeDefined();
            expect(CHAIN_INFO['23434']).toBeDefined();

            // Check for testnet chains
            expect(CHAIN_INFO['5']).toBeDefined();
            expect(CHAIN_INFO['11155111']).toBeDefined();
            expect(CHAIN_INFO['80002']).toBeDefined();
            expect(CHAIN_INFO['421614']).toBeDefined();
            expect(CHAIN_INFO['84532']).toBeDefined();
            expect(CHAIN_INFO['11155420']).toBeDefined();
            expect(CHAIN_INFO['97']).toBeDefined();
            expect(CHAIN_INFO['1399811150']).toBeDefined();
            expect(CHAIN_INFO['39361']).toBeDefined();
        });

        it('should have the correct structure for each chain', () => {
            // Check Ethereum mainnet for structure
            const ethereum = CHAIN_INFO['1'];
            expect(ethereum).toEqual({
                name: 'Ethereum',
                fullName: 'Ethereum Mainnet',
                isTestnet: false,
                explorerUrl: 'https://etherscan.io',
                logoUrl: expect.any(String)
            });

            // Check a testnet chain
            const sepolia = CHAIN_INFO['11155111'];
            expect(sepolia).toEqual({
                name: 'Sepolia',
                fullName: 'Sepolia Testnet',
                isTestnet: true,
                explorerUrl: 'https://sepolia.etherscan.io',
                logoUrl: expect.any(String)
            });

            // Check Solana which has a different structure
            const solana = CHAIN_INFO['1399811149'];
            expect(solana).toEqual({
                name: 'Solana',
                fullName: 'Solana Mainnet',
                isTestnet: false,
                explorerUrl: 'https://explorer.solana.com',
                logoUrl: expect.any(String)
            });
        });
    });

    describe('getNetworkName', () => {
        it('should return the short name by default', () => {
            // Arrange & Act
            const ethName = getNetworkName('1');
            const polyName = getNetworkName('137');
            const arbName = getNetworkName('42161');
            const baseName = getNetworkName('8453');
            const optimismName = getNetworkName('10');
            const bscName = getNetworkName('56');
            const solName = getNetworkName('1399811149');
            const starkName = getNetworkName('23434');

            // Assert
            expect(ethName).toBe('Ethereum');
            expect(polyName).toBe('Polygon');
            expect(arbName).toBe('Arbitrum');
            expect(baseName).toBe('Base');
            expect(optimismName).toBe('Optimism');
            expect(bscName).toBe('BSC');
            expect(solName).toBe('Solana');
            expect(starkName).toBe('Starknet');
        });

        it('should return the full name when useFull is true', () => {
            // Arrange & Act
            const ethName = getNetworkName('1', true);
            const polyName = getNetworkName('137', true);
            const arbName = getNetworkName('42161', true);

            // Assert
            expect(ethName).toBe('Ethereum Mainnet');
            expect(polyName).toBe('Polygon Mainnet');
            expect(arbName).toBe('Arbitrum One');
        });

        it('should handle testnets correctly', () => {
            // Arrange & Act
            const goerliName = getNetworkName('5');
            const sepoliaName = getNetworkName('11155111');
            const polygonAmoyName = getNetworkName('80002');

            // Assert
            expect(goerliName).toBe('Goerli');
            expect(sepoliaName).toBe('Sepolia');
            expect(polygonAmoyName).toBe('Polygon Amoy');
        });

        it('should return "Unknown Network" for undefined chainId', () => {
            // Arrange & Act
            const resultUndefined = getNetworkName(undefined);
            const resultEmpty = getNetworkName('');

            // Assert
            expect(resultUndefined).toBe('Unknown Network');
            expect(resultEmpty).toBe('Unknown Network');
        });

        it('should return the original chainId for unsupported chains', () => {
            // Arrange & Act
            const result = getNetworkName('999' as ChainId);

            // Assert
            expect(result).toBe('999');
        });
    });

    describe('getChainId', () => {
        it('should find chainId by short name', () => {
            // Arrange & Act
            const ethChainId = getChainId('Ethereum');
            const polyChainId = getChainId('Polygon');
            const arbChainId = getChainId('Arbitrum');
            const baseChainId = getChainId('Base');
            const optimismChainId = getChainId('Optimism');
            const bscChainId = getChainId('BSC');
            const solanaChainId = getChainId('Solana');
            const starknetChainId = getChainId('Starknet');

            // Assert
            expect(ethChainId).toBe('1');
            expect(polyChainId).toBe('137');
            expect(arbChainId).toBe('42161');
            expect(baseChainId).toBe('8453');
            expect(optimismChainId).toBe('10');
            expect(bscChainId).toBe('56');
            expect(solanaChainId).toBe('1399811149');
            expect(starknetChainId).toBe('23434');
        });

        it('should find chainId by full name', () => {
            // Arrange & Act
            const ethChainId = getChainId('Ethereum Mainnet');
            const polyChainId = getChainId('Polygon Mainnet');
            const arbChainId = getChainId('Arbitrum One');

            // Assert
            expect(ethChainId).toBe('1');
            expect(polyChainId).toBe('137');
            expect(arbChainId).toBe('42161');
        });

        it('should handle case-insensitive and whitespace', () => {
            // Arrange & Act
            const ethChainId1 = getChainId('ethereum');
            const ethChainId2 = getChainId('ETHEREUM');
            const ethChainId3 = getChainId(' ethereum ');
            const polyChainId = getChainId('polygon mainnet');

            // Assert
            expect(ethChainId1).toBe('1');
            expect(ethChainId2).toBe('1');
            expect(ethChainId3).toBe('1');
            expect(polyChainId).toBe('137');
        });

        it('should return undefined for unsupported networks', () => {
            // Arrange & Act
            const unknownChainId = getChainId('Unknown Network');
            const emptyChainId = getChainId('');

            // Assert
            expect(unknownChainId).toBeUndefined();
            expect(emptyChainId).toBeUndefined();
        });

        it('should find testnet chainIds correctly', () => {
            // Arrange & Act
            const goerliChainId = getChainId('Goerli');
            const sepoliaChainId = getChainId('Sepolia');
            const polygonAmoyChainId = getChainId('Polygon Amoy');
            const bscTestnetChainId = getChainId('BSC Testnet');
            const solanaTestnetChainId = getChainId('Solana Testnet');

            // Assert
            expect(goerliChainId).toBe('5');
            expect(sepoliaChainId).toBe('11155111');
            expect(polygonAmoyChainId).toBe('80002');
            expect(bscTestnetChainId).toBe('97');
            expect(solanaTestnetChainId).toBe('1399811150');
        });
    });

    describe('getExplorerTxUrl', () => {
        it('should return correct transaction explorer URLs', () => {
            // Arrange
            const ethTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            const polyTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            const solTxHash = 'SolTxHash1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

            // Act
            const ethUrl = getExplorerTxUrl('1', ethTxHash);
            const polyUrl = getExplorerTxUrl('137', polyTxHash);
            const arbUrl = getExplorerTxUrl('42161', ethTxHash);
            const baseUrl = getExplorerTxUrl('8453', ethTxHash);
            const solUrl = getExplorerTxUrl('1399811149', solTxHash);

            // Assert
            expect(ethUrl).toBe(`https://etherscan.io/tx/${ethTxHash}`);
            expect(polyUrl).toBe(`https://polygonscan.com/tx/${polyTxHash}`);
            expect(arbUrl).toBe(`https://arbiscan.io/tx/${ethTxHash}`);
            expect(baseUrl).toBe(`https://basescan.org/tx/${ethTxHash}`);
            expect(solUrl).toBe(`https://explorer.solana.com/tx/${solTxHash}`);
        });

        it('should handle testnet explorer URLs', () => {
            // Arrange
            const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

            // Act
            const sepoliaUrl = getExplorerTxUrl('11155111', txHash);
            const goerliUrl = getExplorerTxUrl('5', txHash);
            const polygonAmoyUrl = getExplorerTxUrl('80002', txHash);
            const bscTestnetUrl = getExplorerTxUrl('97', txHash);

            // Assert
            expect(sepoliaUrl).toBe(`https://sepolia.etherscan.io/tx/${txHash}`);
            expect(goerliUrl).toBe(`https://goerli.etherscan.io/tx/${txHash}`);
            expect(polygonAmoyUrl).toBe(`https://amoy.polygonscan.com/tx/${txHash}`);
            expect(bscTestnetUrl).toBe(`https://testnet.bscscan.com/tx/${txHash}`);
        });

        it('should return empty string for unsupported chains', () => {
            // Arrange
            const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

            // Act
            const unknownUrl = getExplorerTxUrl('999' as ChainId, txHash);
            const emptyUrl = getExplorerTxUrl('' as ChainId, txHash);

            // Assert
            expect(unknownUrl).toBe('');
            expect(emptyUrl).toBe('');
        });
    });

    describe('getExplorerAddressUrl', () => {
        it('should return correct address explorer URLs', () => {
            // Arrange
            const ethAddress = '0x1234567890abcdef1234567890abcdef12345678';
            const polyAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
            const solAddress = 'SolAnaaDdreSS1234567890abcdefghijklmnopqrstuv';

            // Act
            const ethUrl = getExplorerAddressUrl('1', ethAddress);
            const polyUrl = getExplorerAddressUrl('137', polyAddress);
            const arbUrl = getExplorerAddressUrl('42161', ethAddress);
            const baseUrl = getExplorerAddressUrl('8453', ethAddress);
            const solUrl = getExplorerAddressUrl('1399811149', solAddress);

            // Assert
            expect(ethUrl).toBe(`https://etherscan.io/address/${ethAddress}`);
            expect(polyUrl).toBe(`https://polygonscan.com/address/${polyAddress}`);
            expect(arbUrl).toBe(`https://arbiscan.io/address/${ethAddress}`);
            expect(baseUrl).toBe(`https://basescan.org/address/${ethAddress}`);
            expect(solUrl).toBe(`https://explorer.solana.com/address/${solAddress}`);
        });

        it('should handle testnet explorer URLs', () => {
            // Arrange
            const address = '0x1234567890abcdef1234567890abcdef12345678';

            // Act
            const sepoliaUrl = getExplorerAddressUrl('11155111', address);
            const goerliUrl = getExplorerAddressUrl('5', address);
            const optimismSepoliaUrl = getExplorerAddressUrl('11155420', address);
            const bscTestnetUrl = getExplorerAddressUrl('97', address);

            // Assert
            expect(sepoliaUrl).toBe(`https://sepolia.etherscan.io/address/${address}`);
            expect(goerliUrl).toBe(`https://goerli.etherscan.io/address/${address}`);
            expect(optimismSepoliaUrl).toBe(`https://sepolia-optimism.etherscan.io/address/${address}`);
            expect(bscTestnetUrl).toBe(`https://testnet.bscscan.com/address/${address}`);
        });

        it('should return empty string for unsupported chains', () => {
            // Arrange
            const address = '0x1234567890abcdef1234567890abcdef12345678';

            // Act
            const unknownUrl = getExplorerAddressUrl('999' as ChainId, address);
            const emptyUrl = getExplorerAddressUrl('' as ChainId, address);

            // Assert
            expect(unknownUrl).toBe('');
            expect(emptyUrl).toBe('');
        });
    });

    describe('formatNetworkName', () => {
        it('should format mainnet names without testnet indicator', () => {
            // Arrange & Act
            const ethName = formatNetworkName('1');
            const polyName = formatNetworkName('137');
            const arbName = formatNetworkName('42161');
            const baseName = formatNetworkName('8453');
            const optimismName = formatNetworkName('10');
            const bscName = formatNetworkName('56');
            const solName = formatNetworkName('1399811149');
            const starkName = formatNetworkName('23434');

            // Assert
            expect(ethName).toBe('Ethereum');
            expect(polyName).toBe('Polygon');
            expect(arbName).toBe('Arbitrum');
            expect(baseName).toBe('Base');
            expect(optimismName).toBe('Optimism');
            expect(bscName).toBe('BSC');
            expect(solName).toBe('Solana');
            expect(starkName).toBe('Starknet');
        });

        it('should format testnet names with testnet indicator', () => {
            // Arrange & Act
            const goerliName = formatNetworkName('5');
            const sepoliaName = formatNetworkName('11155111');
            const polygonAmoyName = formatNetworkName('80002');
            const optimismSepoliaName = formatNetworkName('11155420');
            const baseSepoliaName = formatNetworkName('84532');
            const bscTestnetName = formatNetworkName('97');
            const solanaTestnetName = formatNetworkName('1399811150');
            const starknetSepoliaName = formatNetworkName('39361');

            // Assert
            expect(goerliName).toBe('Goerli (Testnet)');
            expect(sepoliaName).toBe('Sepolia (Testnet)');
            expect(polygonAmoyName).toBe('Polygon Amoy (Testnet)');
            expect(optimismSepoliaName).toBe('Optimism Sepolia (Testnet)');
            expect(baseSepoliaName).toBe('Base Sepolia (Testnet)');
            expect(bscTestnetName).toBe('BSC Testnet (Testnet)');
            expect(solanaTestnetName).toBe('Solana Testnet (Testnet)');
            expect(starknetSepoliaName).toBe('Starknet Sepolia (Testnet)');
        });

        it('should hide testnet indicator when showTestnet is false', () => {
            // Arrange & Act
            const goerliName = formatNetworkName('5', false);
            const sepoliaName = formatNetworkName('11155111', false);
            const polygonAmoyName = formatNetworkName('80002', false);

            // Assert
            expect(goerliName).toBe('Goerli');
            expect(sepoliaName).toBe('Sepolia');
            expect(polygonAmoyName).toBe('Polygon Amoy');
        });

        it('should return "Unknown Network" for undefined chainId', () => {
            // Arrange & Act
            const resultUndefined = formatNetworkName(undefined);
            const resultEmpty = formatNetworkName('');

            // Assert
            expect(resultUndefined).toBe('Unknown Network');
            expect(resultEmpty).toBe('Unknown Network');
        });

        it('should return the original chainId for unsupported chains', () => {
            // Arrange & Act
            const result = formatNetworkName('999' as ChainId);

            // Assert
            expect(result).toBe('999');
        });
    });
}); 