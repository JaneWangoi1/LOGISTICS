// Shared date and status helpers. Nothing here is stored in the database:
// every status is worked out from "today" at the moment of the request, so
// it can never go stale. The Dashboard, the Compliance page and the truck
// profile all call these same functions, so they cannot disagree.

const SOON_DAYS = 30; // how far ahead "expiring soon" looks

// A date as YYYY-MM-DD in the server's local time. (toISOString() would give
// the UTC date, which in Nairobi is still "yesterday" between midnight and 3am.)
function localDateStr(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Whole days from today until a YYYY-MM-DD date. Negative means it is in the past.
function daysUntil(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(year, month - 1, day) - today) / 86400000);
}

function expiryStatus(expiryDate) {
  const days = daysUntil(expiryDate);
  if (days < 0) return 'EXPIRED';
  if (days <= SOON_DAYS) return 'EXPIRING_SOON';
  return 'VALID';
}

// Works out which maintenance records are "due for service".
//
// A record is due when the truck's mileage has reached its next-due mileage,
// or today has reached its next-due date. But only the LATEST record of each
// type of service counts. Once an oil change is done again, the old oil-change
// record's thresholds are history, not a reminder. Without this rule, every old
// record would read "due" forever once the truck passed its mileage.
function annotateMaintenance(records, truckMileage) {
  const today = localDateStr();
  const typeOf = (record) => record.serviceType.trim().toLowerCase();

  const latestByType = new Map();
  for (const record of records) {
    const current = latestByType.get(typeOf(record));
    const isNewer =
      !current ||
      record.serviceDate > current.serviceDate ||
      (record.serviceDate === current.serviceDate && record.id > current.id);
    if (isNewer) latestByType.set(typeOf(record), record);
  }

  return records.map((record) => {
    const isLatest = latestByType.get(typeOf(record)) === record;
    const mileageDue = record.nextServiceDueMileage != null && truckMileage >= record.nextServiceDueMileage;
    const dateDue = record.nextServiceDueDate != null && record.nextServiceDueDate <= today;
    return { ...record, superseded: !isLatest, due: isLatest && (mileageDue || dateDue) };
  });
}

// Same thing for a list mixing several trucks' records. Each record must carry
// its Truck (with mileage) so it is checked against the right odometer.
function annotateMaintenanceByTruck(records) {
  const byTruck = new Map();
  for (const record of records) {
    if (!byTruck.has(record.truckId)) byTruck.set(record.truckId, []);
    byTruck.get(record.truckId).push(record);
  }
  const annotated = [];
  for (const list of byTruck.values()) {
    annotated.push(...annotateMaintenance(list, list[0].Truck?.mileage ?? 0));
  }
  return annotated;
}

module.exports = { SOON_DAYS, localDateStr, daysUntil, expiryStatus, annotateMaintenance, annotateMaintenanceByTruck };
