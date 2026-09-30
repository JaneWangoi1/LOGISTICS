import { useState } from 'react';

const EMPTY_FORM = { registrationNo: '', make: '', model: '', year: '', mileage: '', status: 'AVAILABLE' };

// One form handles both "add" and "edit" — if `truck` is passed in, its
// values seed the form and the parent's onSave does an update; otherwise
// it starts blank and onSave creates a new one. Keeps the two flows from
// drifting into two slightly-different forms over time.
export default function TruckFormModal({ truck, onSave, onClose }) {
  const [form, setForm] = useState(
    truck
      ? {
          registrationNo: truck.registrationNo,
          make: truck.make || '',
          model: truck.model || '',
          year: truck.year || '',
          mileage: truck.mileage || '',
          status: truck.status,
        }
      : EMPTY_FORM
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({
        ...form,
        year: form.year ? Number(form.year) : null,
        mileage: form.mileage ? Number(form.mileage) : 0,
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save this truck.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{truck ? 'Edit truck' : 'Add truck'}</h2>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="registrationNo">Registration number</label>
            <input
              id="registrationNo"
              name="registrationNo"
              value={form.registrationNo}
              onChange={handleChange}
              placeholder="KDA 123A"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="make">Make</label>
              <input id="make" name="make" value={form.make} onChange={handleChange} placeholder="Mercedes" />
            </div>
            <div className="form-group">
              <label htmlFor="model">Model</label>
              <input id="model" name="model" value={form.model} onChange={handleChange} placeholder="Actros" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Year</label>
              <input id="year" name="year" type="number" value={form.year} onChange={handleChange} placeholder="2021" />
            </div>
            <div className="form-group">
              <label htmlFor="mileage">Mileage (km)</label>
              <input id="mileage" name="mileage" type="number" value={form.mileage} onChange={handleChange} placeholder="245800" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On trip</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Inactive</option>
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
      </div>
    </div>
  );
}
