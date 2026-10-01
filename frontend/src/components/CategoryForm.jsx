import { useState } from 'react';
import { DynamicIcon, ICON_OPTIONS } from '../utils/icons.jsx';
import { CATEGORY_COLORS, COLOR_NAMES } from '../utils/colors';

const STAT_NAMES = ['Strength', 'Intelligence', 'Discipline', 'Endurance', 'Focus', 'Consistency'];

export default function CategoryForm({ initialCategory, onSubmit, onCancel, submitting }) {
  const [name, setName] = useState(initialCategory?.name || '');
  const [description, setDescription] = useState(initialCategory?.description || '');
  const [icon, setIcon] = useState(initialCategory?.icon || ICON_OPTIONS[0]);
  const [color, setColor] = useState(initialCategory?.color || COLOR_NAMES[0]);
  const [statWeights, setStatWeights] = useState(() => {
    const map = {};
    (initialCategory?.stats || []).forEach((s) => { map[s.statName] = s.weight; });
    return map;
  });
  const [error, setError] = useState(null);

  const toggleStat = (stat) => {
    setStatWeights((prev) => {
      const next = { ...prev };
      if (next[stat] != null) delete next[stat];
      else next[stat] = 1;
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Give your category a name');
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      icon,
      color,
      stats: Object.entries(statWeights).map(([statName, weight]) => ({ statName, weight: Number(weight) })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="cat-name">Name</label>
        <input id="cat-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Programming" autoFocus />
      </div>

      <div>
        <label className="label" htmlFor="cat-desc">Description</label>
        <input id="cat-desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
      </div>

      <div>
        <p className="label">Icon</p>
        <div className="grid grid-cols-7 gap-2">
          {ICON_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => setIcon(opt)}
              aria-label={opt}
              className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-colors ${
                icon === opt ? 'border-accent bg-accent/15 text-accent' : 'border-transparent bg-surface-raised text-slate-400'
              }`}
            >
              <DynamicIcon name={opt} className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Color</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_NAMES.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              aria-label={c}
              className={`w-9 h-9 rounded-full ${CATEGORY_COLORS[c].solid} ${
                color === c ? 'ring-2 ring-offset-2 ring-offset-surface-card ring-white' : ''
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="label">Affects stats</p>
        <div className="flex flex-wrap gap-2">
          {STAT_NAMES.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => toggleStat(s)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                statWeights[s] != null
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-surface-border text-slate-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? 'Saving...' : 'Save category'}
        </button>
      </div>
    </form>
  );
}
