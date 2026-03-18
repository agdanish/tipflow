import { useState } from 'react';
import { Download, FileJson, FileText, FileSpreadsheet, FileBarChart, Check } from 'lucide-react';
import { api } from '../lib/api';

interface ExportPanelProps {
  historyCount: number;
}

type ExportFormat = 'csv' | 'json' | 'markdown' | 'summary';

interface FormatOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: typeof FileSpreadsheet;
  color: string;
  extension: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    format: 'csv',
    label: 'CSV',
    description: 'Spreadsheet format',
    icon: FileSpreadsheet,
    color: 'text-green-400',
    extension: '.csv',
  },
  {
    format: 'json',
    label: 'JSON',
    description: 'Structured data',
    icon: FileJson,
    color: 'text-amber-400',
    extension: '.json',
  },
  {
    format: 'markdown',
    label: 'Markdown',
    description: 'Table format',
    icon: FileText,
    color: 'text-blue-400',
    extension: '.md',
  },
  {
    format: 'summary',
    label: 'Summary',
    description: 'Text report',
    icon: FileBarChart,
    color: 'text-purple-400',
    extension: '.txt',
  },
];

/** Rough size estimate per record by format */
function estimateSize(count: number, format: ExportFormat): string {
  const perRecord: Record<ExportFormat, number> = {
    csv: 200,
    json: 350,
    markdown: 150,
    summary: 80,
  };
  // summary has a fixed overhead
  const base = format === 'summary' ? 600 : 100;
  const bytes = base + count * perRecord[format];
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ExportPanel({ historyCount }: ExportPanelProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [lastExport, setLastExport] = useState<{ format: ExportFormat; time: string } | null>(null);
  const [justExported, setJustExported] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    if (exporting) return;
    setExporting(format);
    try {
      await api.exportHistory(format);
      setLastExport({ format, time: new Date().toISOString() });
      setJustExported(format);
      setTimeout(() => setJustExported(null), 2000);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <Download className="w-4 h-4 text-accent" />
        <h2 className="text-base font-semibold text-text-primary">Export History</h2>
        {historyCount > 0 && (
          <span className="text-xs text-text-muted font-normal ml-auto px-2 py-0.5 rounded-full bg-surface-3">
            {historyCount} record{historyCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {historyCount === 0 ? (
        <p className="text-xs text-text-muted py-4 text-center">
          No transactions to export yet
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            {FORMAT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = exporting === opt.format;
              const isDone = justExported === opt.format;

              return (
                <button
                  key={opt.format}
                  onClick={() => handleExport(opt.format)}
                  disabled={!!exporting}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left ${
                    isDone
                      ? 'border-green-500/30 bg-green-500/5'
                      : 'border-border bg-surface-2 hover:border-border-light hover:bg-surface-3'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className={`shrink-0 ${isDone ? 'text-green-400' : opt.color}`}>
                    {isDone ? (
                      <Check className="w-4 h-4" />
                    ) : isActive ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-text-primary leading-none">
                      {opt.label}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 leading-none">
                      {opt.description} &middot; ~{estimateSize(historyCount, opt.format)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {lastExport && (
            <p className="text-xs text-text-muted mt-2 text-center">
              Last export: {lastExport.format.toUpperCase()} at{' '}
              {new Date(lastExport.time).toLocaleTimeString()}
            </p>
          )}
        </>
      )}
    </div>
  );
}
