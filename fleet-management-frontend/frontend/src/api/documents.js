import api from './client';

export const getDocuments = () => api.get('/documents').then((res) => res.data);
export const createDocument = (truckId, data) => api.post(`/trucks/${truckId}/documents`, data).then((res) => res.data);
export const updateDocument = (id, data) => api.put(`/documents/${id}`, data).then((res) => res.data);
export const deleteDocument = (id) => api.delete(`/documents/${id}`).then((res) => res.data);
