import { progressBand } from '../utils/format';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function CalendarGrid({ year, month, days, onSelectDay, selectedDate }) {
  const dayMap = new Map(days.map((d) => [d.date, d]));
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = firstOfMonth.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push(dateStr);
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {WEEKDAYS.map((w, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="text-center text-xs text-slate-500 font-medium">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} />;
          const info = dayMap.get(dateStr);
          const pct = info ? Number(info.progress) : null;
          const band = pct != null ? progressBand(pct) : null;
          const isSelected = dateStr === selectedDate;
          const dayNum = parseInt(dateStr.slice(-2), 10);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDay(dateStr)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium relative transition-transform active:scale-95 ${
                isSelected ? 'ring-2 ring-accent' : ''
              } ${band ? band.className : 'bg-surface-raised'} ${pct != null ? 'text-white' : 'text-slate-500'}`}
              style={pct != null ? { opacity: 0.35 + (Math.min(pct, 100) / 100) * 0.65 } : undefined}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
}
