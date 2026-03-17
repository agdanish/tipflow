import { useState, useEffect, useCallback } from 'react';
import { FileText, Search, Download, ChevronDown, ChevronRight, Filter, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { api } from '../lib/api';
import type { AuditEntry } from '../types';

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'tip_sent', label: 'Tip Sent' },
  { value: 'tip_failed', label: 'Tip Failed' },
  { value: 'login', label: 'Login' },
  { value: 'settings_changed', label: 'Settings Changed' },
  { value: 'limit_exceeded', label: 'Limit Exceeded' },
  { value: 'webhook_fired', label: 'Webhook Fired' },
];

const EVENT_COLORS: Record<string, string> = {
  tip_sent: 'text-green-400 bg-green-500/10 border-green-500/20',
  tip_failed: 'text-red-400 bg-red-500/10 border-red-500/20',
  login: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  settings_changed: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  limit_exceeded: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  webhook_fired: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  success: CheckCircle2,
  failure: XCircle,
  warning: AlertTriangle,
};

const STATUS_COLORS: Record<string, string> = {
  success: 'text-green-400',
  failure: 'text-red-400',
  warning: 'text-amber-400',
};

export function AuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);
  const [eventType, setEventType] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (eventType) filters.eventType = eventType;
      if (search) filters.search = search;
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;
      const { entries: data } = await api.getAuditLog(
        Object.keys(filters).length > 0 ? filters : undefined,
      );
      setEntries(data);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, [eventType, search, dateFrom, dateTo]);

  useEffect(() => {
    if (!collapsed) {
      fetchEntries();
      const id = setInterval(fetchEntries, 15_000);
      return () => clearInterval(id);
    }
  }, [collapsed, fetchEntries]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Event Type', 'Details', 'IP', 'Status'];
    const rows = entries.map((e) => [
      e.timestamp,
      e.eventType,
      `"${e.details.replace(/"/g, '""')}"`,
      e.ip ?? '',
      e.status,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tipflow-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 p-4 sm:p-5 hover:bg-surface-2/50 transition-colors"
      >
        <div className="p-1.5 rounded-lg bg-indigo-500/10">
          <FileText className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-semibold text-text-primary">Audit Log</h3>
          <p className="text-[11px] text-text-muted mt-0.5">Security event trail</p>
        </div>
        <span className="text-xs text-text-muted mr-2">{entries.length} entries</span>
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-text-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-muted" />
        )}
      </button>

      {!collapsed && (
        <div className="border-t border-border p-4 sm:p-5 space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="px-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border"
              >
                {EVENT_TYPES.map((et) => (
                  <option key={et.value} value={et.value}>
                    {et.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg border transition-colors ${
                  showFilters
                    ? 'bg-accent/10 border-accent-border text-accent'
                    : 'bg-surface-2 border-border text-text-muted hover:text-text-primary'
                }`}
                title="Date filters"
              >
                <Filter className="w-4 h-4" />
              </button>
              <button
                onClick={exportCSV}
                disabled={entries.length === 0}
                className="p-2 rounded-lg bg-surface-2 border border-border text-text-muted hover:text-text-primary transition-colors disabled:opacity-40"
                title="Export as CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Date Range Filters */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-surface-2 border border-border">
              <div className="flex-1">
                <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-md bg-surface-1 border border-border text-xs text-text-primary focus:outline-none focus:border-accent-border"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-md bg-surface-1 border border-border text-xs text-text-primary focus:outline-none focus:border-accent-border"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setDateFrom('');
                    setDateTo('');
                  }}
                  className="self-end px-3 py-1.5 rounded-md text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Entries Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-text-muted">
              <Info className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No audit entries found</p>
              <p className="text-[11px] mt-1">Events will appear here as you use TipFlow</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Timestamp</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Event</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Details</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">IP</th>
                    <th className="text-left py-2 px-3 text-text-muted font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.slice(0, 50).map((entry) => {
                    const StatusIcon = STATUS_ICONS[entry.status] || Info;
                    const statusColor = STATUS_COLORS[entry.status] || 'text-text-muted';
                    const eventColor = EVENT_COLORS[entry.eventType] || 'text-text-secondary bg-surface-2 border-border';
                    return (
                      <tr key={entry.id} className="border-b border-border/50 hover:bg-surface-2/30 transition-colors">
                        <td className="py-2 px-3 text-text-secondary whitespace-nowrap font-mono text-[11px]">
                          {new Date(entry.timestamp).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${eventColor}`}>
                            {entry.eventType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-text-secondary max-w-xs truncate" title={entry.details}>
                          {entry.details}
                        </td>
                        <td className="py-2 px-3 text-text-muted font-mono text-[11px]">
                          {entry.ip ?? '-'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center gap-1 ${statusColor}`}>
                            <StatusIcon className="w-3 h-3" />
                            <span className="text-[10px] font-medium capitalize">{entry.status}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {entries.length > 50 && (
                <p className="text-center text-[11px] text-text-muted py-2">
                  Showing 50 of {entries.length} entries. Export CSV for full log.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
