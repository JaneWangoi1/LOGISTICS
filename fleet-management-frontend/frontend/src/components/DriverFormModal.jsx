import { useState } from 'react';

const EMPTY_FORM = {
  name: '', phone: '', idNumber: '', licenseNumber: '', licenseClass: '', licenseExpiry: '', employmentStatus: 'ACTIVE',
};

export default function DriverFormModal({ driver, onSave, onClose }) {
  const [form, setForm] = useState(
    driver
      ? {
          name: driver.name,
          phone: driver.phone || '',
          idNumber: driver.idNumber || '',
          licenseNumber: driver.licenseNumber || '',
          licenseClass: driver.licenseClass || '',
          licenseExpiry: driver.licenseExpiry || '',
          employmentStatus: driver.employmentStatus,
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
      await onSave(form);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save this driver.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>{driver ? 'Edit driver' : 'Add driver'}</h2>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="John Kamau" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="0700000000" />
            </div>
            <div className="form-group">
              <label htmlFor="idNumber">ID number</label>
              <input id="idNumber" name="idNumber" value={form.idNumber} onChange={handleChange} placeholder="12345678" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="licenseNumber">License number</label>
              <input id="licenseNumber" name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder="DL-001234" />
            </div>
            <div className="form-group">
              <label htmlFor="licenseClass">License class</label>
              <input id="licenseClass" name="licenseClass" value={form.licenseClass} onChange={handleChange} placeholder="CE" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="licenseExpiry">License expiry</label>
              <input id="licenseExpiry" name="licenseExpiry" type="date" value={form.licenseExpiry} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="employmentStatus">Employment status</label>
              <select id="employmentStatus" name="employmentStatus" value={form.employmentStatus} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
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
