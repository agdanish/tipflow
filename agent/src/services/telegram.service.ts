/**
 * TipFlow Telegram Bot Service
 *
 * Lightweight Telegram bot using ONLY native fetch() — no npm packages.
 * Supports long polling via getUpdates API.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import type { TipFlowAgent } from '../core/agent.js';
import type { WalletService } from './wallet.service.js';
import type { TipRequest, TokenType } from '../types/index.js';

const TELEGRAM_API = 'https://api.telegram.org';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
    date: number;
  };
}

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

interface TelegramResponse<T> {
  ok: boolean;
  result: T;
  description?: string;
}

export interface TelegramBotStatus {
  connected: boolean;
  username: string | null;
  messageCount: number;
  startedAt: string | null;
}

export class TelegramService {
  private token: string;
  private agent: TipFlowAgent;
  private wallet: WalletService;
  private botUsername: string | null = null;
  private messageCount = 0;
  private lastUpdateId = 0;
  private polling = false;
  private pollTimeout: ReturnType<typeof setTimeout> | null = null;
  private startedAt: string | null = null;

  constructor(token: string, agent: TipFlowAgent, wallet: WalletService) {
    this.token = token;
    this.agent = agent;
    this.wallet = wallet;
  }

  /** Start the bot — verify token, get bot info, start polling */
  async start(): Promise<void> {
    try {
      const me = await this.apiCall<TelegramUser>('getMe');
      this.botUsername = me.username ?? me.first_name;
      this.startedAt = new Date().toISOString();
      this.polling = true;
      logger.info(`Telegram bot started: @${this.botUsername}`);
      this.agent.addActivity({
        type: 'system',
        message: `Telegram bot connected: @${this.botUsername}`,
      });
      this.poll();
    } catch (err) {
      logger.error('Failed to start Telegram bot', { error: String(err) });
      throw err;
    }
  }

  /** Stop polling */
  stop(): void {
    this.polling = false;
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout);
      this.pollTimeout = null;
    }
    logger.info('Telegram bot stopped');
  }

  /** Get current bot status */
  getStatus(): TelegramBotStatus {
    return {
      connected: this.polling && this.botUsername !== null,
      username: this.botUsername,
      messageCount: this.messageCount,
      startedAt: this.startedAt,
    };
  }

  /** Make a Telegram Bot API call */
  private async apiCall<T>(method: string, body?: Record<string, unknown>): Promise<T> {
    const url = `${TELEGRAM_API}/bot${this.token}/${method}`;
    const options: RequestInit = {
      method: body ? 'POST' : 'GET',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    };

    const res = await fetch(url, options);
    const data = (await res.json()) as TelegramResponse<T>;

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description ?? 'Unknown error'}`);
    }
    return data.result;
  }

  /** Send a message to a chat */
  private async sendMessage(chatId: number, text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<void> {
    try {
      await this.apiCall('sendMessage', {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      });
    } catch (err) {
      // If Markdown fails, retry without parse mode
      if (parseMode === 'Markdown') {
        try {
          await this.apiCall('sendMessage', {
            chat_id: chatId,
            text: text.replace(/[*_`\[\]()~>#+\-=|{}.!]/g, '\\$&'),
          });
        } catch {
          logger.error('Failed to send Telegram message', { error: String(err) });
        }
      }
    }
  }

  /** Long-poll for updates */
  private async poll(): Promise<void> {
    if (!this.polling) return;

    try {
      const updates = await this.apiCall<TelegramUpdate[]>('getUpdates', {
        offset: this.lastUpdateId + 1,
        timeout: 30,
        allowed_updates: ['message'],
      });

      for (const update of updates) {
        this.lastUpdateId = update.update_id;
        if (update.message?.text) {
          this.messageCount++;
          await this.handleMessage(update.message.chat.id, update.message.text, update.message.from);
        }
      }
    } catch (err) {
      logger.warn('Telegram poll error, retrying in 5s', { error: String(err) });
    }

    // Schedule next poll
    if (this.polling) {
      this.pollTimeout = setTimeout(() => this.poll(), 1000);
    }
  }

  /** Route incoming messages to command handlers */
  private async handleMessage(
    chatId: number,
    text: string,
    from?: { id: number; first_name: string; username?: string },
  ): Promise<void> {
    const trimmed = text.trim();
    const username = from?.username ?? from?.first_name ?? 'User';

    logger.info(`Telegram message from ${username}: ${trimmed}`);

    if (trimmed.startsWith('/start')) {
      await this.handleStart(chatId, username);
    } else if (trimmed.startsWith('/tip')) {
      await this.handleTip(chatId, trimmed, username);
    } else if (trimmed.startsWith('/balance')) {
      await this.handleBalance(chatId);
    } else if (trimmed.startsWith('/history')) {
      await this.handleHistory(chatId);
    } else if (trimmed.startsWith('/fees')) {
      await this.handleFees(chatId);
    } else if (trimmed.startsWith('/address')) {
      await this.handleAddress(chatId);
    } else if (trimmed.startsWith('/help')) {
      await this.handleHelp(chatId);
    } else if (trimmed.startsWith('/')) {
      await this.sendMessage(chatId, `Unknown command. Type /help for available commands.`);
    }
    // Non-command messages are ignored
  }

  /** /start — Welcome message */
  private async handleStart(chatId: number, username: string): Promise<void> {
    const msg = [
      `Welcome to *TipFlow*, ${username}!`,
      '',
      'I am an AI-powered multi-chain tipping bot built with Tether WDK.',
      '',
      '*What I can do:*',
      '- Send crypto tips across Ethereum & TON',
      '- Automatically pick the cheapest chain',
      '- Track your tipping history',
      '',
      'Type /help to see all commands.',
    ].join('\n');
    await this.sendMessage(chatId, msg);
  }

  /** /help — Show all commands */
  private async handleHelp(chatId: number): Promise<void> {
    const msg = [
      '*TipFlow Commands*',
      '',
      '/tip <address> <amount> [token] — Send a tip',
      '  token: native (default) or usdt',
      '  Example: /tip 0xABC... 0.01 native',
      '',
      '/balance — Check wallet balances',
      '/history — Show last 5 tips',
      '/fees — Compare fees across chains',
      '/address — Show wallet addresses',
      '/help — Show this help message',
    ].join('\n');
    await this.sendMessage(chatId, msg);
  }

  /** /tip <address> <amount> [token] — Send a tip */
  private async handleTip(chatId: number, text: string, username: string): Promise<void> {
    // Parse: /tip <address> <amount> [token]
    const parts = text.split(/\s+/);
    if (parts.length < 3) {
      await this.sendMessage(chatId, 'Usage: /tip <address> <amount> [token]\nExample: /tip 0xABC... 0.01 native');
      return;
    }

    const address = parts[1];
    const amount = parts[2];
    const token: TokenType = (parts[3]?.toLowerCase() === 'usdt' ? 'usdt' : 'native');

    // Basic validation
    if (!address || address.length < 10) {
      await this.sendMessage(chatId, 'Invalid address. Please provide a valid wallet address.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await this.sendMessage(chatId, 'Invalid amount. Please provide a positive number.');
      return;
    }

    await this.sendMessage(chatId, `Processing tip of ${amount} ${token} to ${address.slice(0, 10)}...`);

    this.agent.addActivity({
      type: 'system',
      message: `Telegram tip from @${username}: ${amount} ${token} to ${address.slice(0, 10)}...`,
    });

    try {
      const request: TipRequest = {
        id: uuidv4(),
        recipient: address,
        amount,
        token,
        createdAt: new Date().toISOString(),
      };

      const result = await this.agent.executeTip(request);

      if (result.status === 'confirmed') {
        const msg = [
          'Tip sent successfully!',
          '',
          `*Amount:* ${result.amount} ${result.token === 'usdt' ? 'USDT' : result.chainId.includes('ton') ? 'TON' : 'ETH'}`,
          `*To:* \`${result.to}\``,
          `*Chain:* ${result.chainId}`,
          `*Fee:* ${result.fee}`,
          `*TX:* \`${result.txHash.slice(0, 20)}...\``,
          `*Explorer:* ${result.explorerUrl}`,
        ].join('\n');
        await this.sendMessage(chatId, msg);
      } else {
        await this.sendMessage(chatId, `Tip failed: ${result.error ?? 'Unknown error'}`);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await this.sendMessage(chatId, `Error: ${errMsg}`);
      logger.error('Telegram tip failed', { error: errMsg });
    }
  }

  /** /balance — Check wallet balances */
  private async handleBalance(chatId: number): Promise<void> {
    try {
      const balances = await this.wallet.getAllBalances();
      const lines = ['*Wallet Balances*', ''];

      for (const b of balances) {
        lines.push(`*${b.chainId}*`);
        lines.push(`  ${b.nativeCurrency}: ${b.nativeBalance}`);
        lines.push(`  USDT: ${b.usdtBalance}`);
        lines.push(`  Address: \`${b.address.slice(0, 12)}...\``);
        lines.push('');
      }

      await this.sendMessage(chatId, lines.join('\n'));
    } catch (err) {
      await this.sendMessage(chatId, `Error fetching balances: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** /history — Last 5 tips */
  private async handleHistory(chatId: number): Promise<void> {
    try {
      const history = this.agent.getHistory().slice(0, 5);

      if (history.length === 0) {
        await this.sendMessage(chatId, 'No tips sent yet. Use /tip to send your first tip!');
        return;
      }

      const lines = ['*Recent Tips*', ''];

      for (const h of history) {
        const status = h.status === 'confirmed' ? 'OK' : 'FAIL';
        const date = new Date(h.createdAt).toLocaleDateString();
        lines.push(`[${status}] ${h.amount} ${h.token} to \`${h.recipient.slice(0, 10)}...\` on ${h.chainId} (${date})`);
      }

      await this.sendMessage(chatId, lines.join('\n'));
    } catch (err) {
      await this.sendMessage(chatId, `Error fetching history: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** /fees — Compare fees across chains */
  private async handleFees(chatId: number): Promise<void> {
    try {
      // Use a dummy address and small amount for fee estimation
      const dummyAddress = '0x0000000000000000000000000000000000000001';
      const fees = await this.wallet.estimateAllFees(dummyAddress, '0.001');

      if (fees.length === 0) {
        await this.sendMessage(chatId, 'No fee data available.');
        return;
      }

      const lines = ['*Fee Comparison* (0.001 transfer)', ''];
      for (const f of fees) {
        lines.push(`*${f.chainName}* — ${f.estimatedFeeUsd} (rank #${f.rank})`);
      }
      lines.push('');
      lines.push('The agent automatically picks the cheapest chain when you /tip.');

      await this.sendMessage(chatId, lines.join('\n'));
    } catch (err) {
      await this.sendMessage(chatId, `Error estimating fees: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /** /address — Show wallet addresses */
  private async handleAddress(chatId: number): Promise<void> {
    try {
      const addresses = await this.wallet.getAllAddresses();
      const lines = ['*Wallet Addresses*', ''];

      for (const [chain, addr] of Object.entries(addresses)) {
        lines.push(`*${chain}:*`);
        lines.push(`\`${addr}\``);
        lines.push('');
      }

      await this.sendMessage(chatId, lines.join('\n'));
    } catch (err) {
      await this.sendMessage(chatId, `Error fetching addresses: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
