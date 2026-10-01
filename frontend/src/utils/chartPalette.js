// Validated categorical palette (dataviz skill reference instance).
// Fixed hue order - never cycled/reordered per-chart. Beyond 8 series, fold into "Other".
export const CATEGORICAL_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'];
export const CATEGORICAL_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

export function getCategoricalPalette(resolvedTheme) {
  return resolvedTheme === 'dark' ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
}

const OTHER_COLOR = { light: '#898781', dark: '#89878199' };

export function assignCategoricalColors(labels, resolvedTheme) {
  const palette = getCategoricalPalette(resolvedTheme);
  return labels.map((label, i) => (i < palette.length ? palette[i] : OTHER_COLOR[resolvedTheme] || OTHER_COLOR.dark));
}
