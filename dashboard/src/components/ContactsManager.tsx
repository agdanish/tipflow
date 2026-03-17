import { useState, useEffect, useCallback, useRef } from 'react';
import { Users, Plus, Trash2, Loader2, Search, Download, Upload, Edit3, Check, X, Copy, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../lib/api';
import type { Contact, ContactImportResult } from '../types';

const DEFAULT_GROUPS = ['Team', 'Friends', 'VIPs', 'Community'];

export function ContactsManager() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(true);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAddress, setAddAddress] = useState('');
  const [addGroup, setAddGroup] = useState('');
  const [addNewGroup, setAddNewGroup] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState('');

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState<Array<{ name: string; address: string; group?: string }>>([]);
  const [importResult, setImportResult] = useState<ContactImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      const { contacts: c } = await api.getContacts(activeGroup ?? undefined);
      setContacts(c);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, [activeGroup]);

  const fetchGroups = useCallback(async () => {
    try {
      const { groups: g } = await api.getContactGroups();
      setGroups(g);
    } catch {
      // keep existing
    }
  }, []);

  useEffect(() => {
    fetchContacts();
    fetchGroups();
  }, [fetchContacts, fetchGroups]);

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q);
  });

  const handleAdd = async () => {
    const name = addName.trim();
    const address = addAddress.trim();
    const group = addNewGroup.trim() || addGroup || undefined;
    if (!name || !address) return;
    setSaving(true);
    try {
      await api.addContact(name, address, undefined, group);
      setAddName('');
      setAddAddress('');
      setAddGroup('');
      setAddNewGroup('');
      setShowAddForm(false);
      fetchContacts();
      fetchGroups();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.updateContact(id, { name: editName || undefined, group: editGroup });
      setEditId(null);
      fetchContacts();
      fetchGroups();
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteContact(id);
      setDeleteId(null);
      fetchContacts();
    } catch {
      // ignore
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.exportContacts();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'tipflow-contacts.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      // ignore
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const arr = Array.isArray(parsed) ? parsed : [];
        setImportData(arr);
        setShowImport(true);
        setImportResult(null);
      } catch {
        setImportData([]);
        setShowImport(true);
        setImportResult({ added: 0, skipped: 0, errors: ['Invalid JSON file'] });
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (importData.length === 0) return;
    setImporting(true);
    try {
      const result = await api.importContacts(importData);
      setImportResult(result);
      fetchContacts();
      fetchGroups();
    } catch {
      setImportResult({ added: 0, skipped: 0, errors: ['Import request failed'] });
    } finally {
      setImporting(false);
    }
  };

  const copyAddress = (id: string, address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const truncateAddress = (addr: string) =>
    addr.length > 16 ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : addr;

  const allGroups = Array.from(new Set([...DEFAULT_GROUPS, ...groups])).sort();

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-2/50 transition-colors"
      >
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          Contacts
          <span className="text-xs font-normal text-text-muted">({contacts.length})</span>
        </h2>
        {collapsed ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronUp className="w-4 h-4 text-text-muted" />}
      </button>

      {!collapsed && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4">
          {/* Search + Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border transition-colors"
              />
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent/15 text-accent text-xs font-medium hover:bg-accent/25 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-secondary text-xs font-medium hover:bg-surface-3 transition-colors"
                title="Export contacts"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-2 border border-border text-text-secondary text-xs font-medium hover:bg-surface-3 transition-colors cursor-pointer" title="Import contacts">
                <Upload className="w-3.5 h-3.5" />
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
              </label>
            </div>
          </div>

          {/* Group tabs */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveGroup(null)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                activeGroup === null
                  ? 'bg-accent text-white'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary border border-border'
              }`}
            >
              All
            </button>
            {allGroups.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  activeGroup === g
                    ? 'bg-accent text-white'
                    : 'bg-surface-2 text-text-secondary hover:text-text-primary border border-border'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Add Contact Form */}
          {showAddForm && (
            <div className="rounded-lg border border-accent-border/30 bg-accent/5 p-3 space-y-2">
              <p className="text-xs font-medium text-text-primary">New Contact</p>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="Name"
                className="w-full px-3 py-1.5 rounded-md bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border"
              />
              <input
                type="text"
                value={addAddress}
                onChange={(e) => setAddAddress(e.target.value)}
                placeholder="Wallet address"
                className="w-full px-3 py-1.5 rounded-md bg-surface-2 border border-border text-sm text-text-primary font-mono text-xs placeholder:text-text-muted placeholder:font-sans focus:outline-none focus:border-accent-border"
              />
              <div className="flex gap-2">
                <select
                  value={addGroup}
                  onChange={(e) => { setAddGroup(e.target.value); setAddNewGroup(''); }}
                  className="flex-1 px-3 py-1.5 rounded-md bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border"
                >
                  <option value="">No group</option>
                  {allGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                  <option value="__new__">+ New group...</option>
                </select>
                {addGroup === '__new__' && (
                  <input
                    type="text"
                    value={addNewGroup}
                    onChange={(e) => setAddNewGroup(e.target.value)}
                    placeholder="Group name"
                    className="flex-1 px-3 py-1.5 rounded-md bg-surface-2 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border"
                  />
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-md text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!addName.trim() || !addAddress.trim() || saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium disabled:opacity-50 transition-opacity"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Import Preview */}
          {showImport && (
            <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-text-primary">Import Preview</p>
                <button onClick={() => { setShowImport(false); setImportData([]); setImportResult(null); }} className="p-1 text-text-muted hover:text-text-primary"><X className="w-3.5 h-3.5" /></button>
              </div>
              {importResult ? (
                <div className="text-xs space-y-1">
                  <p className="text-green-400">{importResult.added} added</p>
                  {importResult.skipped > 0 && <p className="text-amber-400">{importResult.skipped} skipped (duplicates)</p>}
                  {importResult.errors.length > 0 && (
                    <div className="text-red-400">
                      {importResult.errors.map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="text-xs text-text-secondary">{importData.length} contacts found in file</p>
                  {importData.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importData.slice(0, 10).map((c, i) => (
                        <div key={i} className="text-[11px] text-text-secondary flex gap-2">
                          <span className="font-medium text-text-primary">{c.name}</span>
                          <span className="font-mono text-text-muted">{truncateAddress(c.address || '')}</span>
                          {c.group && <span className="text-cyan-400">{c.group}</span>}
                        </div>
                      ))}
                      {importData.length > 10 && <p className="text-[11px] text-text-muted">...and {importData.length - 10} more</p>}
                    </div>
                  )}
                  <button
                    onClick={handleImport}
                    disabled={importData.length === 0 || importing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500 text-white text-xs font-medium disabled:opacity-50 transition-opacity"
                  >
                    {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Import {importData.length} contacts
                  </button>
                </>
              )}
            </div>
          )}

          {/* Contact list */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-text-muted" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-sm text-text-muted">
                {contacts.length === 0 ? 'No contacts yet' : 'No matching contacts'}
              </p>
              {contacts.length === 0 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 text-xs text-accent hover:underline"
                >
                  Add your first contact
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((contact) => (
                <div key={contact.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-2/50 border border-border/50 hover:border-border transition-colors group">
                  {editId === contact.id ? (
                    /* Edit mode */
                    <div className="flex-1 space-y-1.5">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-surface-2 border border-border text-sm text-text-primary focus:outline-none focus:border-accent-border"
                      />
                      <select
                        value={editGroup}
                        onChange={(e) => setEditGroup(e.target.value)}
                        className="w-full px-2 py-1 rounded bg-surface-2 border border-border text-xs text-text-primary focus:outline-none focus:border-accent-border"
                      >
                        <option value="">No group</option>
                        {allGroups.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => setEditId(null)} className="p-1 text-text-muted hover:text-text-primary"><X className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleUpdate(contact.id)} className="p-1 text-green-400 hover:text-green-300"><Check className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-text-primary">{contact.name}</span>
                          {contact.group && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-medium text-cyan-400">
                              <Tag className="w-2.5 h-2.5" />
                              {contact.group}
                            </span>
                          )}
                          {contact.tipCount > 0 && (
                            <span className="text-[10px] text-text-muted">{contact.tipCount} tips</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-text-muted">{truncateAddress(contact.address)}</span>
                          <button
                            onClick={() => copyAddress(contact.id, contact.address)}
                            className="p-0.5 text-text-muted hover:text-text-primary transition-colors"
                            title="Copy address"
                          >
                            {copiedId === contact.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditId(contact.id); setEditName(contact.name); setEditGroup(contact.group || ''); }}
                          className="p-1.5 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-3 transition-colors"
                          title="Edit contact"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {deleteId === contact.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDelete(contact.id)} className="p-1.5 rounded-md text-red-400 hover:bg-red-500/10 transition-colors" title="Confirm delete">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteId(null)} className="p-1.5 rounded-md text-text-muted hover:text-text-primary transition-colors" title="Cancel">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteId(contact.id)}
                            className="p-1.5 rounded-md text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
