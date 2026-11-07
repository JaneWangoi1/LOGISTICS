import api from './client';
import { clean } from './params';

// Returns { expenses, total, count, byCategory }
export const getExpenses = (params) => api.get('/expenses', { params: clean(params) }).then((res) => res.data);
export const createExpense = (data) => api.post('/expenses', data).then((res) => res.data);
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data).then((res) => res.data);
export const deleteExpense = (id) => api.delete(`/expenses/${id}`).then((res) => res.data);
