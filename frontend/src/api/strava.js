import client, { getToken } from './client';

export const getStravaStatus = () => client.get('/integrations/strava/status').then((r) => r.data);
export const disconnectStrava = () => client.delete('/integrations/strava/disconnect').then((r) => r.data);
export const syncStrava = () => client.post('/integrations/strava/sync').then((r) => r.data);
export const postWorkoutToStrava = (data) => client.post('/integrations/strava/post-workout', data).then((r) => r.data);

// Not an axios call - this is a real browser navigation (so the user actually
// sees Strava's OAuth consent screen), which means it can't carry an
// Authorization header the way every other request here does. The token is
// passed as a query param instead so the backend can still identify who's
// connecting; see backend/src/middleware/auth.js for the matching fallback.
export function connectStravaUrl() {
  const base = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;
  const token = getToken();
  return `${base}/integrations/strava/connect?token=${encodeURIComponent(token || '')}`;
}
