import client from './client';

export const getTasks = (date) => client.get('/tasks', { params: date ? { date } : {} }).then((r) => r.data);
export const createTask = (data) => client.post('/tasks', data).then((r) => r.data);
export const updateTask = (id, data) => client.put(`/tasks/${id}`, data).then((r) => r.data);
export const deleteTask = (id) => client.delete(`/tasks/${id}`).then((r) => r.data);
export const completeTask = (id, date) => client.post(`/tasks/${id}/complete`, { date }).then((r) => r.data);
export const uncompleteTask = (id, date) => client.post(`/tasks/${id}/uncomplete`, { date }).then((r) => r.data);
