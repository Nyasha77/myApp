import { createContext, useContext, useState, useCallback } from 'react';
import { Sparkles, ArrowUpCircle, Award, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';

const ToastContext = createContext(null);
let idCounter = 0;

const ICONS = {
  xp: Sparkles,
  levelUp: ArrowUpCircle,
  achievement: Award,
  statUp: TrendingUp,
  statDown: TrendingDown,
  info: CheckCircle2,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = idCounter += 1;
      setToasts((prev) => [...prev, { id, ...toast }]);
      setTimeout(() => remove(id), toast.duration || 3200);
    },
    [remove]
  );

  const notify = {
    xp: (amount, label) => push({ type: 'xp', title: `+${amount} XP`, subtitle: label }),
    levelUp: (fromLevel, toLevel) => push({ type: 'levelUp', title: 'LEVEL UP', subtitle: `Level ${fromLevel} → ${toLevel}`, duration: 4000 }),
    achievement: (achievement) => push({ type: 'achievement', title: 'Achievement Unlocked', subtitle: achievement.name, duration: 4000 }),
    stat: (statName, delta) =>
      push({ type: delta >= 0 ? 'statUp' : 'statDown', title: `${statName} ${delta >= 0 ? '+' : ''}${delta}`, subtitle: null }),
    error: (message) => push({ type: 'error', title: message, duration: 3500 }),
    info: (message, subtitle) => push({ type: 'info', title: message, subtitle }),
  };

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full px-4">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div
              key={t.id}
              className="animate-xp-pop card px-4 py-2.5 shadow-glow flex items-center gap-2.5 max-w-sm w-full sm:w-auto"
            >
              {Icon && <Icon className="w-5 h-5 text-accent shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">{t.title}</p>
                {t.subtitle && <p className="text-xs text-slate-400 truncate">{t.subtitle}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
