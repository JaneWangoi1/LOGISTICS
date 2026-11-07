import { useState } from 'react';
import Modal, { ModalActions, useSubmit } from './Modal';
import { localISO } from '../constants';

export default function MaintenanceFormModal({ trucks, onSave, onClose }) {
  const [form, setForm] = useState({
    truckId: '', serviceType: '', cost: '', serviceDate: localISO(),
    mileageAtService: '', nextServiceDueMileage: '', nextServiceDueDate: '', notes: '',
  });
  const { error, saving, submit } = useSubmit(onSave);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const num = (v) => (v !== '' ? Number(v) : null);

  const payload = {
    ...form,
    cost: num(form.cost),
    mileageAtService: num(form.mileageAtService),
    nextServiceDueMileage: num(form.nextServiceDueMileage),
  };

  return (
    <Modal title="Add service record" onClose={onClose} error={error}>
      <form onSubmit={(e) => submit(e, payload)}>
        {trucks && (
          <div className="form-group">
            <label htmlFor="truckId">Truck</label>
            <select id="truckId" name="truckId" value={form.truckId} onChange={set} required>
              <option value="">Select a truck…</option>
              {trucks.map((t) => <option key={t.id} value={t.id}>{t.registrationNo}</option>)}
            </select>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="serviceType">Service type</label>
          <input id="serviceType" name="serviceType" value={form.serviceType} onChange={set} placeholder="Oil change" required />
        </div>
        <div className="form-row">
          <div className="form-group"><label htmlFor="serviceDate">Service date</label><input id="serviceDate" name="serviceDate" type="date" value={form.serviceDate} onChange={set} required /></div>
          <div className="form-group"><label htmlFor="cost">Cost (KES)</label><input id="cost" name="cost" type="number" min="0" value={form.cost} onChange={set} placeholder="8000" /></div>
        </div>
        <div className="form-group"><label htmlFor="mileageAtService">Mileage at service (km)</label><input id="mileageAtService" name="mileageAtService" type="number" min="0" value={form.mileageAtService} onChange={set} placeholder="238000" /></div>
        <div className="form-row">
          <div className="form-group"><label htmlFor="nextServiceDueMileage">Next due at (km)</label><input id="nextServiceDueMileage" name="nextServiceDueMileage" type="number" min="0" value={form.nextServiceDueMileage} onChange={set} placeholder="248000" /></div>
          <div className="form-group"><label htmlFor="nextServiceDueDate">Next due on</label><input id="nextServiceDueDate" name="nextServiceDueDate" type="date" value={form.nextServiceDueDate} onChange={set} /></div>
        </div>
        <div className="form-group"><label htmlFor="notes">Notes (optional)</label><input id="notes" name="notes" value={form.notes} onChange={set} /></div>
        <ModalActions onClose={onClose} saving={saving} />
      </form>
    </Modal>
  );
}
