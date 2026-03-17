import { useState, useMemo } from 'react';
import {
  FileBarChart,
  TrendingUp,
  Coins,
  Users,
  Layers,
  Fuel,
  Printer,
  BarChart3,
} from 'lucide-react';
import type { TipHistoryEntry } from '../types';
import { shortenAddress } from '../lib/utils';

interface TipReportProps {
  history: TipHistoryEntry[];
}

interface ReportData {
  dateRange: { from: string; to: string };
  totalSent: number;
  totalFailed: number;
  totalVolume: number;
  totalFees: number;
  avgTipSize: number;
  volumeByChain: Array<{ chain: string; count: number; volume: number }>;
  volumeByToken: Array<{ token: string; count: number; volume: number }>;
  topRecipients: Array<{ address: string; count: number; volume: number }>;
  successRate: number;
}

export function TipReport({ history }: TipReportProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [report, setReport] = useState<ReportData | null>(null);

  const filteredHistory = useMemo(() => {
    let result = history;

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      if (!isNaN(from)) {
        result = result.filter((h) => new Date(h.createdAt).getTime() >= from);
      }
    }

    if (dateTo) {
      const to = new Date(dateTo).getTime();
      if (!isNaN(to)) {
        result = result.filter((h) => new Date(h.createdAt).getTime() <= to + 86400000);
      }
    }

    return result;
  }, [history, dateFrom, dateTo]);

  const generateReport = () => {
    const data = filteredHistory;
    if (data.length === 0) {
      setReport(null);
      return;
    }

    const confirmed = data.filter((h) => h.status === 'confirmed');
    const totalVolume = confirmed.reduce((sum, h) => sum + parseFloat(h.amount || '0'), 0);
    const totalFees = confirmed.reduce((sum, h) => {
      const feeNum = parseFloat(h.fee?.replace(/[^0-9.]/g, '') || '0');
      return sum + (isNaN(feeNum) ? 0 : feeNum);
    }, 0);

    // Volume by chain
    const chainMap = new Map<string, { count: number; volume: number }>();
    for (const h of confirmed) {
      const chainName = h.chainId.startsWith('ethereum') ? 'Ethereum Sepolia' : 'TON Testnet';
      const existing = chainMap.get(chainName) || { count: 0, volume: 0 };
      existing.count++;
      existing.volume += parseFloat(h.amount || '0');
      chainMap.set(chainName, existing);
    }

    // Volume by token
    const tokenMap = new Map<string, { count: number; volume: number }>();
    for (const h of confirmed) {
      const tokenName = h.token === 'usdt' ? 'USDT' : 'Native';
      const existing = tokenMap.get(tokenName) || { count: 0, volume: 0 };
      existing.count++;
      existing.volume += parseFloat(h.amount || '0');
      tokenMap.set(tokenName, existing);
    }

    // Top recipients
    const recipientMap = new Map<string, { count: number; volume: number }>();
    for (const h of confirmed) {
      const existing = recipientMap.get(h.recipient) || { count: 0, volume: 0 };
      existing.count++;
      existing.volume += parseFloat(h.amount || '0');
      recipientMap.set(h.recipient, existing);
    }
    const topRecipients = Array.from(recipientMap.entries())
      .map(([address, data]) => ({ address, ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);

    // Date range
    const dates = data.map((h) => new Date(h.createdAt).getTime());
    const minDate = new Date(Math.min(...dates)).toLocaleDateString();
    const maxDate = new Date(Math.max(...dates)).toLocaleDateString();

    setReport({
      dateRange: { from: dateFrom || minDate, to: dateTo || maxDate },
      totalSent: confirmed.length,
      totalFailed: data.length - confirmed.length,
      totalVolume,
      totalFees,
      avgTipSize: confirmed.length > 0 ? totalVolume / confirmed.length : 0,
      volumeByChain: Array.from(chainMap.entries()).map(([chain, d]) => ({ chain, ...d })),
      volumeByToken: Array.from(tokenMap.entries()).map(([token, d]) => ({ token, ...d })),
      topRecipients,
      successRate: data.length > 0 ? Math.round((confirmed.length / data.length) * 100) : 0,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5 print:border-0 print:shadow-none">
      <div className="flex items-center gap-2 mb-4">
        <FileBarChart className="w-4 h-4 text-accent" />
        <h2 className="text-base font-semibold text-text-primary">Tip Summary Report</h2>
      </div>

      {/* Date range selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 mb-4 print:hidden">
        <div className="flex-1">
          <label className="block text-xs text-text-secondary mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary focus:outline-none focus:border-accent-border transition-colors"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-text-secondary mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-surface-2 border border-border text-xs text-text-primary focus:outline-none focus:border-accent-border transition-colors"
          />
        </div>
        <button
          onClick={generateReport}
          disabled={filteredHistory.length === 0}
          className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-medium hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 shrink-0"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Generate Report
        </button>
      </div>

      {filteredHistory.length === 0 && !report && (
        <p className="text-xs text-text-muted text-center py-6">
          {history.length === 0
            ? 'No tip history available. Send some tips first.'
            : 'No tips found in the selected date range.'}
        </p>
      )}

      {/* Report Content */}
      {report && (
        <div className="space-y-4 report-content">
          {/* Print header (visible only in print) */}
          <div className="hidden print:block text-center mb-4">
            <h1 className="text-xl font-bold">TipFlow Summary Report</h1>
            <p className="text-sm text-gray-500">
              {report.dateRange.from} - {report.dateRange.to}
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <KPICard
              icon={<TrendingUp className="w-3.5 h-3.5 text-green-400" />}
              label="Tips Sent"
              value={String(report.totalSent)}
            />
            <KPICard
              icon={<Coins className="w-3.5 h-3.5 text-amber-400" />}
              label="Total Volume"
              value={report.totalVolume.toFixed(6)}
            />
            <KPICard
              icon={<BarChart3 className="w-3.5 h-3.5 text-blue-400" />}
              label="Avg Tip Size"
              value={report.avgTipSize.toFixed(6)}
            />
            <KPICard
              icon={<Fuel className="w-3.5 h-3.5 text-purple-400" />}
              label="Total Fees"
              value={report.totalFees.toFixed(6)}
            />
          </div>

          {/* Success Rate */}
          <div className="p-3 rounded-lg bg-surface-2 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-text-secondary">Success Rate</span>
              <span className="text-sm font-bold text-text-primary">{report.successRate}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${report.successRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-green-400">{report.totalSent} confirmed</span>
              <span className="text-[10px] text-red-400">{report.totalFailed} failed</span>
            </div>
          </div>

          {/* Volume by Chain */}
          {report.volumeByChain.length > 0 && (
            <div className="p-3 rounded-lg bg-surface-2 border border-border">
              <div className="flex items-center gap-2 mb-2.5">
                <Layers className="w-3.5 h-3.5 text-info" />
                <h3 className="text-xs font-semibold text-text-primary">Volume by Chain</h3>
              </div>
              <div className="space-y-2">
                {report.volumeByChain.map((entry) => {
                  const pct = report.totalVolume > 0 ? (entry.volume / report.totalVolume) * 100 : 0;
                  return (
                    <div key={entry.chain}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-secondary">{entry.chain}</span>
                        <span className="text-text-primary font-medium">
                          {entry.volume.toFixed(6)} ({entry.count} tips)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-3">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Volume by Token */}
          {report.volumeByToken.length > 0 && (
            <div className="p-3 rounded-lg bg-surface-2 border border-border">
              <div className="flex items-center gap-2 mb-2.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <h3 className="text-xs font-semibold text-text-primary">Volume by Token</h3>
              </div>
              <div className="space-y-2">
                {report.volumeByToken.map((entry) => {
                  const pct = report.totalVolume > 0 ? (entry.volume / report.totalVolume) * 100 : 0;
                  return (
                    <div key={entry.token}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-secondary">{entry.token}</span>
                        <span className="text-text-primary font-medium">
                          {entry.volume.toFixed(6)} ({entry.count} tips)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-surface-3">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Recipients */}
          {report.topRecipients.length > 0 && (
            <div className="p-3 rounded-lg bg-surface-2 border border-border">
              <div className="flex items-center gap-2 mb-2.5">
                <Users className="w-3.5 h-3.5 text-green-400" />
                <h3 className="text-xs font-semibold text-text-primary">Top Recipients</h3>
              </div>
              <div className="space-y-1.5">
                {report.topRecipients.map((entry, idx) => (
                  <div key={entry.address} className="flex items-center gap-2 py-1.5">
                    <span className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono text-text-secondary flex-1 truncate">
                      {shortenAddress(entry.address)}
                    </span>
                    <span className="text-xs text-text-muted">{entry.count} tips</span>
                    <span className="text-xs font-medium text-text-primary">{entry.volume.toFixed(6)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Print button */}
          <button
            onClick={handlePrint}
            className="w-full py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2 print:hidden"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      )}
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="p-3 rounded-lg bg-surface-2 border border-border">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-text-primary truncate" title={value}>
        {value}
      </p>
    </div>
  );
}
