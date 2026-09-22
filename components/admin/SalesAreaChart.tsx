"use client";

interface SalesAreaChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

const WIDTH = 600;

export default function SalesAreaChart({ data, height = 220 }: SalesAreaChartProps) {
  if (data.length === 0) return null;

  const max = Math.max(...data.map((d) => d.value), 1);
  const stepX = WIDTH / Math.max(data.length - 1, 1);
  const padY = 16;
  const plotHeight = height - padY * 2;

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = padY + plotHeight - (d.value / max) * plotHeight;
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${WIDTH} ${height} L 0 ${height} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
        <defs>
          <linearGradient id="salesAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B99A62" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#B99A62" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#salesAreaFill)" />
        <path d={linePath} fill="none" stroke="#B99A62" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="#FAF7F2" stroke="#B99A62" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-2 px-0.5">
        {data.map((d) => (
          <span key={d.label} className="font-label-sm text-label-sm uppercase tracking-wider text-[#2D2024]/50">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
