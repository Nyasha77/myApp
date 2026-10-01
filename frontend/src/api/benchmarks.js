import client from './client';

export const getBenchmarks = (categoryId) => client.get('/benchmarks', { params: { categoryId } }).then((r) => r.data);
export const createBenchmark = (data) => client.post('/benchmarks', data).then((r) => r.data);
export const updateBenchmark = (id, data) => client.put(`/benchmarks/${id}`, data).then((r) => r.data);
export const deleteBenchmark = (id) => client.delete(`/benchmarks/${id}`).then((r) => r.data);
