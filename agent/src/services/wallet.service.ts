import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import WalletManagerTon from '@tetherto/wdk-wallet-ton';
import { logger } from '../utils/logger.js';
import type { ChainId, ChainConfig, WalletBalance } from '../types/index.js';

/** USDT contract addresses on testnets */
const USDT_CONTRACTS: Record<string, string> = {
  'ethereum-sepolia': '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Sepolia USDT
};

/** Chain configurations */
const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  'ethereum-sepolia': {
    id: 'ethereum-sepolia',
    name: 'Ethereum Sepolia',
    blockchain: 'ethereum',
    isTestnet: true,
    nativeCurrency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: process.env.ETH_SEPOLIA_RPC ?? 'https://ethereum-sepolia-rpc.publicnode.com',
  },
  'ton-testnet': {
    id: 'ton-testnet',
    name: 'TON Testnet',
    blockchain: 'ton',
    isTestnet: true,
    nativeCurrency: 'TON',
    explorerUrl: 'https://testnet.tonviewer.com',
  },
};

/**
 * WDK Wallet Service — manages multi-chain wallets via Tether WDK.
 * Handles wallet creation, balance queries, transaction execution, and fee estimation.
 */
export class WalletService {
  private wdk: InstanceType<typeof WDK> | null = null;
  private seed: string = '';
  private initialized = false;
  private registeredChains = new Set<ChainId>();

  /** Initialize WDK with a seed phrase, registering all supported chains */
  async initialize(seed?: string): Promise<void> {
    if (this.initialized) return;

    this.seed = seed ?? WDK.getRandomSeedPhrase();
    logger.info('Initializing WDK wallet service');

    this.wdk = new WDK(this.seed);

    // Register EVM (Sepolia)
    try {
      const evmConfig = CHAIN_CONFIGS['ethereum-sepolia'];
      this.wdk.registerWallet('ethereum', WalletManagerEvm, {
        provider: evmConfig.rpcUrl,
      });
      this.registeredChains.add('ethereum-sepolia');
      logger.info('Registered EVM wallet (Sepolia)');
    } catch (err) {
      logger.error('Failed to register EVM wallet', { error: String(err) });
    }

    // Register TON (Testnet)
    try {
      const tonUrl = process.env.TON_TESTNET_URL ?? 'https://testnet.toncenter.com/api/v2/jsonRPC';
      this.wdk.registerWallet('ton', WalletManagerTon, {
        tonClient: { url: tonUrl },
      });
      this.registeredChains.add('ton-testnet');
      logger.info('Registered TON wallet (Testnet)');
    } catch (err) {
      logger.error('Failed to register TON wallet', { error: String(err) });
    }

    this.initialized = true;
    logger.info('WDK wallet service initialized', {
      chains: Array.from(this.registeredChains),
    });
  }

  /** Get the seed phrase (for display to user during wallet creation) */
  getSeedPhrase(): string {
    return this.seed;
  }

  /** Get the blockchain identifier for WDK from our chain ID */
  private getBlockchain(chainId: ChainId): string {
    return CHAIN_CONFIGS[chainId].blockchain;
  }

  /** Get chain config */
  getChainConfig(chainId: ChainId): ChainConfig {
    return CHAIN_CONFIGS[chainId];
  }

  /** Get all registered chain IDs */
  getRegisteredChains(): ChainId[] {
    return Array.from(this.registeredChains);
  }

  /** Get wallet address for a specific chain */
  async getAddress(chainId: ChainId): Promise<string> {
    this.ensureInitialized();
    const blockchain = this.getBlockchain(chainId);
    const account = await this.wdk!.getAccount(blockchain, 0);
    return account.getAddress();
  }

  /** Get all wallet addresses across chains */
  async getAllAddresses(): Promise<Record<ChainId, string>> {
    const addresses: Partial<Record<ChainId, string>> = {};
    for (const chainId of this.registeredChains) {
      try {
        addresses[chainId] = await this.getAddress(chainId);
      } catch (err) {
        logger.error(`Failed to get address for ${chainId}`, { error: String(err) });
      }
    }
    return addresses as Record<ChainId, string>;
  }

  /** Get balance for a specific chain */
  async getBalance(chainId: ChainId): Promise<WalletBalance> {
    this.ensureInitialized();
    const blockchain = this.getBlockchain(chainId);
    const config = CHAIN_CONFIGS[chainId];
    const account = await this.wdk!.getAccount(blockchain, 0);

    const address = await account.getAddress();
    const nativeBalance = await account.getBalance();

    let usdtBalance = 0n;
    const usdtContract = USDT_CONTRACTS[chainId];
    if (usdtContract) {
      try {
        usdtBalance = await account.getTokenBalance(usdtContract);
      } catch {
        logger.warn(`Could not fetch USDT balance on ${chainId}`);
      }
    }

    return {
      chainId,
      address,
      nativeBalance: this.formatBalance(nativeBalance, chainId),
      nativeCurrency: config.nativeCurrency,
      usdtBalance: this.formatUsdtBalance(usdtBalance),
    };
  }

