import { useState } from 'react';

export default function PaymentFormModal({ onSave, onClose }) {
  const [form, setForm] = useState({ amount: '', paymentStatus: 'PAID', paymentDate: new Date().toISOString().slice(0, 10), invoiceReference: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({ ...form, amount: Number(form.amount) });
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record the payment.');
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2>Record payment</h2>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="amount">Amount (KES)</label>
            <input id="amount" name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="150000" required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="paymentStatus">Status</label>
              <select id="paymentStatus" name="paymentStatus" value={form.paymentStatus} onChange={handleChange}>
                <option value="PENDING">Pending</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="paymentDate">Date</label>
              <input id="paymentDate" name="paymentDate" type="date" value={form.paymentDate} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="invoiceReference">Invoice reference (optional)</label>
            <input id="invoiceReference" name="invoiceReference" value={form.invoiceReference} onChange={handleChange} placeholder="INV-0045" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-accent" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
