import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function ActivityForm({ categories, fixedCategoryId, suggestions, onSubmit, onCancel, submitting }) {
  const [activityName, setActivityName] = useState('');
  const [categoryId, setCategoryId] = useState(fixedCategoryId || categories[0]?.id || '');
  const [metrics, setMetrics] = useState([{ name: '', value: '', unit: '' }]);
  const [error, setError] = useState(null);

  const updateMetric = (index, field, value) => {
    setMetrics((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const addMetric = () => setMetrics((prev) => [...prev, { name: '', value: '', unit: '' }]);
  const removeMetric = (index) => setMetrics((prev) => prev.filter((_, i) => i !== index));

  const applySuggestion = (s) => {
    setActivityName(s.activityName);
    setMetrics(s.metrics.map((m) => ({ name: m.name, value: '', unit: m.unit || '' })));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activityName.trim()) return setError('Name the activity, e.g. "Bench Press"');
    const cleanMetrics = metrics
      .filter((m) => m.name.trim() && m.value !== '')
      .map((m) => ({ name: m.name.trim(), value: Number(m.value), unit: m.unit.trim() || undefined }));
    if (cleanMetrics.length === 0) return setError('Add at least one measurable result');

    onSubmit({ activityName: activityName.trim(), categoryId: categoryId || null, metrics: cleanMetrics });
    return undefined;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {suggestions && suggestions.length > 0 && (
        <div>
          <p className="label">Quick pick</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                type="button"
                key={s.activityName}
                onClick={() => applySuggestion(s)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  activityName === s.activityName
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-surface-border text-slate-400'
                }`}
              >
                {s.activityName}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="label" htmlFor="activity-name">Activity</label>
        <input
          id="activity-name"
          className="input"
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          placeholder="e.g. Bench Press, Running, LeetCode"
          autoFocus
        />
      </div>

      {!fixedCategoryId && (
        <div>
          <label className="label" htmlFor="activity-category">Category</label>
          <select id="activity-category" className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <p className="label">Results</p>
        {metrics.map((m, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={i} className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Metric (e.g. weight)"
              value={m.name}
              onChange={(e) => updateMetric(i, 'name', e.target.value)}
            />
            <input
              className="input w-24"
              type="number"
              placeholder="Value"
              value={m.value}
              onChange={(e) => updateMetric(i, 'value', e.target.value)}
              autoFocus={i === 0 && Boolean(activityName)}
            />
            <input
              className="input w-20"
              placeholder="Unit"
              value={m.unit}
              onChange={(e) => updateMetric(i, 'unit', e.target.value)}
            />
            {metrics.length > 1 && (
              <button type="button" onClick={() => removeMetric(i)} aria-label="Remove metric" className="text-slate-500 hover:text-red-400 px-1">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addMetric} className="flex items-center gap-1.5 text-sm text-accent">
          <Plus className="w-4 h-4" /> Add another metric
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? 'Saving...' : 'Log result'}
        </button>
      </div>
    </form>
  );
}
