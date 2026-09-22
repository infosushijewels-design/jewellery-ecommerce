"use client";

interface CategoryDonutChartProps {
  data: { name: string; revenue: number; units: number }[];
}

// Brand-aligned palette: gold, plum, rose-taupe, deep gold, mauve, sage
const COLORS = ['#B99A62', '#4B2949', '#C9A0A4', '#8A6F3C', '#7E5A7C', '#8FA38A'];
const MAX_SLICES = 5;

const SIZE = 180;
const STROKE = 28;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3; // px gap between slices along the ring

export default function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  // Keep the top categories, fold the remainder into "Others"
  const slices =
    data.length > MAX_SLICES
      ? [
          ...data.slice(0, MAX_SLICES - 1),
          data.slice(MAX_SLICES - 1).reduce(
            (acc, d) => ({ name: 'Others', revenue: acc.revenue + d.revenue, units: acc.units + d.units }),
            { name: 'Others', revenue: 0, units: 0 }
          ),
        ]
      : data;

  const total = slices.reduce((acc, d) => acc + d.revenue, 0);

  if (total <= 0) {
    return (
      <div className="py-10 text-center text-[#2D2024]/50">
        <span className="material-symbols-outlined text-3xl mb-2 text-[#2D2024]/30">donut_large</span>
        <p className="font-body-sm text-body-sm">No category sales yet.</p>
      </div>
    );
  }

  const lengths = slices.map((d) => (d.revenue / total) * CIRCUMFERENCE);
  const arcs = slices.map((d, i) => {
    const length = lengths[i];
    const start = lengths.slice(0, i).reduce((acc, l) => acc + l, 0);
    const visible = slices.length > 1 ? Math.max(length - GAP, 0) : length;
    return {
      ...d,
      color: COLORS[i % COLORS.length],
      pct: Math.round((d.revenue / total) * 100),
      dash: `${visible} ${CIRCUMFERENCE - visible}`,
      dashOffset: -start,
    };
  });

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#E8D5C5" strokeOpacity={0.35} strokeWidth={STROKE} />
          {arcs.map((a) => (
            <circle
              key={a.name}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={a.color}
              strokeWidth={STROKE}
              strokeDasharray={a.dash}
              strokeDashoffset={a.dashOffset}
            >
              <title>{`${a.name}: ₹${a.revenue.toLocaleString('en-IN')} (${a.pct}%)`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="font-label-sm text-[10px] uppercase tracking-widest text-[#2D2024]/50">Revenue</span>
          <span className="font-headline-sm text-lg text-[#2D2024]">₹{total.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <ul className="w-full space-y-2.5">
        {arcs.map((a) => (
          <li key={a.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
              <span className="text-[#2D2024] truncate">{a.name}</span>
            </span>
            <span className="text-[#2D2024]/70 tabular-nums flex-shrink-0">{a.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
