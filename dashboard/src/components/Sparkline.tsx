// Copyright 2026 Danish A. Licensed under Apache-2.0.
/**
 * Pure SVG sparkline component — zero dependencies.
 * Renders an inline trend chart from an array of numbers.
 */

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  className?: string;
  showDot?: boolean;
  animated?: boolean;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  strokeColor = 'var(--color-accent)',
  fillColor,
  strokeWidth = 1.5,
  className = '',
  showDot = true,
  animated = true,
}: SparklineProps) {
  if (!data.length) return null;

  const padding = 2;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * graphWidth;
    const y = padding + graphHeight - ((val - min) / range) * graphHeight;
    return { x, y };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Area fill path (close to bottom)
  const areaD = fillColor
    ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${points[0].x.toFixed(1)} ${height - padding} Z`
    : '';

  const lastPoint = points[points.length - 1];
  const trend = data.length > 1 ? data[data.length - 1] - data[data.length - 2] : 0;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      preserveAspectRatio="none"
      role="img"
      aria-label="Sparkline trend chart"
    >
      {/* Gradient fill under the line */}
      {fillColor && (
        <>
          <defs>
            <linearGradient id={`spark-fill-${data.length}-${data[0]}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path
            d={areaD}
            fill={`url(#spark-fill-${data.length}-${data[0]})`}
            className={animated ? 'sparkline-area-enter' : ''}
          />
        </>
      )}

      {/* The line */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        className={animated ? 'sparkline-line-enter' : ''}
      />

      {/* Current value dot */}
      {showDot && lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={trend >= 0 ? '#22c55e' : '#ef4444'}
          className={animated ? 'sparkline-dot-enter' : ''}
        />
      )}
    </svg>
  );
}
