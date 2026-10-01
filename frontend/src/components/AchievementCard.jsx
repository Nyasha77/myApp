import { DynamicIcon } from '../utils/icons.jsx';

export default function AchievementCard({ achievement }) {
  const { unlocked } = achievement;
  return (
    <div className={`card p-4 flex items-center gap-3 ${unlocked ? '' : 'opacity-50'}`}>
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          unlocked ? 'bg-accent/15 text-accent' : 'bg-surface-raised text-slate-600'
        }`}
      >
        <DynamicIcon name={achievement.icon} className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="font-medium text-slate-100 truncate">{achievement.name}</p>
        <p className="text-xs text-slate-500 truncate">{achievement.description}</p>
        {unlocked && achievement.unlockedAt && (
          <p className="text-[11px] text-accent mt-0.5">Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  );
}
