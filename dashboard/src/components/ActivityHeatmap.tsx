// Copyright 2026 Danish A. Licensed under Apache-2.0.
import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import type { TipHistoryEntry } from '../types';

interface ActivityHeatmapProps {
  history: TipHistoryEntry[];
}

function getDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getColorClass(count: number): string {
  if (count === 0) return 'bg-surface-3/50';
  if (count === 1) return 'bg-green-500/20';
  if (count <= 3) return 'bg-green-500/40';
  if (count <= 6) return 'bg-green-500/60';
  return 'bg-green-500/80';
}

export function ActivityHeatmap({ history }: ActivityHeatmapProps) {
  const { weeks, maxCount, activeDays } = useMemo(() => {
    // Count tips per day
    const counts: Record<string, number> = {};
    for (const entry of history) {
      const key = getDayKey(new Date(entry.createdAt));
      counts[key] = (counts[key] ?? 0) + 1;
    }

    // Generate last 12 weeks (84 days)
    const today = new Date();
    const weeksData: Array<Array<{ key: string; count: number; date: Date }>> = [];
    let currentWeek: Array<{ key: string; count: number; date: Date }> = [];
    let maxC = 0;
    let activeD = 0;

    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = getDayKey(d);
      const count = counts[key] ?? 0;
      if (count > maxC) maxC = count;
      if (count > 0) activeD++;
      currentWeek.push({ key, count, date: new Date(d) });
      if (currentWeek.length === 7) {
        weeksData.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeksData.push(currentWeek);

    return { weeks: weeksData, maxCount: maxC, activeDays: activeD };
  }, [history]);

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-accent" />
          Activity Heatmap
        </h2>
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span>{activeDays} active days</span>
          <span className="text-text-muted/40">•</span>
          <span>Last 12 weeks</span>
        </div>
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 pr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[14px] flex items-center">
              <span className="text-[9px] text-text-muted w-6 text-right">{label}</span>
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex gap-1 flex-1 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.key}
                  className={`w-[14px] h-[14px] rounded-sm transition-colors ${getColorClass(day.count)}`}
                  title={`${day.date.toLocaleDateString()}: ${day.count} tip${day.count !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] text-text-muted">Less</span>
          <div className="w-[10px] h-[10px] rounded-sm bg-surface-3/50" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-500/20" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-500/40" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-500/60" />
          <div className="w-[10px] h-[10px] rounded-sm bg-green-500/80" />
          <span className="text-[9px] text-text-muted">More</span>
        </div>
        <span className="text-[10px] text-text-muted font-mono tabular-nums">
          Peak: {maxCount} tip{maxCount !== 1 ? 's' : ''}/day
        </span>
      </div>
    </div>
  );
}
