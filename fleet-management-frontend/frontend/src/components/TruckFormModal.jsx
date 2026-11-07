import { useState } from 'react';
import Modal, { ModalActions, useSubmit } from './Modal';

export default function TruckFormModal({ truck, onSave, onClose }) {
  const [form, setForm] = useState({
    registrationNo: truck?.registrationNo || '',
    make: truck?.make || '',
    model: truck?.model || '',
    year: truck?.year || '',
    capacityTonnes: truck?.capacityTonnes != null ? Number(truck.capacityTonnes) : '',
    mileage: truck?.mileage ?? '',
    status: truck?.status || 'AVAILABLE',
  });
  const { error, saving, submit } = useSubmit(onSave);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const payload = {
    ...form,
    year: form.year ? Number(form.year) : null,
    capacityTonnes: form.capacityTonnes !== '' ? Number(form.capacityTonnes) : null,
    mileage: form.mileage !== '' ? Number(form.mileage) : 0,
  };

  return (
    <Modal title={truck ? 'Edit truck' : 'Add truck'} onClose={onClose} error={error}>
      <form onSubmit={(e) => submit(e, payload)}>
        <div className="form-group">
          <label htmlFor="registrationNo">Registration number</label>
          <input id="registrationNo" name="registrationNo" value={form.registrationNo} onChange={set} placeholder="KDA 123A" required />
        </div>
        <div className="form-row">
          <div className="form-group"><label htmlFor="make">Make</label><input id="make" name="make" value={form.make} onChange={set} placeholder="Mercedes" /></div>
          <div className="form-group"><label htmlFor="model">Model</label><input id="model" name="model" value={form.model} onChange={set} placeholder="Actros" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label htmlFor="year">Year</label><input id="year" name="year" type="number" value={form.year} onChange={set} placeholder="2021" /></div>
          <div className="form-group"><label htmlFor="capacityTonnes">Capacity (tonnes)</label><input id="capacityTonnes" name="capacityTonnes" type="number" step="0.5" min="0" value={form.capacityTonnes} onChange={set} placeholder="28" /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label htmlFor="mileage">Mileage (km)</label><input id="mileage" name="mileage" type="number" min="0" value={form.mileage} onChange={set} placeholder="245800" /></div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={form.status} onChange={set}>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On trip</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
        <ModalActions onClose={onClose} saving={saving} />
      </form>
    </Modal>
  );
}
