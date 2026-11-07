import api from './client';
import { clean } from './params';

export const getIncome = (params) => api.get('/income', { params: clean(params) }).then((res) => res.data);
