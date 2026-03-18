// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, XCircle, Shield, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { Skeleton } from './Skeleton';

interface Attestation {
  id: string;
  viewer: string;
  creator: string;
  platform: string;
  engagement: { watchPercent: number; engagementScore: number; sessionDurationSec: number };
  tip: { amount: string; token: string; txHash: string };
  proof: { payloadHash: string; signature: string };
  verified: boolean;
  attestedAt: string;
}

interface PoEStats {
  totalAttestations: number;
  verifiedCount: number;
  uniqueViewers: number;
  uniqueCreators: number;
  totalEngagementMinutes: number;
  avgEngagementScore: number;
  totalTipVolume: number;
}

export function ProofOfEngagementPanel() {
  const [attestations, setAttestations] = useState<Attestation[]>([]);
  const [stats, setStats] = useState<PoEStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ id: string; valid: boolean } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await api.poeList() as { attestations: Attestation[]; stats: PoEStats };
      setAttestations(data.attestations ?? []);
      setStats(data.stats ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attestations');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const verify = async (id: string) => {
    setVerifyingId(id);
    try {
      const result = await api.poeVerify(id) as { valid: boolean };
      setVerifyResult({ id, valid: result.valid });
      setTimeout(() => setVerifyResult(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
    setVerifyingId(null);
  };

  if (loading) return (
    <div className="space-y-3">
      <Skeleton variant="text-line" width="180px" height="16px" />
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <Skeleton key={i} variant="card" height="50px" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-indigo-400" />
          Proof-of-Engagement
        </h3>
        <button onClick={load} aria-label="Refresh attestations" className="text-[10px] text-text-muted hover:text-accent transition-colors flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <p className="text-[10px] text-text-secondary">
        WDK-signed cryptographic attestations proving real viewer engagement. Unforgeable — verified onchain.
      </p>

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ['Proofs', stats.totalAttestations],
            ['Verified', `${stats.verifiedCount}`],
            ['Viewers', stats.uniqueViewers],
            ['Volume', `$${stats.totalTipVolume.toFixed(4)}`],
          ].map(([label, value], i) => (
            <div key={label as string} className="p-2 rounded-lg bg-surface-2 border border-border text-center animate-list-item-in" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="text-sm font-bold text-text-primary tabular-nums">{value as string}</div>
              <div className="text-[9px] text-text-muted">{label as string}</div>
            </div>
          ))}
        </div>
      )}

      {/* Attestations */}
      {!error && attestations.length > 0 ? (
        <div className="space-y-2">
          {attestations.slice(0, 5).map((att, i) => (
            <div key={att.id} className="p-2.5 rounded-lg bg-surface-2 border border-border card-hover animate-list-item-in" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] text-text-primary font-mono">{att.proof.payloadHash.slice(0, 16)}...</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {verifyResult?.id === att.id ? (
                    verifyResult.valid ? (
                      <span className="text-[10px] text-green-400 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Valid</span>
                    ) : (
                      <span className="text-[10px] text-red-400 flex items-center gap-0.5"><XCircle className="w-3 h-3" /> Invalid</span>
                    )
                  ) : (
                    <button
                      onClick={() => verify(att.id)}
                      disabled={verifyingId === att.id}
                      aria-label="Verify engagement proof"
                      className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors btn-press disabled:opacity-50"
                    >
                      {verifyingId === att.id ? '...' : 'Verify'}
                    </button>
                  )}
                  {att.verified && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div>
                  <span className="text-text-muted">Watch: </span>
                  <span className="text-text-primary tabular-nums">{att.engagement.watchPercent}%</span>
                </div>
                <div>
                  <span className="text-text-muted">Score: </span>
                  <span className="text-text-primary tabular-nums">{(att.engagement.engagementScore * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-text-muted">Tip: </span>
                  <span className="text-accent tabular-nums">{att.tip.amount} {att.tip.token.toUpperCase()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !error ? (
        <div className="text-center py-4">
          <Fingerprint className="w-6 h-6 text-text-muted/30 mx-auto mb-1" />
          <p className="text-[10px] text-text-muted">No attestations yet. Tips with engagement data generate PoE proofs.</p>
        </div>
      ) : null}

      <div className="p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[9px] text-text-muted">
        <Fingerprint className="w-3 h-3 text-indigo-400 inline mr-1" />
        Each attestation is signed with the viewer&apos;s WDK wallet key — unforgeable proof of real engagement
      </div>
    </div>
  );
}
