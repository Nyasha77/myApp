// Curated color palette for categories. Class names are written out in full
// (not constructed dynamically) so Tailwind's content scanner picks them up.
export const CATEGORY_COLORS = {
  red: { bg: 'bg-red-500/15', text: 'text-red-400', ring: 'ring-red-500/30', solid: 'bg-red-500' },
  orange: { bg: 'bg-orange-500/15', text: 'text-orange-400', ring: 'ring-orange-500/30', solid: 'bg-orange-500' },
  amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', ring: 'ring-amber-500/30', solid: 'bg-amber-500' },
  yellow: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', ring: 'ring-yellow-500/30', solid: 'bg-yellow-500' },
  emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', ring: 'ring-emerald-500/30', solid: 'bg-emerald-500' },
  teal: { bg: 'bg-teal-500/15', text: 'text-teal-400', ring: 'ring-teal-500/30', solid: 'bg-teal-500' },
  cyan: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', ring: 'ring-cyan-500/30', solid: 'bg-cyan-500' },
  blue: { bg: 'bg-blue-500/15', text: 'text-blue-400', ring: 'ring-blue-500/30', solid: 'bg-blue-500' },
  indigo: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', ring: 'ring-indigo-500/30', solid: 'bg-indigo-500' },
  purple: { bg: 'bg-purple-500/15', text: 'text-purple-400', ring: 'ring-purple-500/30', solid: 'bg-purple-500' },
  pink: { bg: 'bg-pink-500/15', text: 'text-pink-400', ring: 'ring-pink-500/30', solid: 'bg-pink-500' },
  rose: { bg: 'bg-rose-500/15', text: 'text-rose-400', ring: 'ring-rose-500/30', solid: 'bg-rose-500' },
};

export const COLOR_NAMES = Object.keys(CATEGORY_COLORS);

export function getCategoryColor(color) {
  return CATEGORY_COLORS[color] || CATEGORY_COLORS.blue;
}
