import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function PerformanceChart({
  data,
  dataKey,
  xKey = 'date',
  color = '#7c5cff',
  height = 220,
  valueFormatter,
  domain,
  ticks,
}) {
  if (!data || data.length === 0) {
    return <div className="h-[220px] flex items-center justify-center text-sm text-slate-500">Not enough data yet</div>;
  }

  // A lone data point has no line to draw, so its dot must be forced visible,
  // and without an explicit domain Recharts auto-scales a single value into a
  // degenerate, fractional range that renders unreadable axis ticks.
  const isSinglePoint = data.length === 1;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232a3d" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#232a3d' }} tickLine={false} />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={34}
          domain={domain || [0, (dataMax) => Math.ceil(Math.max(dataMax * 1.2, 10))]}
          ticks={ticks}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ background: '#161b2b', border: '1px solid #232a3d', borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          formatter={valueFormatter}
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          dot={isSinglePoint ? { r: 4, fill: color, strokeWidth: 0 } : false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
