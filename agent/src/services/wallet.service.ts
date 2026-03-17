import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import WalletManagerTon from '@tetherto/wdk-wallet-ton';
import WalletManagerTron from '@tetherto/wdk-wallet-tron';
import WalletManagerEvmErc4337 from '@tetherto/wdk-wallet-evm-erc-4337';
import WalletManagerTonGasless from '@tetherto/wdk-wallet-ton-gasless';
import { logger } from '../utils/logger.js';
import { JsonRpcProvider } from 'ethers';
import type { ChainId, ChainConfig, WalletBalance, ConfirmationResult, FeeComparison, DerivedWallet } from '../types/index.js';

/** USDT contract addresses on testnets */
const USDT_CONTRACTS: Record<string, string> = {
  'ethereum-sepolia': '0x7169D38820dfd117C3FA1f22a697dBA58d90BA06', // Sepolia USDT
};

/** USAT (USA₮) contract addresses on testnets.
 *  USAT is Tether's US dollar-backed stablecoin — a Rumble-supported tipping token.
 *  Same WDK transfer() flow as USDT; the contract address is the only difference.
 *  USAT testnet contracts are pending deployment — address will be updated once available. */
export const USAT_CONTRACTS: Record<string, string> = {
  'ethereum-sepolia': '0x0000000000000000000000000000000000000000', // Awaiting USAT testnet deployment
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
  'tron-nile': {
    id: 'tron-nile',
    name: 'Tron Nile',
    blockchain: 'tron',
    isTestnet: true,
    nativeCurrency: 'TRX',
    explorerUrl: 'https://nile.tronscan.org',
  },
  'ethereum-sepolia-gasless': {
    id: 'ethereum-sepolia-gasless',
    name: 'Ethereum Sepolia (Gasless)',
    blockchain: 'ethereum-erc4337',
    isTestnet: true,
    nativeCurrency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: process.env.ETH_SEPOLIA_RPC ?? 'https://ethereum-sepolia-rpc.publicnode.com',
  },
  'ton-testnet-gasless': {
    id: 'ton-testnet-gasless',
    name: 'TON Testnet (Gasless)',
    blockchain: 'ton-gasless',
    isTestnet: true,
    nativeCurrency: 'TON',
    explorerUrl: 'https://testnet.tonviewer.com',
  },
};

/** Gasless status info returned by the API */
export interface GaslessStatus {
  evmErc4337: {
    available: boolean;
    chainId: ChainId;
    chainName: string;
    bundlerUrl: string;
    paymasterUrl: string;
    reason?: string;
  };
  tonGasless: {
    available: boolean;
    chainId: ChainId;
    chainName: string;
    reason?: string;
  };
}

/**
 * WDK Wallet Service — manages multi-chain wallets via Tether WDK.
 * Handles wallet creation, balance queries, transaction execution, and fee estimation.
 */
export class WalletService {
  private wdk: InstanceType<typeof WDK> | null = null;
  private seed: string = '';
  private initialized = false;
  private registeredChains = new Set<ChainId>();
  private gaslessEvmAvailable = false;
  private gaslessTonAvailable = false;
  private gaslessEvmError?: string;
  private gaslessTonError?: string;
  private activeWalletIndex = 0;
  private activeAccountIndex = 0;

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

    // Register Tron (Nile Testnet)
    try {
      const tronProvider = process.env.TRON_NILE_RPC ?? 'https://nile.trongrid.io';
      this.wdk.registerWallet('tron', WalletManagerTron, {
        provider: tronProvider,
        transferMaxFee: 10000000n, // 10 TRX max fee in sun
      });
      this.registeredChains.add('tron-nile');
      logger.info('Registered Tron wallet (Nile Testnet)');
    } catch (err) {
      logger.error('Failed to register Tron wallet', { error: String(err) });
    }

