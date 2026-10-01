import { useEffect, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import * as calendarApi from '../api/calendar';
import CalendarGrid from '../components/CalendarGrid';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { todayLocalISO } from '../utils/format';

function monthLabel(year, month) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export default function CalendarPage() {
  const today = todayLocalISO();
  const [year, setYear] = useState(parseInt(today.slice(0, 4), 10));
  const [month, setMonth] = useState(parseInt(today.slice(5, 7), 10));
  const [days, setDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadMonth = useCallback(async () => {
    setLoading(true);
    const res = await calendarApi.getMonth(year, month);
    setDays(res.days);
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  const loadDetail = useCallback(async (date) => {
    setDetailLoading(true);
    const res = await calendarApi.getDay(date);
    setDetail(res);
    setDetailLoading(false);
  }, []);

  useEffect(() => {
    loadDetail(selectedDate);
  }, [selectedDate, loadDetail]);

  const changeMonth = (delta) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear += 1; }
    if (newMonth < 1) { newMonth = 12; newYear -= 1; }
    setMonth(newMonth);
    setYear(newYear);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-50">Calendar</h1>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-surface-raised">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-slate-100">{monthLabel(year, month)}</span>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-surface-raised">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {loading ? <LoadingSkeleton rows={5} /> : (
          <CalendarGrid year={year} month={month} days={days} onSelectDay={setSelectedDate} selectedDate={selectedDate} />
        )}
      </div>

      <div className="card p-4">
        <h2 className="font-semibold text-slate-100 mb-3">{selectedDate}</h2>
        {detailLoading ? (
          <LoadingSkeleton rows={3} />
        ) : !detail || (detail.tasksCompleted.length === 0 && detail.tasksMissed.length === 0) ? (
          <EmptyState icon={CalendarDays} title="No activity recorded." subtitle="Your progression history will appear here once you start completing quests." />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-slate-50">{Math.round(Number(detail.summary.progress_percentage))}%</p>
                <p className="text-xs text-slate-500">Progress</p>
              </div>
              <div>
                <p className="text-lg font-bold text-accent">+{detail.summary.xp_earned}</p>
                <p className="text-xs text-slate-500">XP earned</p>
              </div>
              <div>
                <p className="text-lg font-bold text-slate-50">{detail.summary.tasks_completed}/{detail.summary.tasks_total}</p>
                <p className="text-xs text-slate-500">Tasks</p>
              </div>
            </div>

            {detail.tasksCompleted.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1.5">Completed</p>
                <ul className="space-y-1">
                  {detail.tasksCompleted.map((t) => (
                    <li key={t.id} className="text-sm text-slate-400 flex justify-between">
                      <span>{t.title}</span>
                      {t.xp_earned != null && <span className="text-accent">+{t.xp_earned} XP</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {detail.tasksMissed.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1.5">Missed</p>
                <ul className="space-y-1">
                  {detail.tasksMissed.map((t) => (
                    <li key={t.id} className="text-sm text-slate-500">{t.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
