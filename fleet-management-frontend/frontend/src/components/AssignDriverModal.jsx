import { useEffect, useState } from 'react';
import { getDrivers } from '../api/drivers';

// Lets the admin pick any driver from a dropdown, or "No driver" to
// unassign. Reassigning someone already on another truck is allowed on
// purpose — the backend closes out their old assignment automatically,
// which is exactly the history-preserving behavior the schema exists for.
export default function AssignDriverModal({ currentDriverId, onSave, onClose }) {
  const [drivers, setDrivers] = useState([]);
  const [selectedId, setSelectedId] = useState(currentDriverId || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDrivers()
      .then(setDrivers)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(selectedId || null);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not update the assignment.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Assign driver</h2>

        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <p>Loading drivers…</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="driverId">Driver</label>
              <select id="driverId" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                <option value="">No driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-accent" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
