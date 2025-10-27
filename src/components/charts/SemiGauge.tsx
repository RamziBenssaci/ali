import React from 'react';

interface SemiGaugeProps {
  percentage: number; // 0 - 100
  size?: number; // overall width in px
  strokeWidth?: number;
  label?: string;
}

// A responsive semi-circle gauge using SVG and design tokens
export default function SemiGauge({ percentage, size = 220, strokeWidth = 14, label }: SemiGaugeProps) {
  const clamped = Math.max(0, Math.min(100, percentage || 0));

  const width = size;
  const height = size / 2;
  const radius = (size - strokeWidth) / 2;
  const cx = width / 2;
  const cy = height;
  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;
  const endY = cy;

  // Path for the arc (semi-circle)
  const arcPath = `M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`;
  const arcLength = Math.PI * radius;
  const progress = clamped / 100;
  const dashOffset = arcLength * (1 - progress);

  // Needle (from center to arc at progress angle)
  const angle = Math.PI * (1 - progress); // PI to 0 (left to right)
  const needleX = cx + Math.cos(angle) * (radius - strokeWidth / 2);
  const needleY = cy - Math.sin(angle) * (radius - strokeWidth / 2);

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${width} ${height + strokeWidth}`}
        className="w-full h-auto"
        role="img"
        aria-label={label ? `${label} ${clamped.toFixed(1)}%` : `${clamped.toFixed(1)}%`}
      >
        {/* Track */}
        <path
          d={arcPath}
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.25)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress */}
        <path
          d={arcPath}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={arcLength}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 800ms ease' }}
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
        />

        {/* Center percentage */}
        <text
          x={cx}
          y={cy - radius / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-bold"
          fill="hsl(var(--foreground))"
          style={{ fontSize: Math.max(14, radius * 0.32) }}
        >
          {clamped.toFixed(1)}%
        </text>
      </svg>
      {label && (
        <div className="mt-2 text-sm text-muted-foreground">{label}</div>
      )}
    </div>
  );
}
