import api from './client';

export function getDrivers() {
  return api.get('/drivers').then((res) => res.data);
}

export function getDriver(id) {
  return api.get(`/drivers/${id}`).then((res) => res.data);
}

export function createDriver(data) {
  return api.post('/drivers', data).then((res) => res.data);
}

export function updateDriver(id, data) {
  return api.put(`/drivers/${id}`, data).then((res) => res.data);
}