  /** Get balances across all chains */
  async getAllBalances(): Promise<WalletBalance[]> {
    const balances: WalletBalance[] = [];
    for (const chainId of this.registeredChains) {
      try {
        balances.push(await this.getBalance(chainId));
      } catch (err) {
        logger.error(`Failed to get balance for ${chainId}`, { error: String(err) });
        const config = CHAIN_CONFIGS[chainId];
        balances.push({
          chainId,
          address: 'Error',
          nativeBalance: '0',
          nativeCurrency: config.nativeCurrency,
          usdtBalance: '0',
        });
      }
    }
    return balances;
  }

  /** Estimate transaction fee for a chain */
  async estimateFee(chainId: ChainId, recipient: string, amount: string): Promise<{ fee: string; feeRaw: bigint }> {
    this.ensureInitialized();
    const blockchain = this.getBlockchain(chainId);
    const account = await this.wdk!.getAccount(blockchain, 0);
    const amountRaw = this.parseAmount(amount, chainId);

    try {
      const quote = await account.quoteSendTransaction({
        to: recipient,
        value: amountRaw,
      });
      return {
        fee: this.formatBalance(quote.fee, chainId),
        feeRaw: quote.fee,
      };
    } catch {
      // Fallback: use fee rates
      const rates = await this.wdk!.getFeeRates(blockchain);
      return {
        fee: this.formatBalance(rates.normal, chainId),
        feeRaw: rates.normal,
      };
    }
  }

  /** Send a native transaction on a specific chain */
  async sendTransaction(
    chainId: ChainId,
    recipient: string,
    amount: string,
  ): Promise<{ hash: string; fee: string }> {
    this.ensureInitialized();
    const blockchain = this.getBlockchain(chainId);
    const account = await this.wdk!.getAccount(blockchain, 0);
    const amountRaw = this.parseAmount(amount, chainId);

    logger.info('Sending transaction', { chainId, recipient, amount });

    const result = await account.sendTransaction({
      to: recipient,
      value: amountRaw,
    });

    logger.info('Transaction sent', { hash: result.hash, fee: result.fee.toString() });

    return {
      hash: result.hash,
      fee: this.formatBalance(result.fee, chainId),
    };
  }

  /** Send a USDT token transfer on EVM chains */
  async sendUsdtTransfer(
    chainId: ChainId,
    recipient: string,
    amount: string,
  ): Promise<{ hash: string; fee: string }> {
    this.ensureInitialized();
    const usdtContract = USDT_CONTRACTS[chainId];
    if (!usdtContract) {
      throw new Error(`USDT not supported on ${chainId}`);
    }

    const blockchain = this.getBlockchain(chainId);
    const account = await this.wdk!.getAccount(blockchain, 0);
    const amountRaw = BigInt(Math.floor(parseFloat(amount) * 1e6)); // USDT has 6 decimals

    logger.info('Sending USDT transfer', { chainId, recipient, amount, amountRaw: amountRaw.toString() });

    const result = await account.transfer({
      token: usdtContract,
      recipient,
      amount: amountRaw,
    });

    logger.info('USDT transfer sent', { hash: result.hash });

    return {
      hash: result.hash,
      fee: this.formatBalance(result.fee, chainId),
    };
  }

  /** Format raw balance to human-readable string */
  private formatBalance(raw: bigint, chainId: ChainId): string {
    const decimals = chainId.startsWith('ton') ? 9 : 18;
    const divisor = 10n ** BigInt(decimals);
    const whole = raw / divisor;
    const fraction = raw % divisor;
    const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 6);
    return `${whole}.${fractionStr}`;
  }

  /** Format USDT balance (6 decimals) */
  private formatUsdtBalance(raw: bigint): string {
    const divisor = 10n ** 6n;
    const whole = raw / divisor;
    const fraction = (raw % divisor).toString().padStart(6, '0');
    return `${whole}.${fraction}`;
  }

  /** Parse human-readable amount to raw bigint */
  private parseAmount(amount: string, chainId: ChainId): bigint {
    const decimals = chainId.startsWith('ton') ? 9 : 18;
    const parts = amount.split('.');
    const whole = BigInt(parts[0] ?? '0');
    const fractionStr = (parts[1] ?? '').padEnd(decimals, '0').slice(0, decimals);
    return whole * 10n ** BigInt(decimals) + BigInt(fractionStr);
  }

  /** Ensure WDK is initialized */
  private ensureInitialized(): void {
    if (!this.initialized || !this.wdk) {
      throw new Error('WalletService not initialized. Call initialize() first.');
    }
  }

  /** Get explorer URL for a transaction */
  getExplorerUrl(chainId: ChainId, txHash: string): string {
    const config = CHAIN_CONFIGS[chainId];
    if (chainId === 'ton-testnet') {
      return `${config.explorerUrl}/transaction/${txHash}`;
    }
    return `${config.explorerUrl}/tx/${txHash}`;
  }

  /** Cleanup resources */
  dispose(): void {
    if (this.wdk) {
      this.wdk.dispose();
      this.wdk = null;
      this.initialized = false;
      logger.info('WDK wallet service disposed');
    }
  }
}
