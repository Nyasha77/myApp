// Explicit named imports (rather than `import * as Icons`) so unused Lucide
// icons are tree-shaken out of the production bundle.
import {
  Circle, Dumbbell, BookOpen, Briefcase, User, HeartPulse, Code, Wallet,
  Users, Palette, Music, Brain, Trophy, Target, Flame, Star,
  PenTool, Camera, Globe, Bike, Utensils, Moon, Sunrise,
  Footprints, CalendarCheck, ArrowUpCircle, RotateCcw, Award,
} from 'lucide-react';

const ICON_MAP = {
  Circle, Dumbbell, BookOpen, Briefcase, User, HeartPulse, Code, Wallet,
  Users, Palette, Music, Brain, Trophy, Target, Flame, Star,
  PenTool, Camera, Globe, Bike, Utensils, Moon, Sunrise,
  Footprints, CalendarCheck, ArrowUpCircle, RotateCcw, Award,
};

export const ICON_OPTIONS = [
  'Dumbbell', 'BookOpen', 'Briefcase', 'User', 'HeartPulse', 'Code', 'Wallet',
  'Users', 'Palette', 'Music', 'Brain', 'Trophy', 'Target', 'Flame', 'Star',
  'PenTool', 'Camera', 'Globe', 'Bike', 'Utensils', 'Moon', 'Sunrise',
];

export function DynamicIcon({ name, className }) {
  const Icon = ICON_MAP[name] || Circle;
  return <Icon className={className} />;
}
