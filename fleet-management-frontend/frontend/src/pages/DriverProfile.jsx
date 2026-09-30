import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDriver, updateDriver } from '../api/drivers';
import StatusBadge, { DRIVER_STATUS_CONFIG } from '../components/StatusBadge';
import DriverFormModal from '../components/DriverFormModal';

export default function DriverProfile() {
  const { id } = useParams();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  function load() {
    setLoading(true);
    getDriver(id)
      .then(setDriver)
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }

  async function handleEdit(data) {
    const updated = await updateDriver(id, data);
    setDriver({ ...driver, ...updated });
    setShowEditModal(false);
  }

  if (loading) return <p>Loading…</p>;

  if (notFound) {
    return (
      <div className="panel empty-state">
        <p>That driver doesn't exist, or may have been removed.</p>
        <Link to="/drivers" className="back-link">← Back to drivers</Link>
      </div>
    );
  }

  const assignments = driver.TruckDriverAssignments || [];

  return (
    <>
      <Link to="/drivers" className="back-link">← Back to drivers</Link>

      <div className="profile-header">
        <h1>{driver.name}</h1>
        <button className="btn-secondary" onClick={() => setShowEditModal(true)}>
          Edit
        </button>
      </div>

      <div className="profile-grid">
        <div className="panel profile-section">
          <h3>Details</h3>
          <div className="detail-row">
            <span className="detail-label">Phone</span>
            <span>{driver.phone || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">ID number</span>
            <span>{driver.idNumber || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">License number</span>
            <span>{driver.licenseNumber || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">License class</span>
            <span>{driver.licenseClass || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">License expiry</span>
            <span>{driver.licenseExpiry || '—'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <StatusBadge status={driver.employmentStatus} config={DRIVER_STATUS_CONFIG} />
          </div>
        </div>

        <div className="panel profile-section">
          <h3>Assignment history</h3>
          {assignments.length > 0 ? (
            assignments.map((a) => (
              <div className="detail-row" key={a.id}>
                <span className="plate">{a.Truck?.registrationNo}</span>
                <span className="detail-label">
                  {a.assignedFrom} → {a.assignedTo || 'present'}
                </span>
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Not assigned to any truck yet — assign one from that truck's profile page.
            </p>
          )}
        </div>
      </div>

      <div className="panel profile-section">
        <h3>Trip history</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          No trips recorded yet — trip tracking comes with Phase 5.
        </p>
      </div>

      {showEditModal && (
        <DriverFormModal driver={driver} onSave={handleEdit} onClose={() => setShowEditModal(false)} />
      )}
    </>
  );
}
