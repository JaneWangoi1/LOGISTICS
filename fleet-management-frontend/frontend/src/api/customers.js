import api from './client';

export function getCustomers() { return api.get('/customers').then((res) => res.data); }
export function createCustomer(data) { return api.post('/customers', data).then((res) => res.data); }
