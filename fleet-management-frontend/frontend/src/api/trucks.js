import api from './client';

export const getTrucks = () => api.get('/trucks').then((res) => res.data);
export const getTruck = (id) => api.get(`/trucks/${id}`).then((res) => res.data);
export const createTruck = (data) => api.post('/trucks', data).then((res) => res.data);
export const updateTruck = (id, data) => api.put(`/trucks/${id}`, data).then((res) => res.data);
export const deleteTruck = (id) => api.delete(`/trucks/${id}`).then((res) => res.data);
export const assignDriver = (truckId, driverId) => api.post(`/trucks/${truckId}/assign-driver`, { driverId }).then((res) => res.data);
