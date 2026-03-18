import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  Repeat,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import type { CalendarEvent, CalendarResponse } from '../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Color dot for chain */
function chainDotColor(chain?: string): string {
  if (!chain) return 'bg-gray-400';
  if (chain.includes('ton')) return 'bg-sky-400';
  if (chain.includes('ethereum')) return 'bg-indigo-400';
  return 'bg-emerald-400';
}

interface DayPopoverProps {
  date: string;
  tips: CalendarEvent['tips'];
  onClose: () => void;
  onCancel: (id: string) => void;
}

function DayPopover({ date, tips, onClose, onCancel }: DayPopoverProps) {
  const d = new Date(date + 'T00:00:00');
  const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-surface-1 border border-border rounded-xl shadow-2xl w-full max-w-sm max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-semibold text-text-primary">{label}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tips list */}
        <div className="p-4 space-y-2 overflow-y-auto max-h-[50vh]">
          {tips.length === 0 && (
            <p className="text-xs text-text-muted text-center py-4">No tips on this day</p>
          )}
          {tips.map((tip, i) => (
            <div
              key={`${tip.id}-${i}`}
              className={`p-3 rounded-lg border text-sm ${
                tip.status === 'scheduled'
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : tip.status === 'executed'
                  ? 'bg-green-500/5 border-green-500/20'
                  : 'bg-red-500/5 border-red-500/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {tip.status === 'scheduled' && <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                  {tip.status === 'executed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />}
                  {tip.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  <span className="font-medium text-text-primary truncate">
                    {tip.amount} {tip.token === 'usdt' ? 'USDT' : 'Native'}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {tip.recurring && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/20 text-[10px] font-medium text-purple-400">
                      <Repeat className="w-2.5 h-2.5" />
                      {tip.interval}
                    </span>
                  )}
                  {tip.status === 'scheduled' && !tip.recurring && (
                    <button
                      onClick={() => onCancel(tip.id)}
                      className="p-1 rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-1.5 text-xs text-text-secondary">
                <span className="text-text-muted">To:</span>{' '}
                <span className="font-mono">{tip.recipient.slice(0, 8)}...{tip.recipient.slice(-6)}</span>
              </div>
              {tip.chain && (
                <div className="mt-0.5 text-[11px] text-text-muted">
                  Chain: {tip.chain}
                </div>
              )}
              {tip.message && (
                <div className="mt-0.5 text-[11px] text-text-muted italic">
                  &ldquo;{tip.message}&rdquo;
                </div>
              )}
              <div className="mt-0.5 text-[11px] text-text-muted">
                {new Date(tip.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface TipCalendarProps {
  onCancelTip?: (id: string) => void;
}

export function TipCalendar({ onCancelTip }: TipCalendarProps) {
  const now = new Date();
  const [expanded, setExpanded] = useState(false);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCalendar(month, year);
      setData(res);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    if (expanded) {
      fetchCalendar();
    }
  }, [expanded, fetchCalendar]);

  // Build event lookup
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent['tips']>();
    if (data) {
      for (const evt of data.events) {
        map.set(evt.date, evt.tips);
      }
    }
    return map;
  }, [data]);

  // Calendar grid
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month, 0).getDate();

    const cells: Array<{ day: number; dateStr: string } | null> = [];

    // Leading blanks
    for (let i = 0; i < startDow; i++) {
      cells.push(null);
    }
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr });
    }
    // Trailing blanks to fill last row
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    return cells;
  }, [month, year]);

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  const goToday = () => {
    const t = new Date();
    setMonth(t.getMonth() + 1);
    setYear(t.getFullYear());
  };

  const goPrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const goNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const handleCancel = async (id: string) => {
    if (onCancelTip) {
      onCancelTip(id);
    } else {
      try {
        await api.cancelScheduledTip(id);
      } catch {
        // ignore
      }
    }
    setSelectedDate(null);
    fetchCalendar();
  };

  const selectedTips = selectedDate ? eventMap.get(selectedDate) ?? [] : [];
  const totalEvents = data?.events.reduce((sum, e) => sum + e.tips.length, 0) ?? 0;

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-2 transition-colors"
      >
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          Tip Calendar
          {!expanded && totalEvents > 0 && (
            <span className="text-xs font-normal text-text-muted ml-2">
              {totalEvents} scheduled
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {expanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchCalendar();
              }}
              className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-surface-3 transition-colors"
              title="Refresh calendar"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 sm:px-5 pb-5">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goPrev}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">
                {MONTHS[month - 1]} {year}
              </span>
              <button
                onClick={goToday}
                className="text-[10px] px-2 py-0.5 rounded-full bg-surface-3 text-text-secondary hover:text-text-primary hover:bg-accent/20 transition-colors"
              >
                Today
              </button>
            </div>
            <button
              onClick={goNext}
              className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading && !data && (
            <div className="text-center py-10">
              <RefreshCw className="w-6 h-6 text-accent animate-spin mx-auto mb-2" />
              <p className="text-sm text-text-muted">Loading calendar...</p>
            </div>
          )}

          {/* Calendar Grid */}
          {(!loading || data) && (
            <div className="select-none">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="text-center text-[10px] font-medium text-text-muted py-1">
                    <span className="hidden sm:inline">{wd}</span>
                    <span className="sm:hidden">{wd.charAt(0)}</span>
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden">
                {calendarGrid.map((cell, idx) => {
                  if (!cell) {
                    return (
                      <div key={`blank-${idx}`} className="bg-surface-1 min-h-[3rem] sm:min-h-[4rem]" />
                    );
                  }

                  const { day, dateStr } = cell;
                  const tips = eventMap.get(dateStr);
                  const hasTips = tips && tips.length > 0;
                  const isToday = dateStr === todayStr;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => hasTips ? setSelectedDate(dateStr) : undefined}
                      className={`
                        relative bg-surface-1 min-h-[3rem] sm:min-h-[4rem] p-1 sm:p-1.5
                        text-left transition-colors
                        ${hasTips ? 'cursor-pointer hover:bg-surface-2' : 'cursor-default'}
                        ${hasTips ? 'bg-amber-500/[0.03]' : ''}
                        ${isToday ? 'ring-1 ring-inset ring-accent/40' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`
                            text-xs font-medium
                            ${isToday ? 'text-accent font-bold bg-accent/15 w-5 h-5 rounded-full flex items-center justify-center' : 'text-text-secondary'}
                          `}
                        >
                          {day}
                        </span>
                        {hasTips && (
                          <span className="text-[8px] font-semibold tabular-nums text-amber-400 bg-amber-500/10 px-1 rounded-full sm:inline hidden">
                            {tips.length}
                          </span>
                        )}
                      </div>

                      {/* Tip dots */}
                      {hasTips && (
                        <div className="flex flex-wrap gap-0.5 mt-0.5">
                          {tips.slice(0, 4).map((tip, i) => (
                            <span
                              key={`${tip.id}-${i}`}
                              className={`w-1.5 h-1.5 rounded-full ${chainDotColor(tip.chain)}`}
                              title={`${tip.amount} ${tip.token}`}
                            />
                          ))}
                          {tips.length > 4 && (
                            <span className="text-[8px] text-text-muted leading-none">+{tips.length - 4}</span>
                          )}
                        </div>
                      )}

                      {/* Compact tip count on mobile */}
                      {hasTips && (
                        <span className="hidden max-sm:block text-[8px] text-amber-400 mt-0.5">
                          {tips.length}
                        </span>
                      )}

                      {/* Desktop: show first tip preview */}
                      {hasTips && tips.length > 0 && (
                        <div className="hidden sm:block mt-1">
                          <span className="text-[9px] text-text-muted truncate block">
                            {tips[0].amount} {tips[0].token === 'usdt' ? 'USDT' : ''}
                          </span>
                          {tips.length > 1 && (
                            <span className="text-[8px] text-text-muted">
                              +{tips.length - 1} more
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 text-[10px] text-text-muted">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  Ethereum
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  TON
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Auto
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Day detail popover */}
      {selectedDate && (
        <DayPopover
          date={selectedDate}
          tips={selectedTips}
          onClose={() => setSelectedDate(null)}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
