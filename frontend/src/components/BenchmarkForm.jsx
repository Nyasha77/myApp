import { useState } from 'react';

export default function BenchmarkForm({ onSubmit, onCancel, submitting }) {
  const [activityName, setActivityName] = useState('');
  const [metricName, setMetricName] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [direction, setDirection] = useState('higher_better');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activityName.trim() || !metricName.trim() || targetValue === '') {
      setError('Fill in the activity, metric, and target');
      return;
    }
    onSubmit({
      activityName: activityName.trim(),
      metricName: metricName.trim(),
      targetValue: Number(targetValue),
      targetUnit: targetUnit.trim() || undefined,
      direction,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="bm-activity">Activity</label>
        <input id="bm-activity" className="input" value={activityName} onChange={(e) => setActivityName(e.target.value)} placeholder="e.g. Bench Press" autoFocus />
      </div>
      <div>
        <label className="label" htmlFor="bm-metric">Metric</label>
        <input id="bm-metric" className="input" value={metricName} onChange={(e) => setMetricName(e.target.value)} placeholder="e.g. weight" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="bm-target">Target</label>
          <input id="bm-target" type="number" className="input" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="bm-unit">Unit</label>
          <input id="bm-unit" className="input" value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} placeholder="kg, min..." />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="bm-direction">Goal direction</label>
        <select id="bm-direction" className="input" value={direction} onChange={(e) => setDirection(e.target.value)}>
          <option value="higher_better">Higher is better (e.g. weight lifted)</option>
          <option value="lower_better">Lower is better (e.g. race time)</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? 'Saving...' : 'Save benchmark'}
        </button>
      </div>
    </form>
  );
}
