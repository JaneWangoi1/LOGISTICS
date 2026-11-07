import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDriver, updateDriver, deleteDriver } from '../api/drivers';
import StatusBadge, { DRIVER_STATUS_CONFIG, TRIP_STATUS_CONFIG } from '../components/StatusBadge';
import DriverFormModal from '../components/DriverFormModal';
import { kes, formatDate } from '../constants';

export default function DriverProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => { load(); }, [id]);

  function load(quiet = false) {
    if (!quiet) setLoading(true);
    getDriver(id).then(setDriver).catch((err) => { if (err.response?.status === 404) setNotFound(true); }).finally(() => setLoading(false));
  }

  async function handleEdit(data) {
    await updateDriver(id, data);
    setShowEdit(false);
    load(true);
  }

  async function handleDelete() {
    setActionError('');
    if (!window.confirm(`Delete ${driver.name}? This only works for a driver who has never been on a trip. Otherwise set them to Terminated instead.`)) return;
    try {
      await deleteDriver(id);
      navigate('/drivers', { replace: true });
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not delete the driver.');
    }
  }

  if (loading) return <p>Loading…</p>;
  if (notFound) return <div className="panel empty-state"><p>That driver doesn't exist, or may have been removed.</p><Link to="/drivers" className="back-link">← Back to drivers</Link></div>;

  const assignments = driver.TruckDriverAssignments || [];
  const empty = (text) => <p className="muted" style={{ fontSize: '0.9rem' }}>{text}</p>;

  return (
    <>
      <Link to="/drivers" className="back-link">← Back to drivers</Link>
      <div className="profile-header">
        <h1>{driver.name}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="btn-secondary danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>
      {actionError && <div className="form-error">{actionError}</div>}

      <div className="profile-grid">
        <div className="panel profile-section">
          <h3>Details</h3>
          <div className="detail-row"><span className="detail-label">Phone</span><span>{driver.phone || '—'}</span></div>
          <div className="detail-row"><span className="detail-label">ID number</span><span>{driver.idNumber || '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Licence number</span><span>{driver.licenseNumber || '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Licence class</span><span>{driver.licenseClass || '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Licence expiry</span><span>{driver.licenseExpiry ? formatDate(driver.licenseExpiry) : '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Status</span><StatusBadge status={driver.employmentStatus} config={DRIVER_STATUS_CONFIG} /></div>
        </div>
        <div className="panel profile-section">
          <h3>Assignment history</h3>
          {assignments.length > 0 ? assignments.map((a) => (
            <div className="detail-row" key={a.id}>
              <Link to={`/trucks/${a.Truck?.id}`} className="plate cell-link">{a.Truck?.registrationNo}</Link>
              <span className="detail-label">{formatDate(a.assignedFrom)} → {a.assignedTo ? formatDate(a.assignedTo) : 'present'}</span>
            </div>
          )) : empty("Not assigned to any truck yet. Assign one from that truck's profile page.")}
        </div>
      </div>

      <div className="panel profile-section">
        <h3>Trip history</h3>
        {driver.trips.length > 0 ? driver.trips.map((trip) => (
          <div className="detail-row" key={trip.id}>
            <span><Link to={`/trips/${trip.id}`} className="cell-link">{trip.origin} → {trip.destination}</Link><span className="muted">  {trip.customer}, <span className="plate">{trip.registrationNo}</span></span></span>
            <span className="status-line"><span className="detail-label">{formatDate(trip.departureDate)}, {kes(trip.agreedRevenue)}</span><StatusBadge status={trip.status} config={TRIP_STATUS_CONFIG} /></span>
          </div>
        )) : empty('No trips yet.')}
      </div>

      {showEdit && <DriverFormModal driver={driver} onSave={handleEdit} onClose={() => setShowEdit(false)} />}
    </>
  );
}
