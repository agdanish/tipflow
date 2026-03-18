// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useRef, useEffect } from 'react';
import { Plus, Send, Users, Scissors, RefreshCw, Command, X } from 'lucide-react';

interface FloatingMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  onClick: () => void;
}

interface FloatingMenuProps {
  onSingleTip: () => void;
  onBatchTip: () => void;
  onSplitTip: () => void;
  onRefresh: () => void;
  onCommandPalette: () => void;
}

export function FloatingMenu({ onSingleTip, onBatchTip, onSplitTip, onRefresh, onCommandPalette }: FloatingMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const items: FloatingMenuItem[] = [
    { id: 'single', icon: <Send className="w-4 h-4" />, label: 'Send Tip', color: 'bg-accent hover:bg-accent-light', onClick: onSingleTip },
    { id: 'batch', icon: <Users className="w-4 h-4" />, label: 'Batch Tip', color: 'bg-blue-500 hover:bg-blue-400', onClick: onBatchTip },
    { id: 'split', icon: <Scissors className="w-4 h-4" />, label: 'Split Tip', color: 'bg-purple-500 hover:bg-purple-400', onClick: onSplitTip },
    { id: 'refresh', icon: <RefreshCw className="w-4 h-4" />, label: 'Refresh', color: 'bg-amber-500 hover:bg-amber-400', onClick: onRefresh },
    { id: 'cmd', icon: <Command className="w-4 h-4" />, label: 'Commands', color: 'bg-cyan-500 hover:bg-cyan-400', onClick: onCommandPalette },
  ];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <div ref={menuRef} className="fixed bottom-20 right-5 z-[80] sm:bottom-6 sm:right-6" role="group" aria-label="Quick action menu">
      {/* Radial items */}
      {open && (
        <div className="absolute bottom-14 right-0 flex flex-col-reverse gap-2 items-end animate-fade-in">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
              className={`flex items-center gap-2 pl-3 pr-4 py-2 rounded-full text-white text-xs font-medium shadow-lg transition-all btn-press floating-item-enter ${item.color}`}
              style={{ animationDelay: `${i * 40}ms` }}
              aria-label={item.label}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 btn-press ${
          open
            ? 'bg-surface-2 border border-border text-text-primary rotate-45'
            : 'bg-accent text-white glow-accent'
        }`}
        aria-label={open ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={open}
      >
        {open ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
    </div>
  );
}
