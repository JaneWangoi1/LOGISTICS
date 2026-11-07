import api from './client';

export const getDrivers = () => api.get('/drivers').then((res) => res.data);
export const getDriver = (id) => api.get(`/drivers/${id}`).then((res) => res.data);
export const createDriver = (data) => api.post('/drivers', data).then((res) => res.data);
export const updateDriver = (id, data) => api.put(`/drivers/${id}`, data).then((res) => res.data);
export const deleteDriver = (id) => api.delete(`/drivers/${id}`).then((res) => res.data);
