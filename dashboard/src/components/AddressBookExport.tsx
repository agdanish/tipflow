import { useState } from 'react';
import { Download, Upload, FileSpreadsheet, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { Contact, ContactImportResult } from '../types';

/**
 * AddressBookExport — compact export/import panel for contacts.
 * Supports CSV and JSON export, plus CSV paste-to-import with preview.
 */
export function AddressBookExport() {
  const [exporting, setExporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvInput, setCsvInput] = useState('');
  const [previewRows, setPreviewRows] = useState<Array<{ name: string; address: string; group?: string }>>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ContactImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Export as CSV
  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const contacts: Contact[] = await api.exportContacts();
      const header = 'name,address,group,tipCount';
      const rows = contacts.map((c) => {
        const name = escapeCsvField(c.name);
        const address = escapeCsvField(c.address);
        const group = escapeCsvField(c.group ?? '');
        return `${name},${address},${group},${c.tipCount}`;
      });
      const csv = [header, ...rows].join('\n');
      downloadText(csv, 'tipflow-contacts.csv', 'text/csv');
    } catch {
      setError('Failed to export contacts');
      setTimeout(() => setError(null), 3000);
    } finally {
      setExporting(false);
    }
  };

  // Export as JSON
  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const contacts = await api.exportContacts();
      const json = JSON.stringify(contacts, null, 2);
      downloadText(json, 'tipflow-contacts.json', 'application/json');
    } catch {
      setError('Failed to export contacts');
      setTimeout(() => setError(null), 3000);
    } finally {
      setExporting(false);
    }
  };

  // Parse CSV input for preview
  const handleCsvChange = (text: string) => {
    setCsvInput(text);
    setImportResult(null);
    setError(null);
    if (!text.trim()) {
      setPreviewRows([]);
      return;
    }
    try {
      const rows = parseCsvRows(text.trim());
      setPreviewRows(rows);
    } catch {
      setPreviewRows([]);
      setError('Invalid CSV format');
    }
  };

  // Import parsed CSV rows
  const handleImport = async () => {
    if (previewRows.length === 0) return;
    setImporting(true);
    setError(null);
    try {
      const result = await api.importContacts(previewRows);
      setImportResult(result);
      if (result.added > 0) {
        setCsvInput('');
        setPreviewRows([]);
      }
    } catch {
      setError('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Export buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-secondary text-xs font-medium hover:bg-surface-3 hover:text-text-primary transition-colors disabled:opacity-50"
          title="Export contacts as CSV"
        >
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
          Export CSV
        </button>
        <button
          onClick={handleExportJSON}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-secondary text-xs font-medium hover:bg-surface-3 hover:text-text-primary transition-colors disabled:opacity-50"
          title="Export contacts as JSON"
        >
          <Download className="w-3.5 h-3.5" />
          Export JSON
        </button>
        <button
          onClick={() => { setShowImport(!showImport); setImportResult(null); setError(null); }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
            showImport
              ? 'bg-accent/15 border-accent-border text-accent'
              : 'bg-surface-2 border-border text-text-secondary hover:bg-surface-3 hover:text-text-primary'
          }`}
          title="Import contacts from CSV"
        >
          <Upload className="w-3.5 h-3.5" />
          Import CSV
        </button>
      </div>

      {/* Import area */}
      {showImport && (
        <div className="rounded-lg border border-accent-border/30 bg-accent/5 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-primary">Paste CSV Data</p>
            <button
              onClick={() => { setShowImport(false); setCsvInput(''); setPreviewRows([]); setImportResult(null); }}
              className="p-1 text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-text-muted">
            Format: <code className="px-1 py-0.5 rounded bg-surface-3 text-text-secondary">name,address,group</code> (one per line, header optional)
          </p>
          <textarea
            value={csvInput}
            onChange={(e) => handleCsvChange(e.target.value)}
            placeholder={`Alice,0x1234...abcd,Team\nBob,EQ1234...xyz,Friends`}
            rows={4}
            className="w-full px-3 py-2 rounded-md bg-surface-2 border border-border text-xs text-text-primary font-mono placeholder:text-text-muted placeholder:font-sans focus:outline-none focus:border-accent-border focus:ring-1 focus:ring-accent-border transition-colors resize-y"
          />

          {/* Preview */}
          {previewRows.length > 0 && !importResult && (
            <div className="space-y-1.5">
              <p className="text-sm text-text-secondary">{previewRows.length} contacts parsed:</p>
              <div className="max-h-28 overflow-y-auto space-y-0.5">
                {previewRows.slice(0, 8).map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-text-primary font-medium truncate max-w-[100px]">{r.name}</span>
                    <span className="text-text-muted font-mono truncate flex-1">{truncateAddr(r.address)}</span>
                    {r.group && <span className="text-cyan-400 text-xs shrink-0">{r.group}</span>}
                  </div>
                ))}
                {previewRows.length > 8 && (
                  <p className="text-xs text-text-muted">...and {previewRows.length - 8} more</p>
                )}
              </div>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium disabled:opacity-50 transition-opacity"
              >
                {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                Import {previewRows.length} Contacts
              </button>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div className="text-xs space-y-1">
              {importResult.added > 0 && (
                <p className="flex items-center gap-1 text-green-400">
                  <Check className="w-3 h-3" />
                  {importResult.added} contacts added
                </p>
              )}
              {importResult.skipped > 0 && (
                <p className="text-amber-400">{importResult.skipped} skipped (duplicates)</p>
              )}
              {importResult.errors.length > 0 && (
                <div className="text-red-400">
                  {importResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadText(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

function truncateAddr(addr: string): string {
  return addr.length > 16 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;
}

/**
 * Parse CSV text into contact rows.
 * Skips a header row if the first field is "name" (case-insensitive).
 */
function parseCsvRows(text: string): Array<{ name: string; address: string; group?: string }> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const result: Array<{ name: string; address: string; group?: string }> = [];
  let startIndex = 0;

  // Detect header
  const firstFields = splitCsvLine(lines[0]);
  if (firstFields[0]?.toLowerCase() === 'name') {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const fields = splitCsvLine(lines[i]);
    const name = fields[0]?.trim();
    const address = fields[1]?.trim();
    if (!name || !address) continue;
    const group = fields[2]?.trim() || undefined;
    result.push({ name, address, group });
  }

  return result;
}

/** Simple CSV line splitter that handles quoted fields */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}
