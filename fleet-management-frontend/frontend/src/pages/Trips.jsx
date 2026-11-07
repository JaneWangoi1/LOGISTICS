import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrips } from '../api/trips';
import StatusBadge, { TRIP_STATUS_CONFIG } from '../components/StatusBadge';

const TABS = [
  { key: '', label: 'All' },
  { key: 'ONGOING', label: 'Ongoing' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CANCELLED', label: 'Cancelled' },
];

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getTrips(filter || undefined).then(setTrips).finally(() => setLoading(false));
  }, [filter]);

  return (
    <>
      <div className="content-header content-header-row">
        <div>
          <h1>Trips</h1>
          <p>{trips.length} {trips.length === 1 ? 'trip' : 'trips'}{filter ? ` (${filter.toLowerCase()})` : ''}</p>
        </div>
        <button className="btn-accent" onClick={() => navigate('/trips/new')}>+ New trip</button>
      </div>
      <div className="filter-tabs">
        {TABS.map((tab) => (
          <button key={tab.key} className={`filter-tab${filter === tab.key ? ' active' : ''}`} onClick={() => setFilter(tab.key)}>{tab.label}</button>
        ))}
      </div>
      <div className="panel">
        {loading ? <p>Loading…</p> : trips.length === 0 ? (
          <div className="empty-state"><p>No trips {filter ? filter.toLowerCase() : ''} yet.</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Route</th><th>Customer</th><th>Truck / Driver</th><th>Departure</th><th>Revenue</th><th>Status</th></tr></thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} onClick={() => navigate(`/trips/${trip.id}`)}>
                  <td><div className="route-cell"><span>{trip.origin}</span><span className="route-arrow">→</span><span>{trip.destination}</span></div></td>
                  <td>{trip.Customer?.name}</td>
                  <td><span className="plate">{trip.Truck?.registrationNo}</span> · {trip.Driver?.name}</td>
                  <td>{trip.departureDate}</td>
                  <td>KES {Number(trip.agreedRevenue).toLocaleString()}</td>
                  <td><StatusBadge status={trip.status} config={TRIP_STATUS_CONFIG} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
