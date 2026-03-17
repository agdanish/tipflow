import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Flame,
  Users,
  DollarSign,
  Percent,
  Coins,
  RefreshCw,
} from 'lucide-react';
import { api } from '../lib/api';
import { shortenAddress, formatNumber } from '../lib/utils';
import type { AnalyticsData } from '../types';

// ---------------------------------------------------------------------------
// SVG Chart helpers
// ---------------------------------------------------------------------------

const CHART_COLORS = [
  '#22c55e', // green (accent)
  '#0098ea', // blue (TON)
  '#627eea', // indigo (ETH)
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
];

function getChainColor(chain: string): string {
  if (chain.includes('ethereum')) return '#627eea';
  if (chain.includes('ton')) return '#0098ea';
  return '#22c55e';
}

function getTokenColor(token: string): string {
  if (token === 'usdt') return '#26a17b';
  return '#627eea';
}

// ---------------------------------------------------------------------------
// SVG Bar Chart
// ---------------------------------------------------------------------------

function BarChart({
  data,
}: {
  data: Array<{ date: string; volume: number; count: number }>;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const maxVolume = Math.max(...data.map((d) => d.volume), 0.001);
  const barWidth = 100 / data.length;

  return (
    <div className="relative">
      <svg viewBox="0 0 400 200" className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1="0"
            y1={180 - pct * 160}
            x2="400"
            y2={180 - pct * 160}
            stroke="currentColor"
            className="text-border"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
        ))}

        {/* Bars */}
        {data.map((d, i) => {
          const height = maxVolume > 0 ? (d.volume / maxVolume) * 160 : 0;
          const x = i * (400 / data.length) + (400 / data.length) * 0.15;
          const w = (400 / data.length) * 0.7;
          const y = 180 - height;
          const isHovered = hovered === i;

          return (
            <g
              key={d.date}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={w}
                height={Math.max(height, 2)}
                rx="4"
                fill={isHovered ? '#34d399' : '#22c55e'}
                opacity={isHovered ? 1 : 0.8}
                className="transition-all duration-300"
              >
                <animate
                  attributeName="height"
                  from="0"
                  to={Math.max(height, 2).toString()}
                  dur="0.6s"
                  fill="freeze"
                />
                <animate
                  attributeName="y"
                  from="180"
                  to={y.toString()}
                  dur="0.6s"
                  fill="freeze"
                />
              </rect>

              {/* Date label */}
              <text
                x={x + w / 2}
                y="196"
                textAnchor="middle"
                className="fill-text-muted"
                fontSize="10"
              >
                {d.date.slice(5)}
              </text>

              {/* Hover tooltip */}
              {isHovered && (
                <g>
                  <rect
                    x={x + w / 2 - 50}
                    y={y - 38}
                    width="100"
                    height="30"
                    rx="6"
                    fill="var(--color-surface-3, #1e293b)"
                    stroke="var(--color-border, #334155)"
                    strokeWidth="1"
                  />
                  <text
                    x={x + w / 2}
                    y={y - 22}
                    textAnchor="middle"
                    className="fill-text-primary"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {formatNumber(d.volume)} ({d.count} tips)
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Donut Chart
// ---------------------------------------------------------------------------

function DonutChart({
  data,
  colorFn,
}: {
  data: Array<{ label: string; value: number; percentage: number }>;
  colorFn: (label: string) => string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = 70;
  const cx = 100;
  const cy = 100;
  const strokeWidth = 28;

  // Compute arcs
  let cumAngle = -90; // Start from top
  const arcs = data.map((d, i) => {
    const angle = total > 0 ? (d.value / total) * 360 : 0;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { ...d, startAngle, angle, index: i };
  });

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
    const start = polarToCartesian(cx, cy, r, endAngle + 90);
    const end = polarToCartesian(cx, cy, r, startAngle + 90);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  }

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 200 200" className="w-32 h-32 shrink-0">
        {total === 0 ? (
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-border"
            strokeWidth={strokeWidth}
          />
        ) : (
          arcs.map((arc) => {
            const clampedAngle = Math.max(arc.angle, 0.5);
            return (
              <path
                key={arc.label}
                d={describeArc(cx, cy, radius, arc.startAngle, arc.startAngle + clampedAngle)}
                fill="none"
                stroke={colorFn(arc.label)}
                strokeWidth={hovered === arc.index ? strokeWidth + 4 : strokeWidth}
                strokeLinecap="round"
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHovered(arc.index)}
                onMouseLeave={() => setHovered(null)}
                opacity={hovered !== null && hovered !== arc.index ? 0.4 : 1}
              >
                <animate
                  attributeName="stroke-dasharray"
                  from="0 1000"
                  to={`${(clampedAngle / 360) * 2 * Math.PI * radius} 1000`}
                  dur="0.8s"
                  fill="freeze"
                />
              </path>
            );
          })
        )}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-text-primary" fontSize="18" fontWeight="700">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-text-muted" fontSize="10">
          total
        </text>
      </svg>

      {/* Legend */}
      <div className="space-y-1.5 text-xs">
        {data.map((d, i) => (
          <div
            key={d.label}
            className={`flex items-center gap-2 transition-opacity ${hovered !== null && hovered !== i ? 'opacity-40' : ''}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: colorFn(d.label) }}
            />
            <span className="text-text-secondary capitalize">{d.label.replace(/-/g, ' ')}</span>
            <span className="text-text-muted ml-auto">{d.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Heatmap (24 hours)
// ---------------------------------------------------------------------------

function HourlyHeatmap({ data }: { data: Array<{ hour: number; count: number }> }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div>
      <svg viewBox="0 0 400 60" className="w-full" preserveAspectRatio="xMidYMid meet">
        {data.map((d) => {
          const intensity = maxCount > 0 ? d.count / maxCount : 0;
          const x = (d.hour / 24) * 380 + 10;
          const w = 380 / 24 - 2;
          const isHov = hovered === d.hour;

          return (
            <g
              key={d.hour}
              onMouseEnter={() => setHovered(d.hour)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <rect
                x={x}
                y={4}
                width={w}
                height={30}
                rx="3"
                fill={`rgba(34, 197, 94, ${Math.max(intensity, 0.08)})`}
                stroke={isHov ? '#22c55e' : 'transparent'}
                strokeWidth="1.5"
                className="transition-all duration-200"
              >
                <animate attributeName="opacity" from="0" to="1" dur="0.5s" fill="freeze" />
              </rect>

              {/* Hour label - show every 3 hours */}
              {d.hour % 3 === 0 && (
                <text
                  x={x + w / 2}
                  y="52"
                  textAnchor="middle"
                  className="fill-text-muted"
                  fontSize="8"
                >
                  {d.hour.toString().padStart(2, '0')}
                </text>
              )}

              {/* Hover tooltip */}
              {isHov && (
                <g>
                  <rect
                    x={Math.max(x - 20, 0)}
                    y={-14}
                    width="55"
                    height="18"
                    rx="4"
                    fill="var(--color-surface-3, #1e293b)"
                    stroke="var(--color-border, #334155)"
                    strokeWidth="1"
                  />
                  <text
                    x={Math.max(x - 20, 0) + 27.5}
                    y={-1}
                    textAnchor="middle"
                    className="fill-text-primary"
                    fontSize="9"
                    fontWeight="600"
                  >
                    {d.hour}:00 = {d.count}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Horizontal Bar Chart (Top Recipients)
// ---------------------------------------------------------------------------

function TopRecipientsChart({
  data,
}: {
  data: Array<{ address: string; count: number; volume: number }>;
}) {
  const maxVolume = Math.max(...data.map((d) => d.volume), 0.001);

  if (data.length === 0) {
    return (
      <p className="text-sm text-text-muted text-center py-4">No recipients yet</p>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((d, i) => {
        const pct = (d.volume / maxVolume) * 100;
        return (
          <div key={d.address} className="group">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-secondary font-mono">
                {shortenAddress(d.address, 6)}
              </span>
              <span className="text-text-muted">
                {formatNumber(d.volume)} ({d.count} tips)
              </span>
            </div>
            <div className="h-2 rounded-full bg-surface-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  animation: `barGrow 0.8s ease-out ${i * 0.1}s both`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3 flex items-center gap-3 hover:border-accent-border transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-surface-3 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted truncate">{label}</p>
        <p className="text-sm font-semibold text-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trend badge
// ---------------------------------------------------------------------------

function TrendBadge({ trend, thisWeek, lastWeek }: { trend: 'up' | 'down' | 'stable'; thisWeek: number; lastWeek: number }) {
  const pctChange = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;

  const config = {
    up: { icon: TrendingUp, text: 'Trending Up', cls: 'text-green-400 bg-green-500/10 border-green-500/20' },
    down: { icon: TrendingDown, text: 'Trending Down', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
    stable: { icon: Minus, text: 'Stable', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  }[trend];

  const TrendIcon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${config.cls}`}>
      <TrendIcon className="w-3.5 h-3.5" />
      {config.text}
      {pctChange !== 0 && (
        <span className="ml-1">
          {pctChange > 0 ? '+' : ''}{pctChange}%
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AnalyticsDashboard() {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAnalytics();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (expanded && !data) {
      fetchAnalytics();
    }
  }, [expanded, data, fetchAnalytics]);

  const chainDonutData = useMemo(() => {
    if (!data?.chainDist) return [];
    return data.chainDist.map((d) => ({
      label: d.chain,
      value: d.count,
      percentage: d.percentage,
    }));
  }, [data]);

  const tokenDonutData = useMemo(() => {
    if (!data?.tokenDist) return [];
    return data.tokenDist.map((d) => ({
      label: d.token,
      value: d.count,
      percentage: d.percentage,
    }));
  }, [data]);

  return (
    <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-2 transition-colors"
      >
        <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-accent" />
          Advanced Analytics
          {data && !expanded && (
            <span className="text-xs font-normal text-text-muted ml-2">
              {data.overview.totalTips} tips &middot; {formatNumber(data.overview.totalVolume)} volume
            </span>
          )}
        </h2>
        <div className="flex items-center gap-2">
          {expanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchAnalytics();
              }}
              className="p-1.5 rounded-md text-text-muted hover:text-accent hover:bg-surface-3 transition-colors"
              title="Refresh analytics"
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
        <div className="px-4 sm:px-5 pb-5 space-y-5">
          {loading && !data && (
            <div className="text-center py-10">
              <RefreshCw className="w-6 h-6 text-accent animate-spin mx-auto mb-2" />
              <p className="text-sm text-text-muted">Loading analytics...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-6">
              <p className="text-sm text-red-400 mb-2">{error}</p>
              <button
                onClick={fetchAnalytics}
                className="text-xs text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {data && (
            <>
              {/* Trend + Streak badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <TrendBadge
                  trend={data.recentTrend}
                  thisWeek={data.trends.tipsThisWeek}
                  lastWeek={data.trends.tipsLastWeek}
                />
                {data.streaks.current > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-orange-500/20 bg-orange-500/10 text-orange-400 text-xs font-medium">
                    <Flame className="w-3.5 h-3.5" />
                    {data.streaks.current} day streak
                    {data.streaks.longest > data.streaks.current && (
                      <span className="text-text-muted ml-1">(best: {data.streaks.longest})</span>
                    )}
                  </div>
                )}
              </div>

              {/* KPI overview row */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <KpiCard label="Total Tips" value={data.overview.totalTips.toString()} icon={Activity} color="text-accent" />
                <KpiCard label="Total Volume" value={formatNumber(data.overview.totalVolume)} icon={Coins} color="text-amber-400" />
                <KpiCard label="Success Rate" value={`${data.overview.successRate}%`} icon={Percent} color="text-blue-400" />
                <KpiCard label="Avg Fee" value={formatNumber(data.overview.avgFee, 6)} icon={DollarSign} color="text-purple-400" />
                <KpiCard label="Total Fees" value={formatNumber(data.overview.totalFees, 6)} icon={DollarSign} color="text-red-400" />
                <KpiCard label="Recipients" value={data.overview.uniqueRecipients.toString()} icon={Users} color="text-cyan-400" />
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Daily Volume Bar Chart */}
                <div className="rounded-lg border border-border bg-surface-2 p-4">
                  <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-accent" />
                    Daily Volume (Last 7 Days)
                  </h3>
                  <BarChart data={data.dailyVolume} />
                </div>

                {/* Chain Distribution Donut */}
                <div className="rounded-lg border border-border bg-surface-2 p-4">
                  <h3 className="text-sm font-medium text-text-primary mb-3">
                    Chain Distribution
                  </h3>
                  <DonutChart data={chainDonutData} colorFn={getChainColor} />
                </div>

                {/* Token Distribution Donut */}
                <div className="rounded-lg border border-border bg-surface-2 p-4">
                  <h3 className="text-sm font-medium text-text-primary mb-3">
                    Token Distribution
                  </h3>
                  <DonutChart data={tokenDonutData} colorFn={getTokenColor} />
                </div>

                {/* Top Recipients */}
                <div className="rounded-lg border border-border bg-surface-2 p-4">
                  <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    Top Recipients
                  </h3>
                  <TopRecipientsChart data={data.topRecipients} />
                </div>
              </div>

              {/* Hourly Heatmap (full width) */}
              <div className="rounded-lg border border-border bg-surface-2 p-4">
                <h3 className="text-sm font-medium text-text-primary mb-3">
                  Hourly Activity Heatmap
                </h3>
                <HourlyHeatmap data={data.hourlyHeatmap} />
                <p className="text-[10px] text-text-muted mt-2 text-center">
                  Hour of day (local time) — darker = more tips
                </p>
              </div>

              {/* Extra stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="rounded-lg border border-border bg-surface-2 p-3">
                  <p className="text-lg font-bold text-text-primary">{data.trends.tipsToday}</p>
                  <p className="text-[10px] text-text-muted">Tips Today</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 p-3">
                  <p className="text-lg font-bold text-text-primary">{data.trends.tipsYesterday}</p>
                  <p className="text-[10px] text-text-muted">Yesterday</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 p-3">
                  <p className="text-lg font-bold text-text-primary">{formatNumber(data.trends.largestTip)}</p>
                  <p className="text-[10px] text-text-muted">Largest Tip</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 p-3">
                  <p className="text-lg font-bold text-text-primary">
                    {data.trends.busiestHour.toString().padStart(2, '0')}:00
                  </p>
                  <p className="text-[10px] text-text-muted">Busiest Hour</p>
                </div>
              </div>
            </>
          )}

          {!loading && !error && data && data.overview.totalTips === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-text-muted" />
              </div>
              <p className="text-sm text-text-muted">Send some tips to populate analytics</p>
            </div>
          )}
        </div>
      )}

      {/* CSS animation for bar growth */}
      <style>{`
        @keyframes barGrow {
          from { width: 0; }
        }
      `}</style>
    </div>
  );
}
