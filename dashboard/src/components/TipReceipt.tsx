import { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  ExternalLink,
  CheckCircle2,
  Clock,
  Receipt,
} from 'lucide-react';
import type { TipReceipt as TipReceiptType } from '../types';
import { shortenAddress, copyToClipboard } from '../lib/utils';

interface TipReceiptProps {
  receipt: TipReceiptType;
  onClose: () => void;
}

export function TipReceiptModal({ receipt, onClose }: TipReceiptProps) {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyShare = async () => {
    const lines = [
      '--- TipFlow Transaction Receipt ---',
      `Receipt: ${receipt.receiptId}`,
      `Date: ${new Date(receipt.timestamp).toLocaleString()}`,
      '',
      `From: ${receipt.from || 'N/A'}`,
      `To: ${receipt.to}`,
      `Amount: ${receipt.amount}`,
      `Network: ${receipt.chainName}`,
      `Fee: ${receipt.fee}`,
      `Status: ${receipt.status === 'confirmed' ? 'Confirmed' : 'Pending'}`,
      receipt.blockNumber ? `Block: #${receipt.blockNumber}` : '',
      '',
      `TX Hash: ${receipt.txHash}`,
      `Explorer: ${receipt.explorerUrl}`,
      '',
      'Powered by TipFlow + Tether WDK',
    ]
      .filter(Boolean)
      .join('\n');

    const success = await copyToClipboard(lines);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const qrCodeUrl = receipt.txHash
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(receipt.explorerUrl)}`
    : '';

  const formattedDate = new Date(receipt.timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = new Date(receipt.timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Receipt card */}
      <div className="relative w-full max-w-md bg-surface-1 rounded-2xl border border-border shadow-2xl animate-fade-in print:shadow-none print:border-0 print:rounded-none print:max-w-none">
        {/* Close button (hidden in print) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors print:hidden"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with branding */}
        <div className="px-6 pt-6 pb-4 border-b border-dashed border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary tracking-tight">
                TipFlow
              </h2>
              <p className="text-[10px] text-text-muted uppercase tracking-widest">
                Transaction Receipt
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-text-muted font-mono">
              {receipt.receiptId}
            </span>
            <div className="flex items-center gap-1.5">
              {receipt.status === 'confirmed' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-medium text-accent">
                    Confirmed
                  </span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-warning" />
                  <span className="text-xs font-medium text-warning">
                    Pending
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Amount - hero section */}
        <div className="px-6 py-5 text-center border-b border-dashed border-border">
          <p className="text-3xl font-bold text-text-primary tracking-tight">
            {receipt.amount}
          </p>
          <p className="text-sm text-text-muted mt-1">
            on {receipt.chainName}
          </p>
        </div>

        {/* Transaction details */}
        <div className="px-6 py-4 space-y-3">
          <DetailRow label="Date" value={`${formattedDate} ${formattedTime}`} />
          {receipt.from && (
            <DetailRow
              label="From"
              value={shortenAddress(receipt.from)}
              mono
              full={receipt.from}
            />
          )}
          <DetailRow
            label="To"
            value={shortenAddress(receipt.to)}
            mono
            full={receipt.to}
          />
          <DetailRow label="Network" value={receipt.chainName} />
          <DetailRow label="Fee" value={receipt.fee} />
          {receipt.blockNumber && (
            <DetailRow
              label="Block"
              value={`#${receipt.blockNumber.toLocaleString()}`}
            />
          )}
          <DetailRow
            label="TX Hash"
            value={shortenAddress(receipt.txHash, 8)}
            mono
            full={receipt.txHash}
          />
        </div>

        {/* QR Code + Explorer */}
        {qrCodeUrl && (
          <div className="px-6 py-4 border-t border-dashed border-border flex items-center gap-4">
            <img
              src={qrCodeUrl}
              alt="Transaction QR Code"
              className="w-20 h-20 rounded-lg border border-border bg-white p-1"
              loading="lazy"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5">
                Scan to view on explorer
              </p>
              <a
                href={receipt.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View on Explorer
              </a>
            </div>
          </div>
        )}

        {/* Footer branding */}
        <div className="px-6 py-3 border-t border-border bg-surface-2 rounded-b-2xl print:rounded-none">
          <p className="text-[10px] text-text-muted text-center">
            Powered by TipFlow + Tether WDK
          </p>
        </div>

        {/* Action buttons (hidden in print) */}
        <div className="px-6 py-4 flex items-center gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleCopyShare}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-3 text-text-secondary text-sm font-medium hover:bg-surface-3/80 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-accent" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Share
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Single row in the receipt details section */
function DetailRow({
  label,
  value,
  mono,
  full,
}: {
  label: string;
  value: string;
  mono?: boolean;
  full?: string;
}) {
  const [showFull, setShowFull] = useState(false);

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-text-muted shrink-0">{label}</span>
      <span
        className={`text-xs text-text-primary text-right truncate ${
          mono ? 'font-mono' : ''
        } ${full ? 'cursor-pointer hover:text-accent transition-colors' : ''}`}
        onClick={() => full && setShowFull(!showFull)}
        title={full ?? value}
      >
        {showFull && full ? full : value}
      </span>
    </div>
  );
}
