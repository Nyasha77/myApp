import client from './client';

export const getDaily = (date) => client.get('/analytics/daily', { params: date ? { date } : {} }).then((r) => r.data);
export const getWeekly = (date) => client.get('/analytics/weekly', { params: date ? { date } : {} }).then((r) => r.data);
export const getMonthly = (year, month) => client.get('/analytics/monthly', { params: { year, month } }).then((r) => r.data);
export const getRange = (start, end) => client.get('/analytics/range', { params: { start, end } }).then((r) => r.data);
