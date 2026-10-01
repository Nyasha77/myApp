import client from './client';

export const getProgression = () => client.get('/progression').then((r) => r.data);
export const getStatHistory = (statName, limit) => client.get('/stats/history', { params: { stat: statName, limit } }).then((r) => r.data);
export const getDecayHistory = (limit) => client.get('/stats/decay-history', { params: { limit } }).then((r) => r.data);
