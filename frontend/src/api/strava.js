import client from './client';

export const getStravaStatus = () => client.get('/integrations/strava/status').then((r) => r.data);
export const disconnectStrava = () => client.delete('/integrations/strava/disconnect').then((r) => r.data);
export const syncStrava = () => client.post('/integrations/strava/sync').then((r) => r.data);
export const postWorkoutToStrava = (data) => client.post('/integrations/strava/post-workout', data).then((r) => r.data);

// Not an axios call - this is a real browser navigation so the user actually
// sees Strava's OAuth consent screen and logs in there.
export function connectStravaUrl() {
  const base = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:4000/api`;
  return `${base}/integrations/strava/connect`;
}
