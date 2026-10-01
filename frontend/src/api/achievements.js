import client from './client';

export const getAchievements = () => client.get('/achievements').then((r) => r.data);