    // Register EVM ERC-4337 (Account Abstraction / Gasless)
    // Requires ERC4337_BUNDLER_URL and ERC4337_PAYMASTER_URL env vars with valid API keys.
    // Without these, gasless will be unavailable and tips fall back to regular transactions.
    try {
      const erc4337Config = CHAIN_CONFIGS['ethereum-sepolia-gasless'];
      const bundlerUrl = process.env.ERC4337_BUNDLER_URL ?? 'https://api.pimlico.io/v2/11155111/rpc';
      const paymasterUrl = process.env.ERC4337_PAYMASTER_URL ?? 'https://api.pimlico.io/v2/11155111/rpc';
      const entryPointAddress = process.env.ERC4337_ENTRY_POINT ?? '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

      this.wdk.registerWallet('ethereum-erc4337', WalletManagerEvmErc4337 as any, {
        chainId: 11155111, // Sepolia chain ID
        provider: erc4337Config.rpcUrl,
        bundlerUrl,
        entryPointAddress,
        safeModulesVersion: '0.2.0',
        isSponsored: true,
        paymasterUrl,
      });
      this.registeredChains.add('ethereum-sepolia-gasless');
      this.gaslessEvmAvailable = true;
      logger.info('Registered EVM ERC-4337 wallet (Gasless / Account Abstraction)');
    } catch (err) {
      this.gaslessEvmError = String(err);
      logger.warn('EVM ERC-4337 gasless wallet not available (non-critical)', { error: String(err) });
    }

