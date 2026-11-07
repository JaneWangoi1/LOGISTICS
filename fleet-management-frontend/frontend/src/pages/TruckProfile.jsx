import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getTruck, updateTruck, deleteTruck, assignDriver } from '../api/trucks';
import { createDocument } from '../api/documents';
import { createMaintenance } from '../api/maintenance';
import StatusBadge, {
  TRUCK_STATUS_CONFIG, DOCUMENT_STATUS_CONFIG, MAINTENANCE_STATUS_CONFIG, TRIP_STATUS_CONFIG, maintenanceState,
} from '../components/StatusBadge';
import TruckFormModal from '../components/TruckFormModal';
import AssignDriverModal from '../components/AssignDriverModal';
import DocumentFormModal from '../components/DocumentFormModal';
import MaintenanceFormModal from '../components/MaintenanceFormModal';
import { kes, formatDate, documentTypeLabel } from '../constants';

export default function TruckProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [actionError, setActionError] = useState('');
  const [modal, setModal] = useState(null); // 'edit' | 'assign' | 'document' | 'service'

  useEffect(() => { load(); }, [id]);

  // `quiet` refreshes in place without flashing the page back to "Loading…"
  function load(quiet = false) {
    if (!quiet) setLoading(true);
    getTruck(id).then(setTruck).catch((err) => { if (err.response?.status === 404) setNotFound(true); }).finally(() => setLoading(false));
  }

  const save = (action) => async (data) => { await action(data); setModal(null); load(true); };

  async function handleDelete() {
    setActionError('');
    if (!window.confirm(`Delete ${truck.registrationNo}? This only works for a truck with no trips or expenses. Otherwise set it to Inactive instead.`)) return;
    try {
      await deleteTruck(id);
      navigate('/trucks', { replace: true });
    } catch (err) {
      setActionError(err.response?.data?.error || 'Could not delete the truck.');
    }
  }

  if (loading) return <p>Loading…</p>;
  if (notFound) return <div className="panel empty-state"><p>That truck doesn't exist, or may have been removed.</p><Link to="/trucks" className="back-link">← Back to trucks</Link></div>;

  const currentAssignment = truck.TruckDriverAssignments?.[0];
  const empty = (text) => <p className="muted" style={{ fontSize: '0.9rem' }}>{text}</p>;

  return (
    <>
      <Link to="/trucks" className="back-link">← Back to trucks</Link>
      <div className="profile-header">
        <h1 className="plate">{truck.registrationNo}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => setModal('edit')}>Edit</button>
          <button className="btn-secondary danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>
      {actionError && <div className="form-error">{actionError}</div>}

      <div className="profile-grid">
        <div className="panel profile-section">
          <h3>Details</h3>
          <div className="detail-row"><span className="detail-label">Make</span><span>{truck.make || '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Model</span><span>{truck.model || '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Year</span><span>{truck.year || '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Capacity</span><span>{truck.capacityTonnes != null ? `${Number(truck.capacityTonnes)} tonnes` : '—'}</span></div>
          <div className="detail-row"><span className="detail-label">Mileage</span><span>{truck.mileage?.toLocaleString() ?? 0} km</span></div>
          <div className="detail-row"><span className="detail-label">Status</span><StatusBadge status={truck.status} config={TRUCK_STATUS_CONFIG} /></div>
        </div>
        <div className="panel profile-section">
          <div className="section-head">
            <h3 style={{ marginBottom: 0 }}>Current driver</h3>
            <button className="btn-secondary" onClick={() => setModal('assign')}>{currentAssignment?.Driver ? 'Reassign' : 'Assign'}</button>
          </div>
          {currentAssignment?.Driver ? (
            <div className="detail-row"><Link to={`/drivers/${currentAssignment.Driver.id}`} className="cell-link">{currentAssignment.Driver.name}</Link><span className="detail-label">{currentAssignment.Driver.phone}</span></div>
          ) : empty('No driver currently assigned.')}
        </div>
      </div>

      <div className="panel profile-section">
        <div className="section-head">
          <h3 style={{ marginBottom: 0 }}>Documents</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link to={`/compliance?truck=${truck.id}`} className="section-link">Manage</Link>
            <button className="btn-secondary" onClick={() => setModal('document')}>+ Add</button>
          </div>
        </div>
        {truck.TruckDocuments.length > 0 ? truck.TruckDocuments.map((doc) => (
          <div className="detail-row" key={doc.id}>
            <span>{documentTypeLabel(doc.documentType)}{doc.documentNumber && <span className="muted mono-cell">  {doc.documentNumber}</span>}</span>
            <span className="status-line"><span className="detail-label">{formatDate(doc.expiryDate)}</span><StatusBadge status={doc.status} config={DOCUMENT_STATUS_CONFIG} /></span>
          </div>
        )) : empty('No documents recorded yet.')}
      </div>

      <div className="panel profile-section">
        <div className="section-head">
          <h3 style={{ marginBottom: 0 }}>Maintenance history</h3>
          <button className="btn-secondary" onClick={() => setModal('service')}>+ Add</button>
        </div>
        {truck.MaintenanceRecords.length > 0 ? truck.MaintenanceRecords.map((record) => (
          <div className="detail-row" key={record.id}>
            <span>{record.serviceType.trim()}</span>
            <span className="status-line"><span className="detail-label">{formatDate(record.serviceDate)}</span><StatusBadge status={maintenanceState(record)} config={MAINTENANCE_STATUS_CONFIG} /></span>
          </div>
        )) : empty('No maintenance recorded yet.')}
      </div>

      <div className="panel profile-section">
        <h3>Recent trips</h3>
        {truck.recentTrips.length > 0 ? truck.recentTrips.map((trip) => (
          <div className="detail-row" key={trip.id}>
            <span><Link to={`/trips/${trip.id}`} className="cell-link">{trip.origin} → {trip.destination}</Link><span className="muted">  {trip.customer}</span></span>
            <span className="status-line"><span className="detail-label">{formatDate(trip.departureDate)}, {kes(trip.agreedRevenue)}</span><StatusBadge status={trip.status} config={TRIP_STATUS_CONFIG} /></span>
          </div>
        )) : empty('No trips yet.')}
      </div>

      {modal === 'edit' && <TruckFormModal truck={truck} onSave={save((d) => updateTruck(id, d))} onClose={() => setModal(null)} />}
      {modal === 'assign' && <AssignDriverModal currentDriverId={currentAssignment?.Driver?.id} onSave={save((driverId) => assignDriver(id, driverId))} onClose={() => setModal(null)} />}
      {modal === 'document' && <DocumentFormModal onSave={save((d) => createDocument(id, d))} onClose={() => setModal(null)} />}
      {modal === 'service' && <MaintenanceFormModal onSave={save((d) => createMaintenance(id, d))} onClose={() => setModal(null)} />}
    </>
  );
}
