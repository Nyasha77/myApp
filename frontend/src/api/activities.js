import client from './client';

export const getActivities = (params) => client.get('/activities', { params }).then((r) => r.data);
export const createActivity = (data) => client.post('/activities', data).then((r) => r.data);
export const getPersonalBests = (categoryId) => client.get('/activities/personal-bests', { params: { categoryId } }).then((r) => r.data);
export const getKnownActivityNames = (categoryId) => client.get('/activities/known-names', { params: { categoryId } }).then((r) => r.data);
