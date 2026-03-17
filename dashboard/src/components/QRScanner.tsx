import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, X, ClipboardPaste, AlertCircle, CheckCircle2 } from 'lucide-react';

interface QRScannerProps {
  onAddressDetected: (address: string) => void;
  onClose: () => void;
}

/** Regex patterns for common wallet address formats */
const ADDRESS_PATTERNS = [
  /\b(0x[a-fA-F0-9]{40})\b/,           // EVM (Ethereum, etc.)
  /\b(EQ[a-zA-Z0-9_-]{46})\b/,         // TON (EQ...)
  /\b(UQ[a-zA-Z0-9_-]{46})\b/,         // TON (UQ...)
];

function detectAddress(text: string): string | null {
  for (const pattern of ADDRESS_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * QRScanner — modal component with camera preview and clipboard paste.
 * Opens the device camera as a visual feature. Since QR decoding without
 * a library is unreliable, the primary input method is clipboard paste.
 * Users can scan a QR with their phone, copy the address, then paste here.
 */
export function QRScanner({ onAddressDetected, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [detected, setDetected] = useState<string | null>(null);
  const [pasted, setPasted] = useState(false);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setCameraError('Camera permission denied. Please allow camera access or paste an address below.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setCameraError('No camera found. Paste an address below instead.');
      } else {
        setCameraError('Could not access camera. Use paste instead.');
      }
    }
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [startCamera]);

  // Handle clipboard paste
  const handleClipboardPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setPasteInput(text.trim());
        const addr = detectAddress(text.trim());
        if (addr) {
          setDetected(addr);
        }
      }
      setPasted(true);
      setTimeout(() => setPasted(false), 1500);
    } catch {
      // Clipboard API not available
    }
  };

  // Handle manual input change
  const handleInputChange = (value: string) => {
    setPasteInput(value);
    const addr = detectAddress(value);
    setDetected(addr);
  };

  // Confirm detected address
  const handleConfirm = () => {
    if (detected) {
      onAddressDetected(detected);
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      onClose();
    }
  };

  // Use raw input as address (if it looks like one)
  const handleUseRaw = () => {
    const trimmed = pasteInput.trim();
    if (trimmed.length >= 10) {
      onAddressDetected(trimmed);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-surface-1 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Camera className="w-4 h-4 text-accent" />
            Scan QR / Paste Address
          </h3>
          <button
            onClick={() => {
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
              }
              onClose();
            }}
            className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera preview */}
        <div className="relative bg-black aspect-video">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {/* Scanning overlay */}
          {cameraActive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-accent/60 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-accent rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-accent rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-accent rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-accent rounded-br-lg" />
              </div>
            </div>
          )}
          {/* Camera error */}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-2/90 p-4">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-text-secondary">{cameraError}</p>
              </div>
            </div>
          )}
          {/* No camera, no error yet */}
          {!cameraActive && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-2/90">
              <div className="text-center">
                <Camera className="w-8 h-8 text-text-muted mx-auto mb-2 animate-pulse" />
                <p className="text-xs text-text-muted">Starting camera...</p>
              </div>
            </div>
          )}
        </div>

        {/* Paste section */}
        <div className="p-4 space-y-3">
          <p className="text-[11px] text-text-muted text-center">
            Point camera at QR code, or paste a wallet address below
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={pasteInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="0x..., EQ..., or UQ..."
              className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-primary font-mono placeholder:text-text-muted placeholder:font-sans focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors"
            />
            <button
              type="button"
              onClick={handleClipboardPaste}
              className={`px-3 py-2.5 rounded-lg border transition-colors shrink-0 flex items-center gap-1.5 text-xs font-medium ${
                pasted
                  ? 'bg-green-500/15 border-green-500/30 text-green-400'
                  : 'bg-surface-2 border-border text-text-secondary hover:text-accent hover:border-accent-border'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              Paste
            </button>
          </div>

          {/* Detected address */}
          {detected && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-green-400 font-medium mb-0.5">Address detected</p>
                <p className="text-xs text-text-primary font-mono truncate">{detected}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {detected ? (
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-light transition-colors"
              >
                Use This Address
              </button>
            ) : pasteInput.trim().length >= 10 ? (
              <button
                onClick={handleUseRaw}
                className="flex-1 py-2.5 rounded-lg bg-surface-3 border border-border text-text-primary text-sm font-medium hover:bg-surface-2 transition-colors"
              >
                Use as Address
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
