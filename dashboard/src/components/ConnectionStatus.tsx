import { useState, useEffect, useRef, useCallback } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

type Status = 'connected' | 'slow' | 'disconnected';

export function ConnectionStatus() {
  const [status, setStatus] = useState<Status>('connected');
  const [latency, setLatency] = useState<number | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const retryCount = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    setCountdown(10);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const checkHealth = useCallback(async () => {
    const start = performance.now();
    try {
      const res = await fetch('/api/health', { signal: AbortSignal.timeout(8000) });
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        setLatency(elapsed);
        setStatus(elapsed > 2000 ? 'slow' : 'connected');
        setReconnecting(false);
        setCountdown(0);
        if (countdownRef.current) clearInterval(countdownRef.current);
        retryCount.current = 0;
      } else {
        setStatus('disconnected');
        setLatency(null);
        setReconnecting(true);
        retryCount.current += 1;
        startCountdown();
      }
    } catch {
      setStatus('disconnected');
      setLatency(null);
      setReconnecting(true);
      retryCount.current += 1;
      startCountdown();
    }
  }, [startCountdown]);

  useEffect(() => {
    checkHealth();
    intervalRef.current = setInterval(checkHealth, 10_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [checkHealth]);

  const dotColor =
    status === 'connected'
      ? 'bg-green-400'
      : status === 'slow'
        ? 'bg-yellow-400'
        : 'bg-red-400';

  const borderColor =
    status === 'connected'
      ? 'border-green-500/20'
      : status === 'slow'
        ? 'border-yellow-500/20'
        : 'border-red-500/20';

  const label =
    status === 'connected'
      ? 'Connected'
      : status === 'slow'
        ? 'Slow'
        : reconnecting && countdown > 0
          ? `Retry in ${countdown}s`
          : reconnecting
            ? 'Reconnecting...'
            : 'Disconnected';

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${borderColor} bg-surface-2 cursor-default`}
      >
        {reconnecting ? (
          <Loader2 className="w-3 h-3 text-red-400 animate-spin" />
        ) : status === 'disconnected' ? (
          <WifiOff className="w-3 h-3 text-red-400" />
        ) : (
          <span className={`w-2 h-2 rounded-full ${dotColor} ${status === 'connected' ? 'animate-pulse' : ''}`} />
        )}
        <span className="text-[10px] sm:text-[11px] font-medium text-text-secondary hidden sm:inline">
          {label}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 z-50 w-48 rounded-lg border border-border bg-surface-1 shadow-xl p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
            <Wifi className="w-3.5 h-3.5" />
            API Connection
          </div>
          <div className="text-[11px] text-text-secondary space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={
                  status === 'connected'
                    ? 'text-green-400'
                    : status === 'slow'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }
              >
                {label}
              </span>
            </div>
            {latency !== null && (
              <div className="flex justify-between">
                <span>Latency:</span>
                <span className="font-mono">{latency}ms</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Endpoint:</span>
              <span className="font-mono">/api/health</span>
            </div>
            {retryCount.current > 0 && (
              <div className="flex justify-between">
                <span>Retries:</span>
                <span className="text-red-400">{retryCount.current}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
