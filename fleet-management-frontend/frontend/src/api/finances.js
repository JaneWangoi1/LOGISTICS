import api from './client';

export function getFinanceSummary(month) {
  return api.get(`/finances/summary?month=${month}`).then((res) => res.data);
}
export function getProfitByTruck(month) {
  return api.get(`/finances/by-truck?month=${month}`).then((res) => res.data);
}
