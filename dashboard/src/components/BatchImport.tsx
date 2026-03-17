import { useState, useRef, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Eye,
} from 'lucide-react';
import { api } from '../lib/api';
import type { CSVImportResult } from '../types';

const SAMPLE_CSV = `recipient,amount,token,chain,memo
0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18,0.001,native,ethereum-sepolia,Great work on PR #42
0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199,0.002,native,,Thanks for the code review
0x1234567890abcdef1234567890abcdef12345678,5,usdt,ethereum-sepolia,Monthly contributor reward`;

interface ParsedRow {
  recipient: string;
  amount: string;
  token: string;
  chain: string;
  memo: string;
  valid: boolean;
  errors: string[];
}

type ImportStage = 'input' | 'preview' | 'executing' | 'results';

export function BatchImport() {
  const [stage, setStage] = useState<ImportStage>('input');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validTokens = ['native', 'usdt'];
  const validChains = ['ethereum-sepolia', 'ton-testnet', 'ethereum-sepolia-gasless', 'ton-testnet-gasless', ''];

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    // Detect header
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('recipient') || firstLine.includes('address');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line) => {
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;
      for (const ch of line) {
        if (ch === '"') {
          inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      fields.push(current.trim());

      const [recipient = '', amount = '', token = 'native', chain = '', memo = ''] = fields;
      const errors: string[] = [];

      if (!recipient) errors.push('Missing recipient');
      else if (!recipient.startsWith('0x') && !recipient.startsWith('UQ') && !recipient.startsWith('EQ')) {
        errors.push('Invalid address format');
      }
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) errors.push('Invalid amount');
      if (token && !validTokens.includes(token.toLowerCase())) errors.push(`Invalid token "${token}"`);
      if (chain && !validChains.includes(chain.toLowerCase())) errors.push(`Invalid chain "${chain}"`);

      return {
        recipient,
        amount,
        token: token || 'native',
        chain,
        memo,
        valid: errors.length === 0,
        errors,
      };
    });
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    setError(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setError('Please upload a .csv or .txt file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvText(text);
      setError(null);
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePreview = () => {
    if (!csvText.trim()) {
      setError('Please paste CSV data or upload a file');
      return;
    }

    const rows = parseCSV(csvText);
    if (rows.length === 0) {
      setError('No data rows found in CSV');
      return;
    }

    if (rows.length > 20) {
      setError(`Maximum 20 tips per import (found ${rows.length})`);
      return;
    }

    setParsedRows(rows);
    setError(null);
    setStage('preview');
  };

  const handleExecute = async () => {
    setExecuting(true);
    setStage('executing');
    setProgress(0);

    try {
      // Simulate progress as tips execute
      const progressInterval = window.setInterval(() => {
        setProgress((prev) => Math.min(prev + (100 / (parsedRows.length * 3)), 95));
      }, 500);

      const importResult = await api.importCSV(csvText);
      clearInterval(progressInterval);
      setProgress(100);
      setResult(importResult);
      setStage('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStage('preview');
    } finally {
      setExecuting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tipflow-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setCsvText('');
    setParsedRows([]);
    setResult(null);
    setError(null);
    setProgress(0);
    setStage('input');
  };

  const validCount = useMemo(() => parsedRows.filter((r) => r.valid).length, [parsedRows]);
  const invalidCount = useMemo(() => parsedRows.filter((r) => !r.valid).length, [parsedRows]);

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="w-4 h-4 text-accent" />
        <h2 className="text-base font-semibold text-text-primary">Batch Import</h2>
        <span className="text-[10px] text-text-muted ml-auto px-2 py-0.5 rounded-full bg-surface-3">
          CSV
        </span>
      </div>

      {/* Input Stage */}
      {stage === 'input' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text-secondary hover:text-accent hover:border-accent-border transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text-secondary hover:text-accent hover:border-accent-border transition-colors cursor-pointer">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Upload CSV
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-1.5">
              Paste CSV Data
            </label>
            <textarea
              value={csvText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`recipient,amount,token,chain,memo\n0x742d...5f2bD18,0.001,native,ethereum-sepolia,Great work!`}
              rows={6}
              className="w-full px-3 py-2.5 rounded-lg bg-surface-2 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors font-mono resize-y"
            />
            <p className="text-[10px] text-text-muted mt-1">
              Format: recipient,amount,token,chain,memo (max 20 rows)
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
              <AlertTriangle className="w-4 h-4 text-error mt-0.5 shrink-0" />
              <p className="text-xs text-error">{error}</p>
            </div>
          )}

          <button
            onClick={handlePreview}
            disabled={!csvText.trim()}
            className="w-full py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Import
          </button>
        </div>
      )}

      {/* Preview Stage */}
      {stage === 'preview' && (
        <div className="space-y-3">
          {/* Summary badges */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-3 text-[10px] text-text-secondary">
              {parsedRows.length} total
            </span>
            {validCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400">
                <CheckCircle2 className="w-3 h-3" />
                {validCount} valid
              </span>
            )}
            {invalidCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
                <XCircle className="w-3 h-3" />
                {invalidCount} invalid
              </span>
            )}
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-text-muted font-medium">#</th>
                  <th className="text-left py-2 px-2 text-text-muted font-medium">Recipient</th>
                  <th className="text-right py-2 px-2 text-text-muted font-medium">Amount</th>
                  <th className="text-left py-2 px-2 text-text-muted font-medium">Token</th>
                  <th className="text-left py-2 px-2 text-text-muted font-medium">Chain</th>
                  <th className="text-left py-2 px-2 text-text-muted font-medium">Memo</th>
                  <th className="text-center py-2 px-2 text-text-muted font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b border-border/50 ${
                      row.valid ? '' : 'bg-red-500/5'
                    }`}
                  >
                    <td className="py-2 px-2 text-text-muted">{idx + 1}</td>
                    <td className="py-2 px-2 font-mono text-text-secondary truncate max-w-[120px]" title={row.recipient}>
                      {row.recipient ? `${row.recipient.slice(0, 6)}...${row.recipient.slice(-4)}` : '-'}
                    </td>
                    <td className="py-2 px-2 text-right text-text-primary font-medium">{row.amount || '-'}</td>
                    <td className="py-2 px-2 text-text-secondary uppercase">{row.token}</td>
                    <td className="py-2 px-2 text-text-secondary">{row.chain || 'auto'}</td>
                    <td className="py-2 px-2 text-text-muted truncate max-w-[100px]" title={row.memo}>
                      {row.memo || '-'}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {row.valid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mx-auto" />
                      ) : (
                        <div className="flex items-center justify-center" title={row.errors.join(', ')}>
                          <XCircle className="w-3.5 h-3.5 text-red-400" />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Error details for invalid rows */}
          {invalidCount > 0 && (
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/15 space-y-1">
              <p className="text-[11px] font-medium text-red-400">Validation Errors:</p>
              {parsedRows
                .filter((r) => !r.valid)
                .map((r, i) => (
                  <p key={i} className="text-[10px] text-red-400/80">
                    Row {parsedRows.indexOf(r) + 1}: {r.errors.join(', ')}
                  </p>
                ))}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
              <AlertTriangle className="w-4 h-4 text-error mt-0.5 shrink-0" />
              <p className="text-xs text-error">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleExecute}
              disabled={validCount === 0}
              className="flex-1 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              Execute {validCount} Tip{validCount !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {/* Executing Stage */}
      {stage === 'executing' && (
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 text-accent animate-spin" />
            <span className="text-sm text-text-primary font-medium">
              Executing {parsedRows.length} tips...
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-surface-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs text-text-muted text-center">
            {Math.round(progress)}% complete - please wait
          </p>
        </div>
      )}

      {/* Results Stage */}
      {stage === 'results' && result && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-surface-2 border border-border text-center">
              <p className="text-lg font-bold text-text-primary">{result.total}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wider">Total</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
              <p className="text-lg font-bold text-green-400">{result.success}</p>
              <p className="text-[10px] text-green-400/70 uppercase tracking-wider">Success</p>
            </div>
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
              <p className="text-lg font-bold text-red-400">{result.failed}</p>
              <p className="text-[10px] text-red-400/70 uppercase tracking-wider">Failed</p>
            </div>
          </div>

          {/* Results list */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {result.results.map((r, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${
                  r.status === 'success'
                    ? 'bg-green-500/5 border-green-500/15'
                    : 'bg-red-500/5 border-red-500/15'
                }`}
              >
                {r.status === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-text-primary">{r.amount}</span>
                    <span className="text-text-muted">to</span>
                    <span className="font-mono text-text-secondary truncate">
                      {r.recipient.slice(0, 6)}...{r.recipient.slice(-4)}
                    </span>
                  </div>
                  {r.txHash && (
                    <p className="text-[10px] text-text-muted font-mono truncate mt-0.5">
                      TX: {r.txHash}
                    </p>
                  )}
                  {r.error && (
                    <p className="text-[10px] text-red-400 mt-0.5">{r.error}</p>
                  )}
                  {r.memo && (
                    <p className="text-[10px] text-text-muted mt-0.5 italic">
                      Memo: {r.memo}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleReset}
            className="w-full py-2.5 rounded-lg bg-surface-2 border border-border text-sm text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2"
          >
            Import More
          </button>
        </div>
      )}
    </div>
  );
}
