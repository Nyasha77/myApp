import { Check, Trash2, Pencil } from 'lucide-react';
import { DynamicIcon } from '../utils/icons.jsx';
import { getCategoryColor } from '../utils/colors';

export default function TaskCard({ task, onToggle, onEdit, onDelete, busy }) {
  const color = getCategoryColor(task.category?.color);

  return (
    <div className={`card p-3.5 flex items-center gap-3 transition-opacity ${task.completed ? 'opacity-60' : ''}`}>
      <button
        type="button"
        onClick={() => onToggle(task)}
        disabled={busy}
        aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
        className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center border-2 transition-colors ${
          task.completed
            ? 'bg-accent border-accent text-white'
            : 'border-surface-border text-transparent hover:border-accent/60'
        }`}
      >
        <Check className="w-5 h-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className={`font-medium text-slate-100 truncate ${task.completed ? 'line-through decoration-slate-500' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {task.category && (
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
              <DynamicIcon name={task.category.icon} className="w-3 h-3" />
              {task.category.name}
            </span>
          )}
          <span className="text-xs text-slate-500">Weight {task.weight}</span>
          {task.xp_earned != null && <span className="text-xs text-accent font-medium">+{task.xp_earned} XP</span>}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(task)}
          aria-label="Edit task"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-surface-raised"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task)}
          aria-label="Delete task"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-surface-raised"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
