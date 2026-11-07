import { useState } from 'react';
import Modal, { ModalActions, useSubmit } from './Modal';
import { EXPENSE_CATEGORIES, localISO } from '../constants';

// Used three ways: logging a new expense from the Expenses page (pick a truck, or leave it as
// a general cost), logging one from a trip (the truck comes from the trip), and editing.
export default function ExpenseFormModal({ expense, tripId, trucks, onSave, onClose }) {
  const linkedToTrip = Boolean(tripId || expense?.tripId);
  const [form, setForm] = useState({
    category: expense?.category || 'FUEL',
    amount: expense?.amount != null ? Number(expense.amount) : '',
    expenseDate: expense?.expenseDate || localISO(),
    description: expense?.description || '',
    truckId: expense?.truckId || '',
  });
  const { error, saving, submit } = useSubmit(onSave);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const payload = {
    category: form.category,
    amount: Number(form.amount),
    expenseDate: form.expenseDate,
    description: form.description,
    ...(linkedToTrip ? {} : { truckId: form.truckId || null }),
    ...(tripId ? { tripId } : {}),
  };

  return (
    <Modal title={expense ? 'Edit expense' : 'Log expense'} onClose={onClose} error={error}>
      <form onSubmit={(e) => submit(e, payload)}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={set}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="amount">Amount (KES)</label>
            <input id="amount" name="amount" type="number" min="1" step="any" value={form.amount} onChange={set} placeholder="35000" required />
          </div>
        </div>
        {!linkedToTrip && trucks && (
          <div className="form-group">
            <label htmlFor="truckId">Truck</label>
            <select id="truckId" name="truckId" value={form.truckId} onChange={set}>
              <option value="">General (not tied to a truck)</option>
              {trucks.map((t) => <option key={t.id} value={t.id}>{t.registrationNo}</option>)}
            </select>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="expenseDate">Date</label>
          <input id="expenseDate" name="expenseDate" type="date" value={form.expenseDate} onChange={set} required />
        </div>
        <div className="form-group">
          <label htmlFor="description">Notes (optional)</label>
          <input id="description" name="description" value={form.description} onChange={set} placeholder="Full tank, Nairobi to Mombasa" />
        </div>
        <ModalActions onClose={onClose} saving={saving} />
      </form>
    </Modal>
  );
}
