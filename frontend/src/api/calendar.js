import client from './client';

export const getMonth = (year, month) => client.get('/calendar', { params: { year, month } }).then((r) => r.data);
export const getDay = (date) => client.get(`/calendar/${date}`).then((r) => r.data);
