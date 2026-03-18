import { useState, useEffect, useCallback } from 'react';
import { Shield, ShieldCheck, ShieldX, Copy, Check, Download, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { api } from '../lib/api';

interface CryptoReceiptData {
  version: string;
  receiptId: string;
  tipId: string;
  from: string;
  to: string;
  amount: string;
  token: string;
  chainId: string;
  txHash: string;
  blockNumber?: number;
  fee: string;
  memo?: string;
  timestamp: string;
  senderPublicKey: string;
  signature: string;
  messageHash: string;
}

interface VerifyResult {
  valid: boolean;
  reason?: string;
  verifiedAt: string;
}

function truncate(str: string, start = 8, end = 6): string {
  if (str.length <= start + end + 3) return str;
  return `${str.slice(0, start)}...${str.slice(-end)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-white/5 transition-colors text-text-muted hover:text-text-secondary"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function ReceiptCard({ receipt }: { receipt: CryptoReceiptData }) {
  const [expanded, setExpanded] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const data = await api.verifyReceipt(receipt);
      setVerifyResult(data.verification);
    } catch {
      setVerifyResult({ valid: false, reason: 'Verification request failed', verifiedAt: new Date().toISOString() });
    } finally {
      setVerifying(false);
    }
  };

  const handleDownload = () => {
    const proof = {
      receipt: {
        receiptId: receipt.receiptId,
        tipId: receipt.tipId,
        from: receipt.from,
        to: receipt.to,
        amount: receipt.amount,
        token: receipt.token,
        chainId: receipt.chainId,
        txHash: receipt.txHash,
        blockNumber: receipt.blockNumber,
        timestamp: receipt.timestamp,
      },
      cryptographicProof: {
        senderPublicKey: receipt.senderPublicKey,
        signature: receipt.signature,
        messageHash: receipt.messageHash,
        version: receipt.version,
      },
      verification: verifyResult ?? undefined,
    };
    const blob = new Blob([JSON.stringify(proof, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.receiptId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const date = new Date(receipt.timestamp);

  return (
    <div className="rounded-lg bg-surface-2 border border-border overflow-hidden card-hover">
      {/* Summary row */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="shrink-0">
          {verifyResult ? (
            verifyResult.valid ? (
              <ShieldCheck className="w-4 h-4 text-green-400" />
            ) : (
              <ShieldX className="w-4 h-4 text-red-400" />
            )
          ) : (
            <Shield className="w-4 h-4 text-text-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-text-primary">{truncate(receipt.from)}</span>
            <span className="text-text-muted text-[10px]">-&gt;</span>
            <span className="font-mono text-xs text-text-primary">{truncate(receipt.to)}</span>
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-semibold text-text-primary">{receipt.amount} {receipt.token}</div>
          <div className="text-[10px] text-text-muted">{receipt.chainId}</div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
          {/* Transaction details */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Transaction</h4>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <span className="text-text-muted">From</span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-mono text-text-primary truncate">{receipt.from}</span>
                <CopyButton text={receipt.from} />
              </div>
              <span className="text-text-muted">To</span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-mono text-text-primary truncate">{receipt.to}</span>
                <CopyButton text={receipt.to} />
              </div>
              <span className="text-text-muted">Tx Hash</span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-mono text-text-primary truncate">{receipt.txHash}</span>
                <CopyButton text={receipt.txHash} />
              </div>
              {receipt.blockNumber && (
                <>
                  <span className="text-text-muted">Block</span>
                  <span className="font-mono text-text-primary">{receipt.blockNumber}</span>
                </>
              )}
              <span className="text-text-muted">Fee</span>
              <span className="font-mono text-text-primary">{receipt.fee}</span>
              {receipt.memo && (
                <>
                  <span className="text-text-muted">Memo</span>
                  <span className="text-text-primary">{receipt.memo}</span>
                </>
              )}
            </div>
          </div>

          {/* Cryptographic proof */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Cryptographic Proof</h4>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              <span className="text-text-muted">Signature</span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-mono text-text-primary truncate">{truncate(receipt.signature, 12, 8)}</span>
                <CopyButton text={receipt.signature} />
              </div>
              <span className="text-text-muted">Public Key</span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-mono text-text-primary truncate">{truncate(receipt.senderPublicKey, 10, 6)}</span>
                <CopyButton text={receipt.senderPublicKey} />
              </div>
              <span className="text-text-muted">Msg Hash</span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="font-mono text-text-primary truncate">{truncate(receipt.messageHash, 10, 6)}</span>
                <CopyButton text={receipt.messageHash} />
              </div>
            </div>
          </div>

          {/* Verification result */}
          {verifyResult && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              verifyResult.valid
                ? 'bg-green-500/10 border-green-500/20 animate-verify-flash'
                : 'bg-red-500/10 border-red-500/20'
            }`}>
              {verifyResult.valid ? (
                <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
              ) : (
                <ShieldX className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <div>
                <span className={`text-xs font-semibold ${verifyResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {verifyResult.valid ? 'Cryptographically Verified' : 'Verification Failed'}
                </span>
                {verifyResult.reason && (
                  <p className="text-[10px] text-text-muted mt-0.5">{verifyResult.reason}</p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors disabled:opacity-50 btn-press"
            >
              <Shield className="w-3.5 h-3.5" />
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-surface-1 border border-border text-text-secondary text-xs font-medium hover:bg-white/[0.03] transition-colors btn-press"
            >
              <Download className="w-3.5 h-3.5" />
              Download Proof
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CryptoReceiptPanel() {
  const [receipts, setReceipts] = useState<CryptoReceiptData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchReceipts = useCallback(async () => {
    try {
      const data = await api.getAllReceipts();
      setReceipts(data.receipts);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <div className="skeleton h-32 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-accent" />
          Cryptographic Receipts
        </h2>
        <span className="text-xs text-text-muted">{total} total</span>
      </div>

      {receipts.length === 0 ? (
        <div className="text-center py-8 text-text-muted text-sm animate-fade-in">
          <Shield className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
          <p className="text-xs text-text-muted">No receipts yet</p>
          <p className="text-[10px] text-text-muted/60 mt-1">Send a tip to generate cryptographic proof</p>
        </div>
      ) : (
        <div className="space-y-2">
          {receipts.map((receipt, i) => (
            <div key={receipt.receiptId} className="animate-list-item-in" style={{ animationDelay: `${i * 60}ms` }}>
              <ReceiptCard receipt={receipt} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
