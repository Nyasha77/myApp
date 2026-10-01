import { Pencil, Trash2, Flame } from 'lucide-react';
import { DynamicIcon } from '../utils/icons.jsx';
import { getCategoryColor } from '../utils/colors';

export default function CategoryCard({ category, streak, onEdit, onDelete }) {
  const color = getCategoryColor(category.color);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color.bg} ${color.text}`}>
          <DynamicIcon name={category.icon} className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(category)}
            aria-label="Edit category"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-raised"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(category)}
            aria-label="Delete category"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-surface-raised"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="font-semibold text-slate-100 mt-3">{category.name}</p>
      {category.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{category.description}</p>}
      <div className="flex items-center justify-between mt-3">
        <div className="flex flex-wrap gap-1">
          {category.stats?.map((s) => (
            <span key={s.statName} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-raised text-slate-400">
              {s.statName}
            </span>
          ))}
        </div>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-400 shrink-0">
            <Flame className="w-3.5 h-3.5" />
            {streak}d
          </span>
        )}
      </div>
    </div>
  );
}