    // Register TON Gasless
    try {
      const tonUrl = process.env.TON_TESTNET_URL ?? 'https://testnet.toncenter.com/api/v2/jsonRPC';
      const tonApiUrl = process.env.TON_API_URL ?? 'https://testnet.tonapi.io';
      const tonPaymasterToken = process.env.TON_PAYMASTER_TOKEN_ADDRESS ?? 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs'; // Testnet USDT

      this.wdk.registerWallet('ton-gasless', WalletManagerTonGasless as any, {
        tonClient: { url: tonUrl },
        tonApiClient: { url: tonApiUrl },
        paymasterToken: { address: tonPaymasterToken },
      });
      this.registeredChains.add('ton-testnet-gasless');
      this.gaslessTonAvailable = true;
      logger.info('Registered TON Gasless wallet');
    } catch (err) {
      this.gaslessTonError = String(err);
      logger.warn('TON gasless wallet not available (non-critical)', { error: String(err) });
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
    const account = await this.wdk!.getAccount(blockchain, this.activeAccountIndex);
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
    const account = await this.wdk!.getAccount(blockchain, this.activeAccountIndex);

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
    const account = await this.wdk!.getAccount(blockchain, this.activeAccountIndex);
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

  /**
   * Estimate fees across ALL registered chains simultaneously and return
   * a ranked comparison sorted by lowest USD fee.
   */
  async estimateAllFees(recipient: string, amount: string): Promise<FeeComparison[]> {
    this.ensureInitialized();
    const chains = this.getRegisteredChains();

    const results = await Promise.all(
      chains.map(async (chainId) => {
        const config = CHAIN_CONFIGS[chainId];
        try {
          const { fee } = await this.estimateFee(chainId, recipient, amount);
          const feeUsd = this.estimateFeeUsd(chainId, fee);
          return { chainId, chainName: config.name, fee, feeUsd, ok: true as const };
        } catch {
          return { chainId, chainName: config.name, fee: '0', feeUsd: 0, ok: false as const };
        }
      }),
    );

    const valid = results.filter((r) => r.ok);
    if (valid.length === 0) {
      return results.map((r, i) => ({
        chainId: r.chainId,
        chainName: r.chainName,
        estimatedFee: r.fee,
        estimatedFeeUsd: r.feeUsd.toFixed(4),
        savingsVsHighest: '$0.0000',
        rank: i + 1,
      }));
    }

    // Sort by USD fee ascending (cheapest first)
    valid.sort((a, b) => a.feeUsd - b.feeUsd);
    const highestFeeUsd = valid[valid.length - 1].feeUsd;

    return valid.map((r, i) => ({
      chainId: r.chainId,
      chainName: r.chainName,
      estimatedFee: r.fee,
      estimatedFeeUsd: `$${r.feeUsd.toFixed(4)}`,
      savingsVsHighest: `$${(highestFeeUsd - r.feeUsd).toFixed(4)}`,
      rank: i + 1,
    }));
  }

  /** Estimate fee in USD using approximate prices.
   *  Prices are rough estimates for fee comparison ranking only —
   *  not used for financial calculations or trading decisions. */
  private static approxPrices = { ETH: 2500, TON: 2.5, TRX: 0.25 };
  static updatePrices(eth: number, ton: number, trx: number = 0.25) {
    WalletService.approxPrices = { ETH: eth, TON: ton, TRX: trx };
  }
  private estimateFeeUsd(chainId: ChainId, fee: string): number {
    const feeVal = parseFloat(fee);
    if (chainId.startsWith('ethereum')) return feeVal * WalletService.approxPrices.ETH;
    if (chainId.startsWith('ton')) return feeVal * WalletService.approxPrices.TON;
    if (chainId.startsWith('tron')) return feeVal * WalletService.approxPrices.TRX;
    return feeVal;
  }

  /** Send a native transaction on a specific chain */
  async sendTransaction(
    chainId: ChainId,
    recipient: string,
    amount: string,
  ): Promise<{ hash: string; fee: string }> {
    this.ensureInitialized();
    const blockchain = this.getBlockchain(chainId);
    const account = await this.wdk!.getAccount(blockchain, this.activeAccountIndex);
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
    const account = await this.wdk!.getAccount(blockchain, this.activeAccountIndex);
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

  /**
   * Poll the blockchain for a transaction receipt until confirmed or timeout.
   * For EVM chains, uses ethers JsonRpcProvider to fetch the receipt.
   * For TON, returns a best-effort result (TON lacks standard receipt polling).
   */
  async waitForConfirmation(
    chainId: ChainId,
    txHash: string,
    timeoutMs: number = 30000,
  ): Promise<ConfirmationResult> {
    const config = CHAIN_CONFIGS[chainId];

    // EVM chains: poll with ethers provider
    if (config.blockchain === 'ethereum' && config.rpcUrl) {
      const provider = new JsonRpcProvider(config.rpcUrl);
      const pollInterval = 2000;
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        try {
          const receipt = await provider.getTransactionReceipt(txHash);
          if (receipt && receipt.blockNumber) {
            logger.info('Transaction confirmed on-chain', {
              txHash,
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
            });
            return {
              confirmed: true,
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed.toString(),
            };
          }
        } catch (err) {
          logger.warn('Receipt poll error', { txHash, error: String(err) });
        }
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      logger.warn('Transaction confirmation timed out', { txHash, timeoutMs });
      return { confirmed: false, blockNumber: 0, gasUsed: '0' };
    }

    // TON / Tron chains: transaction was broadcast successfully.
    // These chains don't support standard receipt polling via public RPC,
    // so we mark as confirmed based on successful broadcast.
    logger.info(`${config.blockchain.toUpperCase()} transaction broadcast successful — no receipt polling available`, { txHash });
    return { confirmed: true, blockNumber: 0, gasUsed: '0' };
  }

  /** Format raw balance to human-readable string */
  private formatBalance(raw: bigint, chainId: ChainId): string {
    const decimals = chainId.startsWith('tron') ? 6 : chainId.startsWith('ton') ? 9 : 18;
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
    const decimals = chainId.startsWith('tron') ? 6 : chainId.startsWith('ton') ? 9 : 18;
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

  /** Check if gasless transactions are available */
  isGaslessAvailable(type: 'evm' | 'ton' | 'any' = 'any'): boolean {
    if (type === 'evm') return this.gaslessEvmAvailable;
    if (type === 'ton') return this.gaslessTonAvailable;
    return this.gaslessEvmAvailable || this.gaslessTonAvailable;
  }

  /** Get gasless status for both chains */
  getGaslessStatus(): GaslessStatus {
    const evmConfig = CHAIN_CONFIGS['ethereum-sepolia-gasless'];
    const tonConfig = CHAIN_CONFIGS['ton-testnet-gasless'];

    return {
      evmErc4337: {
        available: this.gaslessEvmAvailable,
        chainId: 'ethereum-sepolia-gasless',
        chainName: evmConfig.name,
        bundlerUrl: process.env.ERC4337_BUNDLER_URL ?? 'https://api.pimlico.io/v2/11155111/rpc',
        paymasterUrl: process.env.ERC4337_PAYMASTER_URL ?? 'https://api.pimlico.io/v2/11155111/rpc',
        reason: this.gaslessEvmAvailable ? undefined : (this.gaslessEvmError ?? 'ERC-4337 bundler/paymaster not configured'),
      },
      tonGasless: {
        available: this.gaslessTonAvailable,
        chainId: 'ton-testnet-gasless',
        chainName: tonConfig.name,
        reason: this.gaslessTonAvailable ? undefined : (this.gaslessTonError ?? 'TON gasless API not configured'),
      },
    };
  }

  /**
   * Send a gasless transaction using ERC-4337 Account Abstraction.
   * The user pays zero gas fees — the paymaster/bundler sponsors the transaction.
   * Falls back to a regular transaction if gasless is unavailable.
   */
  async sendGaslessTransaction(
    recipient: string,
    amount: string,
    token: 'native' | 'usdt' | 'usat' = 'native',
  ): Promise<{ hash: string; fee: string; gasless: boolean; chainId: ChainId }> {
    this.ensureInitialized();

    // Try EVM ERC-4337 gasless first
    if (this.gaslessEvmAvailable) {
      try {
        const account = await this.wdk!.getAccount('ethereum-erc4337', this.activeAccountIndex);
        const gaslessChainId: ChainId = 'ethereum-sepolia-gasless';

        if (token === 'usdt' || token === 'usat') {
          const usdtContract = USDT_CONTRACTS['ethereum-sepolia'];
          if (!usdtContract) throw new Error('USDT/USAT contract not configured for gasless chain');

          const amountRaw = BigInt(Math.floor(parseFloat(amount) * 1e6));
          logger.info('Sending gasless USDT transfer via ERC-4337', { recipient, amount, amountRaw: amountRaw.toString() });

          const result = await account.transfer({
            token: usdtContract,
            recipient,
            amount: amountRaw,
          });

          logger.info('Gasless USDT transfer sent', { hash: result.hash });
          return { hash: result.hash, fee: '0.000000', gasless: true, chainId: gaslessChainId };
        } else {
          const amountRaw = this.parseAmount(amount, 'ethereum-sepolia');
          logger.info('Sending gasless native transfer via ERC-4337', { recipient, amount });

          const result = await account.sendTransaction({
            to: recipient,
            value: amountRaw,
          });

          logger.info('Gasless native transfer sent', { hash: result.hash });
          return { hash: result.hash, fee: '0.000000', gasless: true, chainId: gaslessChainId };
        }
      } catch (err) {
        logger.warn('ERC-4337 gasless transaction failed, falling back to regular', { error: String(err) });
      }
    }

    // Try TON gasless
    if (this.gaslessTonAvailable && token === 'native') {
      try {
        const account = await this.wdk!.getAccount('ton-gasless', this.activeAccountIndex);
        const amountRaw = this.parseAmount(amount, 'ton-testnet');
        logger.info('Sending gasless TON transfer', { recipient, amount });

        const result = await account.sendTransaction({
          to: recipient,
          value: amountRaw,
        });

        logger.info('Gasless TON transfer sent', { hash: result.hash });
        return { hash: result.hash, fee: '0.000000', gasless: true, chainId: 'ton-testnet-gasless' };
      } catch (err) {
        logger.warn('TON gasless transaction failed, falling back to regular', { error: String(err) });
      }
    }

    // Fallback: regular EVM transaction
    logger.info('Gasless not available, falling back to regular transaction');
    const fallbackChainId: ChainId = 'ethereum-sepolia';
    if (token === 'usdt' || token === 'usat') {
      const result = await this.sendUsdtTransfer(fallbackChainId, recipient, amount);
      return { ...result, gasless: false, chainId: fallbackChainId };
    } else {
      const result = await this.sendTransaction(fallbackChainId, recipient, amount);
      return { ...result, gasless: false, chainId: fallbackChainId };
    }
  }

  /** Get the active wallet index used for sending */
  getActiveWalletIndex(): number {
    return this.activeWalletIndex;
  }

  /** Set the active wallet index used for sending */
  setActiveWalletIndex(index: number): void {
    if (index < 0 || !Number.isInteger(index)) {
      throw new Error('Wallet index must be a non-negative integer');
    }
    this.activeWalletIndex = index;
    logger.info('Active wallet index set', { index });
  }

  /** Get wallet address at a specific derivation index for a chain */
  async getWalletByIndex(chainId: ChainId, index: number): Promise<DerivedWallet> {
    this.ensureInitialized();
    const blockchain = this.getBlockchain(chainId);
    const config = CHAIN_CONFIGS[chainId];
    const account = await this.wdk!.getAccount(blockchain, index);
    const address = await account.getAddress();
    return {
      index,
      address,
      chainId,
      chainName: config.name,
      isActive: index === this.activeWalletIndex,
    };
  }

  /** List the first N derived wallet addresses for a chain */
  async listWallets(chainId: ChainId, count: number = 5): Promise<DerivedWallet[]> {
    this.ensureInitialized();
    const wallets: DerivedWallet[] = [];
    for (let i = 0; i < count; i++) {
      try {
        wallets.push(await this.getWalletByIndex(chainId, i));
      } catch (err) {
        logger.error(`Failed to derive wallet at index ${i} for ${chainId}`, { error: String(err) });
      }
    }
    return wallets;
  }

  /** Get explorer URL for a transaction */
  getExplorerUrl(chainId: ChainId, txHash: string): string {
    const config = CHAIN_CONFIGS[chainId];
    if (chainId === 'ton-testnet' || chainId === 'ton-testnet-gasless') {
      return `${config.explorerUrl}/transaction/${txHash}`;
    }
    if (chainId === 'tron-nile') {
      return `${config.explorerUrl}/#/transaction/${txHash}`;
    }
    return `${config.explorerUrl}/tx/${txHash}`;
  }

  /** Sign a message using the WDK wallet key for a specific chain */
  async signMessage(chainId: ChainId, message: string): Promise<{ signature: string; publicKey: string }> {
    this.ensureInitialized();
    const blockchain = this.getBlockchain(chainId);
    const account = await this.wdk!.getAccount(blockchain, this.activeAccountIndex);
    const signature = await account.sign(message);
    const publicKey = Buffer.from(account.keyPair.publicKey).toString('hex');
    return { signature, publicKey };
  }

  /** Verify a signed message using the WDK wallet */
  async verifyMessage(chainId: ChainId, message: string, signature: string): Promise<boolean> {
    this.ensureInitialized();
    const blockchain = this.getBlockchain(chainId);
    const account = await this.wdk!.getAccount(blockchain, this.activeAccountIndex);
    return account.verify(message, signature);
  }

  /** Get the active account index for HD derivation */
  getActiveAccountIndex(): number {
    return this.activeAccountIndex;
  }

  /** Set the active account index (HD path changes) */
  setActiveAccountIndex(index: number): void {
    if (index < 0 || index > 99) throw new Error('Account index must be 0-99');
    this.activeAccountIndex = index;
    logger.info('Active account index changed', { index });
  }

  /** List derived accounts for a chain (first N indices) */
  async listDerivedAccounts(chainId: ChainId, count = 5): Promise<Array<{ index: number; address: string }>> {
    this.ensureInitialized();
    const blockchain = this.getBlockchain(chainId);
    const accounts: Array<{ index: number; address: string }> = [];
    for (let i = 0; i < count; i++) {
      try {
        const account = await this.wdk!.getAccount(blockchain, i);
        const address = await account.getAddress();
        accounts.push({ index: i, address });
      } catch {
        break; // Stop if index not supported
      }
    }
    return accounts;
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
