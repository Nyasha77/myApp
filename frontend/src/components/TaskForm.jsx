import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { todayLocalISO } from '../utils/format';
import { addDuration } from '../utils/dateMath';

const DIFFICULTIES = ['trivial', 'easy', 'normal', 'hard', 'epic'];
const WEEKDAYS = [
  { value: 0, label: 'S' },
  { value: 1, label: 'M' },
  { value: 2, label: 'T' },
  { value: 3, label: 'W' },
  { value: 4, label: 'T' },
  { value: 5, label: 'F' },
  { value: 6, label: 'S' },
];

export default function TaskForm({ categories, initialTask, onSubmit, onCancel, submitting }) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [categoryId, setCategoryId] = useState(initialTask?.category_id || categories[0]?.id || '');
  const [weight, setWeight] = useState(initialTask?.weight ?? 10);
  const [scheduledDate, setScheduledDate] = useState(initialTask?.scheduled_date || todayLocalISO());
  const [showMore, setShowMore] = useState(false);
  const [description, setDescription] = useState(initialTask?.description || '');
  const [difficulty, setDifficulty] = useState(initialTask?.difficulty || 'normal');
  const [taskType, setTaskType] = useState(initialTask?.task_type || 'standard');
  const [recurrenceType, setRecurrenceType] = useState(initialTask?.recurrence_type || 'none');
  const [daysOfWeek, setDaysOfWeek] = useState(() => new Set(initialTask?.recurrence_config?.daysOfWeek || []));
  const [endType, setEndType] = useState(initialTask?.recurrence_config?.endDate ? 'after' : 'never');
  const [durationAmount, setDurationAmount] = useState(2);
  const [durationUnit, setDurationUnit] = useState('weeks');
  const [error, setError] = useState(null);

  const existingEndDate = initialTask?.recurrence_config?.endDate;

  const toggleDay = (day) => {
    setDaysOfWeek((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Give your quest a title');
      return;
    }
    if (recurrenceType === 'weekly' && daysOfWeek.size === 0) {
      setError('Pick at least one day of the week');
      return;
    }
    if (endType === 'after' && (!durationAmount || Number(durationAmount) <= 0)) {
      setError('Enter how long this should repeat for');
      return;
    }

    let recurrenceConfig = null;
    if (recurrenceType !== 'none') {
      recurrenceConfig = {};
      if (recurrenceType === 'weekly') recurrenceConfig.daysOfWeek = [...daysOfWeek].sort();
      if (endType === 'after') recurrenceConfig.endDate = addDuration(scheduledDate, Number(durationAmount), durationUnit);
    }

    onSubmit({
      title: title.trim(),
      categoryId: categoryId || null,
      weight: Number(weight),
      scheduledDate,
      description: description.trim() || null,
      difficulty,
      taskType,
      recurrenceType,
      recurrenceConfig,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="task-title">Title</label>
        <input
          id="task-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Study JavaScript for 1 hour"
          autoFocus
        />
      </div>

      <div>
        <label className="label" htmlFor="task-category">Category</label>
        <select id="task-category" className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="task-weight">Weight (0-100)</label>
          <input
            id="task-weight"
            type="number"
            min="0"
            max="100"
            className="input"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="task-date">Date</label>
          <input
            id="task-date"
            type="date"
            className="input"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowMore((v) => !v)}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
        More options
      </button>

      {showMore && (
        <div className="space-y-4 pt-1">
          <div>
            <label className="label" htmlFor="task-description">Description</label>
            <textarea
              id="task-description"
              className="input min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="task-difficulty">Difficulty</label>
              <select id="task-difficulty" className="input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>{d[0].toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="task-type">Type</label>
              <select id="task-type" className="input" value={taskType} onChange={(e) => setTaskType(e.target.value)}>
                <option value="standard">Standard</option>
                <option value="recurring">Recurring</option>
                <option value="performance">Performance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="task-recurrence">Repeats</label>
            <select id="task-recurrence" className="input" value={recurrenceType} onChange={(e) => setRecurrenceType(e.target.value)}>
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Specific days of the week</option>
            </select>
          </div>

          {recurrenceType === 'weekly' && (
            <div>
              <p className="label">On these days</p>
              <div className="flex gap-1.5">
                {WEEKDAYS.map(({ value, label }) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => toggleDay(value)}
                    aria-label={`Toggle ${label}`}
                    aria-pressed={daysOfWeek.has(value)}
                    className={`w-10 h-10 rounded-full text-sm font-medium border-2 transition-colors ${
                      daysOfWeek.has(value) ? 'border-accent bg-accent/15 text-accent' : 'border-surface-border text-slate-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recurrenceType !== 'none' && (
            <div>
              <p className="label">Ends</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-sm text-slate-300">
                  <input
                    type="radio"
                    name="end-type"
                    checked={endType === 'never'}
                    onChange={() => setEndType('never')}
                    className="w-4 h-4 accent-[#7c5cff]"
                  />
                  Never
                </label>
                <label className="flex items-center gap-2.5 text-sm text-slate-300">
                  <input
                    type="radio"
                    name="end-type"
                    checked={endType === 'after'}
                    onChange={() => setEndType('after')}
                    className="w-4 h-4 accent-[#7c5cff]"
                  />
                  After
                  <input
                    type="number"
                    min="1"
                    value={durationAmount}
                    onChange={(e) => { setEndType('after'); setDurationAmount(e.target.value); }}
                    className="input !w-20 !py-1.5"
                    aria-label="Duration amount"
                  />
                  <select
                    value={durationUnit}
                    onChange={(e) => { setEndType('after'); setDurationUnit(e.target.value); }}
                    className="input !w-auto !py-1.5"
                    aria-label="Duration unit"
                  >
                    <option value="days">days</option>
                    <option value="weeks">weeks</option>
                    <option value="months">months</option>
                  </select>
                </label>
                {endType === 'after' && (
                  <p className="text-xs text-slate-500 pl-6">
                    {existingEndDate ? `Currently ends ${existingEndDate}. Will change to: ` : 'Ends on: '}
                    {addDuration(scheduledDate, Number(durationAmount) || 0, durationUnit)}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? 'Saving...' : 'Save quest'}
        </button>
      </div>
    </form>
  );
}
