import api from './client';

export const getMaintenance = () => api.get('/maintenance').then((res) => res.data);
export const createMaintenance = (truckId, data) => api.post(`/trucks/${truckId}/maintenance`, data).then((res) => res.data);
export const deleteMaintenance = (id) => api.delete(`/maintenance/${id}`).then((res) => res.data);
