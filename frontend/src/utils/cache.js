// A tiny stale-while-revalidate cache: lets a page render instantly from the
// last-known server response while the real (possibly slow - cold Render/Neon
// included) fetch happens silently in the background. Never a source of
// truth, purely a perceived-speed layer - any failure here just means no
// instant paint, not broken data.
const PREFIX = 'ascend:cache:';

export function readCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeCache(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // storage full or unavailable (private browsing, etc.) - safe to ignore
  }
}
