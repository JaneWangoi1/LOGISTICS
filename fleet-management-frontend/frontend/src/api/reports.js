import api from './client';
import { clean } from './params';

export const getReport = (params) => api.get('/reports', { params: clean(params) }).then((res) => res.data);
