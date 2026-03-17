import { useState, useEffect, useCallback } from 'react';
import { QrCode, Copy, Check, Download, ExternalLink } from 'lucide-react';
import type { ChainId, WalletReceiveInfo } from '../types';
import { api } from '../lib/api';
import { shortenAddress, copyToClipboard, chainColor } from '../lib/utils';

export function QRReceive() {
  const [receiveInfo, setReceiveInfo] = useState<WalletReceiveInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChain, setActiveChain] = useState<ChainId>('ethereum-sepolia');
  const [copied, setCopied] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { wallets } = await api.getReceiveInfo();
        setReceiveInfo(wallets);
        if (wallets.length > 0) {
          setActiveChain(wallets[0].chainId);
        }
      } catch {
        // Fallback: fetch addresses directly
        try {
          const { addresses } = await api.getAddresses();
          const fallback: WalletReceiveInfo[] = Object.entries(addresses).map(([chainId, address]) => {
            const isEth = chainId.startsWith('ethereum');
            return {
              chainId: chainId as ChainId,
              chainName: isEth ? 'Ethereum Sepolia' : 'TON Testnet',
              address: address as string,
              qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(address as string)}&bgcolor=1a1a2e&color=ffffff`,
              explorerUrl: isEth
                ? `https://sepolia.etherscan.io/address/${address}`
                : `https://testnet.tonviewer.com/${address}`,
              nativeCurrency: isEth ? 'ETH' : 'TON',
            };
          });
          setReceiveInfo(fallback);
          if (fallback.length > 0) setActiveChain(fallback[0].chainId);
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const active = receiveInfo.find((w) => w.chainId === activeChain);

  const handleCopy = useCallback(async () => {
    if (!active) return;
    const ok = await copyToClipboard(active.address);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [active]);

  const handleDownload = useCallback(() => {
    if (!active) return;
    const link = document.createElement('a');
    link.href = active.qrCodeUrl;
    link.download = `tipflow-${active.chainId}-qr.png`;
    // For cross-origin images, we need to fetch and create a blob
    fetch(active.qrCodeUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        // Fallback: open in new tab
        window.open(active.qrCodeUrl, '_blank');
      });
  }, [active]);

  // Reset img loaded state when chain changes
  useEffect(() => {
    setImgLoaded(false);
  }, [activeChain]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-accent" />
          Receive Tips
        </h2>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="skeleton w-48 h-48 rounded-xl" />
          <div className="skeleton w-64 h-8 rounded-lg" />
        </div>
      </div>
    );
  }

  if (receiveInfo.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-accent" />
          Receive Tips
        </h2>
        <div className="text-center py-8">
          <p className="text-sm text-text-muted">No wallets available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
        <QrCode className="w-4 h-4 text-accent" />
        Receive Tips
      </h2>

      {/* Chain tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-surface-2 border border-border mb-4">
        {receiveInfo.map((w) => {
          const isActive = w.chainId === activeChain;
          const color = chainColor(w.chainId);
          return (
            <button
              key={w.chainId}
              onClick={() => setActiveChain(w.chainId)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-surface-3 text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {w.chainName.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="flex flex-col items-center gap-4">
          {/* QR Code */}
          <div className="relative bg-white rounded-xl p-3 shadow-md">
            {!imgLoaded && (
              <div className="w-48 h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <img
              src={active.qrCodeUrl}
              alt={`QR code for ${active.chainName} address`}
              width={192}
              height={192}
              className={`rounded-lg ${imgLoaded ? 'block' : 'hidden'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgLoaded(true)}
            />
            {/* Chain badge overlay */}
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg"
              style={{
                backgroundColor: chainColor(active.chainId),
                boxShadow: `0 2px 8px ${chainColor(active.chainId)}55`,
              }}
            >
              {active.nativeCurrency}
            </div>
          </div>

          {/* Address display */}
          <div className="w-full mt-2">
            <p className="text-[10px] text-text-muted uppercase tracking-wider text-center mb-1.5">
              {active.chainName} Address
            </p>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-2 border border-border">
              <span className="text-xs font-mono text-text-secondary truncate flex-1 text-center">
                {shortenAddress(active.address, 10)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 w-full">
            <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-accent/10 text-accent border border-accent/30'
                  : 'bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-3'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Address
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg text-xs font-medium bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all"
              title="Download QR code as PNG"
            >
              <Download className="w-3.5 h-3.5" />
              Save QR
            </button>
            <a
              href={active.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium bg-surface-2 border border-border text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-all"
              title="View on block explorer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
