import api from './client';

export const getTrips = (status) => api.get('/trips', { params: status ? { status } : {} }).then((res) => res.data);
export const getTrip = (id) => api.get(`/trips/${id}`).then((res) => res.data);
export const createTrip = (data) => api.post('/trips', data).then((res) => res.data);
export const updateTrip = (id, data) => api.put(`/trips/${id}`, data).then((res) => res.data);
export const deleteTrip = (id) => api.delete(`/trips/${id}`).then((res) => res.data);
export const recordPayment = (tripId, data) => api.post(`/trips/${tripId}/payments`, data).then((res) => res.data);
export const deletePayment = (tripId, paymentId) => api.delete(`/trips/${tripId}/payments/${paymentId}`).then((res) => res.data);
