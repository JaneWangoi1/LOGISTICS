import api from './client';
import { clean } from './params';

export const getDashboard = (params) => api.get('/dashboard', { params: clean(params) }).then((res) => res.data);
export const getAlertCount = () => api.get('/dashboard/alerts').then((res) => res.data.count);
