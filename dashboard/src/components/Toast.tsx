import { useEffect, useState, useRef, useCallback } from 'react';
import { CheckCircle2, XCircle, X, AlertTriangle, Info, Undo2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number; // ms, default 5000
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const ICON_MAP: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />,
  error: <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
  info: <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />,
};

const PROGRESS_COLOR: Record<ToastType, string> = {
  success: 'bg-green-400',
  error: 'bg-red-400',
  warning: 'bg-amber-400',
  info: 'bg-blue-400',
};

const BORDER_COLOR: Record<ToastType, string> = {
  success: 'border-green-500/20',
  error: 'border-red-500/20',
  warning: 'border-amber-500/20',
  info: 'border-blue-500/20',
};

function ToastItem({ toast, onDismiss }: ToastProps) {
  const [exiting, setExiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const duration = toast.duration ?? 5000;

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(toast.id), 250);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(dismiss, duration);
    return () => clearTimeout(timer);
  }, [toast.id, dismiss, duration, paused]);

  // Pause progress bar on hover
  useEffect(() => {
    if (progressRef.current) {
      progressRef.current.style.animationPlayState = paused ? 'paused' : 'running';
    }
  }, [paused]);

  return (
    <div
      className={`${exiting ? 'toast-exit' : 'animate-slide-in'} flex flex-col overflow-hidden rounded-lg border ${BORDER_COLOR[toast.type]} bg-surface-1 shadow-lg max-w-sm backdrop-blur-sm`}
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-start gap-3 p-3.5">
        {ICON_MAP[toast.type]}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-primary">{toast.title}</p>
          <p className="text-xs text-text-secondary mt-0.5 break-words">{toast.message}</p>
          {toast.action && (
            <button
              onClick={() => {
                toast.action!.onClick();
                dismiss();
              }}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent-light transition-colors"
            >
              <Undo2 className="w-3 h-3" />
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={dismiss}
          className="text-text-muted hover:text-text-primary transition-colors shrink-0 p-0.5 rounded hover:bg-white/5"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-surface-3">
        <div
          ref={progressRef}
          className={`h-full ${PROGRESS_COLOR[toast.type]} toast-progress`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[150] flex flex-col gap-2"
      aria-label="Notifications"
    >
      {toasts.slice(-5).map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/** Hook for managing toasts */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (
      type: ToastType,
      title: string,
      message: string,
      options?: { duration?: number; action?: ToastData['action'] },
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [
        ...prev,
        { id, type, title, message, duration: options?.duration, action: options?.action },
      ]);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast };
}
