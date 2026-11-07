// Drops blank filters so they don't end up in the URL as ?truckId=&from=
export const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value != null));
