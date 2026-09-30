import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTruck, updateTruck, assignDriver } from '../api/trucks';
import StatusBadge, { TRUCK_STATUS_CONFIG } from '../components/StatusBadge';
import TruckFormModal from '../components/TruckFormModal';
import AssignDriverModal from '../components/AssignDriverModal';

export default function TruckProfile() {
  const { id } = useParams();
  const [truck, setTruck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  function load() {
    setLoading(true);
    getTruck(id)
      .then(setTruck)
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }

  async function handleEdit(data) {
    const updated = await updateTruck(id, data);
    setTruck({ ...truck, ...updated });
    setShowEditModal(false);
  }

  async function handleAssign(driverId) {
    await assignDriver(id, driverId);
    setShowAssignModal(false);
    load(); // re-fetch rather than patch locally — the assignment include is nested and easy to get subtly wrong by hand
  }

  if (loading) return <p>Loading…</p>;

  if (notFound) {
    return (
      <div className="panel empty-state">
        <p>That truck doesn't exist, or may have been removed.</p>
        <Link to="/trucks" className="back-link">← Back to trucks</Link>
      </div>
    );
  }

  // The backend includes at most one current assignment (assignedTo: null),
  // via the same TruckDriverAssignment table that will power full driver
  // history once Phase 4 exists.
  const currentAssignment = truck.TruckDriverAssignments?.[0];

  return (
    <>
      <Link to="/trucks" className="back-link">← Back to trucks</Link>

      <div className="profile-header">
        <h1 className="plate">{truck.registrationNo}</h1>
        <button className="btn-secondary" onClick={() => setShowEditModal(true)}>
          Edit
        </button>
      </div>

      <div className="profile-grid">
        <div className="panel profile-section">
          <h3>Details</h3>
          <div className="detail-row">
            <span className="detail-label">Make</span>
            <span>{truck.make || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Model</span>
            <span>{truck.model || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Year</span>
            <span>{truck.year || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Mileage</span>
            <span>{truck.mileage?.toLocaleString() ?? 0} km</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <StatusBadge status={truck.status} config={TRUCK_STATUS_CONFIG} />
          </div>
        </div>

        <div className="panel profile-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: currentAssignment?.Driver ? '0.75rem' : 0 }}>
            <h3 style={{ marginBottom: 0 }}>Current driver</h3>
            <button className="btn-secondary" onClick={() => setShowAssignModal(true)}>
              {currentAssignment?.Driver ? 'Reassign' : 'Assign'}
            </button>
          </div>
          {currentAssignment?.Driver ? (
            <div className="detail-row">
              <span>{currentAssignment.Driver.name}</span>
              <span className="detail-label">{currentAssignment.Driver.phone}</span>
            </div>
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              No driver currently assigned.
            </p>
          )}
        </div>
      </div>

      <div className="panel profile-section">
        <h3>Documents</h3>
        {truck.TruckDocuments?.length > 0 ? (
          truck.TruckDocuments.map((doc) => (
            <div className="detail-row" key={doc.id}>
              <span>{doc.documentType}</span>
              <span className="detail-label">Expires {doc.expiryDate}</span>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            No documents recorded yet — document tracking comes with Phase 7.
          </p>
        )}
      </div>

      <div className="panel profile-section">
        <h3>Maintenance history</h3>
        {truck.MaintenanceRecords?.length > 0 ? (
          truck.MaintenanceRecords.map((record) => (
            <div className="detail-row" key={record.id}>
              <span>{record.serviceType}</span>
              <span className="detail-label">{record.serviceDate}</span>
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            No maintenance recorded yet — full tracking comes with Phase 7.
          </p>
        )}
      </div>

      {showEditModal && (
        <TruckFormModal truck={truck} onSave={handleEdit} onClose={() => setShowEditModal(false)} />
      )}

      {showAssignModal && (
        <AssignDriverModal
          currentDriverId={currentAssignment?.Driver?.id}
          onSave={handleAssign}
          onClose={() => setShowAssignModal(false)}
        />
      )}
    </>
  );
}
