import { useState, useEffect, useMemo } from 'react';
import { BookOpen, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { api } from '../lib/api';

/* ── Tiny helpers ────────────────────────────────────────────── */

const METHOD_COLORS: Record<string, string> = {
  get: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  post: 'bg-green-500/15 text-green-400 border-green-500/30',
  put: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  delete: 'bg-red-500/15 text-red-400 border-red-500/30',
  patch: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

interface SchemaObj {
  type?: string;
  properties?: Record<string, SchemaObj>;
  items?: SchemaObj;
  $ref?: string;
  required?: string[];
  enum?: string[];
  format?: string;
  description?: string;
  default?: unknown;
  example?: unknown;
  minimum?: number;
  maximum?: number;
  maxItems?: number;
  additionalProperties?: SchemaObj | boolean;
}

interface ParameterObj {
  name: string;
  in: string;
  required?: boolean;
  schema?: SchemaObj;
  description?: string;
}

interface EndpointInfo {
  method: string;
  path: string;
  tags: string[];
  summary: string;
  description: string;
  parameters?: ParameterObj[];
  requestBody?: {
    required?: boolean;
    content?: Record<string, { schema?: SchemaObj }>;
  };
  responses?: Record<string, { description?: string; content?: Record<string, { schema?: SchemaObj }> }>;
}

/* ── Schema renderer ────────────────────────────────────────── */

function resolveRef(ref: string, spec: Record<string, unknown>): SchemaObj | undefined {
  // "#/components/schemas/Foo" -> spec.components.schemas.Foo
  const parts = ref.replace(/^#\//, '').split('/');
  let cur: unknown = spec;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur as SchemaObj;
}

function SchemaView({ schema, spec, depth = 0 }: { schema: SchemaObj; spec: Record<string, unknown>; depth?: number }) {
  if (!schema) return null;

  const resolved = schema.$ref ? resolveRef(schema.$ref, spec) : schema;
  if (!resolved) return <span className="text-text-muted text-xs italic">unresolved ref</span>;

  if (resolved.type === 'object' && resolved.properties) {
    const req = new Set(resolved.required ?? []);
    return (
      <div className={`${depth > 0 ? 'ml-3 pl-3 border-l border-border' : ''}`}>
        {Object.entries(resolved.properties).map(([key, val]) => {
          const innerResolved = val.$ref ? resolveRef(val.$ref, spec) : val;
          return (
            <div key={key} className="py-0.5">
              <span className="font-mono text-xs text-accent">{key}</span>
              {req.has(key) && <span className="text-red-400 text-xs ml-1">*</span>}
              <span className="text-text-muted text-xs ml-1.5">
                {innerResolved?.type ?? 'object'}
                {innerResolved?.enum && ` [${innerResolved.enum.join(' | ')}]`}
                {innerResolved?.format && ` (${innerResolved.format})`}
              </span>
              {(innerResolved?.description || val.description) && (
                <span className="text-text-muted text-xs ml-2">
                  &mdash; {innerResolved?.description ?? val.description}
                </span>
              )}
              {innerResolved?.type === 'object' && innerResolved.properties && (
                <SchemaView schema={innerResolved} spec={spec} depth={depth + 1} />
              )}
              {innerResolved?.type === 'array' && innerResolved.items && (
                <div className="ml-3 pl-3 border-l border-border">
                  <span className="text-text-muted text-xs">items:</span>
                  <SchemaView schema={innerResolved.items} spec={spec} depth={depth + 1} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (resolved.type === 'array' && resolved.items) {
    return (
      <div className={`${depth > 0 ? 'ml-3 pl-3 border-l border-border' : ''}`}>
        <span className="text-text-muted text-xs">array of:</span>
        <SchemaView schema={resolved.items} spec={spec} depth={depth + 1} />
      </div>
    );
  }

  return (
    <span className="text-text-muted text-xs">
      {resolved.type ?? 'any'}
      {resolved.enum && ` [${resolved.enum.join(' | ')}]`}
      {resolved.example !== undefined && ` e.g. ${JSON.stringify(resolved.example)}`}
    </span>
  );
}

/* ── Single endpoint row ────────────────────────────────────── */

function EndpointRow({ ep, spec }: { ep: EndpointInfo; spec: Record<string, unknown> }) {
  const [open, setOpen] = useState(false);

  const reqSchema = ep.requestBody?.content?.['application/json']?.schema;
  const firstResp = ep.responses ? Object.entries(ep.responses)[0] : undefined;
  const respSchema = firstResp?.[1]?.content?.['application/json']?.schema;

  return (
    <div className="border border-border rounded-lg overflow-hidden mb-1.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-2 transition-colors"
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
        )}
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold uppercase border shrink-0 ${
            METHOD_COLORS[ep.method] ?? 'bg-surface-2 text-text-secondary border-border'
          }`}
        >
          {ep.method}
        </span>
        <span className="font-mono text-xs text-text-primary truncate">{ep.path}</span>
        <span className="text-sm text-text-muted ml-auto truncate max-w-[45%] text-right hidden sm:inline">
          {ep.summary}
        </span>
      </button>

      {open && (
        <div className="px-4 py-3 bg-surface-2/50 border-t border-border space-y-3">
          {ep.description && (
            <p className="text-xs text-text-secondary">{ep.description}</p>
          )}

          {ep.parameters && ep.parameters.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Parameters</h4>
              <div className="space-y-0.5">
                {ep.parameters.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-accent">{p.name}</span>
                    <span className="text-text-muted text-xs">({p.in})</span>
                    {p.required && <span className="text-red-400 text-xs">required</span>}
                    {p.schema?.type && <span className="text-text-muted text-xs">{p.schema.type}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {reqSchema && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Request Body</h4>
              <SchemaView schema={reqSchema} spec={spec} />
            </div>
          )}

          {firstResp && (
            <div>
              <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                Response {firstResp[0]}
                {firstResp[1].description && (
                  <span className="font-normal ml-1">&mdash; {firstResp[1].description}</span>
                )}
              </h4>
              {respSchema ? (
                <SchemaView schema={respSchema} spec={spec} />
              ) : (
                <span className="text-text-muted text-xs italic">No schema</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

export function ApiDocs() {
  const [spec, setSpec] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const [search, setSearch] = useState('');
  const [openTags, setOpenTags] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (collapsed) return;
    if (spec) return; // already fetched
    setLoading(true);
    api.getOpenApiSpec()
      .then((data) => {
        setSpec(data);
        setError(null);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [collapsed, spec]);

  // Parse endpoints grouped by tag
  const grouped = useMemo(() => {
    if (!spec) return new Map<string, EndpointInfo[]>();
    const paths = (spec.paths ?? {}) as Record<string, Record<string, Record<string, unknown>>>;
    const map = new Map<string, EndpointInfo[]>();

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, details] of Object.entries(methods)) {
        const d = details as Record<string, unknown>;
        const tags = (d.tags as string[]) ?? ['Other'];
        const ep: EndpointInfo = {
          method,
          path,
          tags,
          summary: (d.summary as string) ?? '',
          description: (d.description as string) ?? '',
          parameters: d.parameters as ParameterObj[] | undefined,
          requestBody: d.requestBody as EndpointInfo['requestBody'],
          responses: d.responses as EndpointInfo['responses'],
        };

        for (const tag of tags) {
          if (!map.has(tag)) map.set(tag, []);
          map.get(tag)!.push(ep);
        }
      }
    }
    return map;
  }, [spec]);

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.toLowerCase();
    const result = new Map<string, EndpointInfo[]>();
    for (const [tag, eps] of grouped) {
      const filtered = eps.filter(
        (ep) =>
          ep.path.toLowerCase().includes(q) ||
          ep.summary.toLowerCase().includes(q) ||
          ep.description.toLowerCase().includes(q) ||
          ep.method.toLowerCase().includes(q) ||
          tag.toLowerCase().includes(q),
      );
      if (filtered.length > 0) result.set(tag, filtered);
    }
    return result;
  }, [grouped, search]);

  const toggleTag = (tag: string) => {
    setOpenTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const totalEndpoints = useMemo(() => {
    let count = 0;
    for (const eps of grouped.values()) count += eps.length;
    return count;
  }, [grouped]);

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-2 p-4 hover:bg-surface-2 transition-colors"
      >
        <div className="p-1.5 rounded-lg bg-blue-500/10">
          <BookOpen className="w-4 h-4 text-blue-400" />
        </div>
        <h3 className="text-sm font-medium text-text-secondary">API Documentation</h3>
        {totalEndpoints > 0 && (
          <span className="text-xs text-text-muted ml-1">({totalEndpoints} endpoints)</span>
        )}
        <span className="ml-auto">
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-muted" />
          )}
        </span>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-3">
          {loading && <p className="text-xs text-text-muted animate-pulse">Loading API spec...</p>}
          {error && <p className="text-xs text-red-400">Failed to load: {error}</p>}

          {spec && (
            <>
              {/* Info line */}
              <p className="text-sm text-text-muted">
                {(spec.info as Record<string, unknown>)?.title as string ?? 'API'}{' '}
                v{(spec.info as Record<string, unknown>)?.version as string ?? '?'} &mdash;{' '}
                {(spec.info as Record<string, unknown>)?.description as string ?? ''}
              </p>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                <input
                  type="text"
                  placeholder="Filter endpoints..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-border"
                />
              </div>

              {/* Tag groups */}
              {[...filteredGroups.entries()].map(([tag, endpoints]) => (
                <div key={tag}>
                  <button
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {openTags.has(tag) ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    {tag}
                    <span className="text-text-muted font-normal text-xs">({endpoints.length})</span>
                  </button>
                  {openTags.has(tag) && (
                    <div className="ml-1">
                      {endpoints.map((ep) => (
                        <EndpointRow key={`${ep.method}-${ep.path}`} ep={ep} spec={spec} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
