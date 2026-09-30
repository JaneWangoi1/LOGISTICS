import api from './client';

// Thin wrappers around the shared axios client — components call these
// instead of writing `api.get('/trucks')` inline everywhere, so if an
// endpoint's shape ever changes, there's exactly one place to update it.
export function getTrucks() {
  return api.get('/trucks').then((res) => res.data);
}

export function getTruck(id) {
  return api.get(`/trucks/${id}`).then((res) => res.data);
}

export function createTruck(data) {
  return api.post('/trucks', data).then((res) => res.data);
}

export function updateTruck(id, data) {
  return api.put(`/trucks/${id}`, data).then((res) => res.data);
}

export function assignDriver(truckId, driverId) {
  return api.post(`/trucks/${truckId}/assign-driver`, { driverId }).then((res) => res.data);
}
