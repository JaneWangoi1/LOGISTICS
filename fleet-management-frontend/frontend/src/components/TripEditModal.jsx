import { useState } from 'react';
import Modal, { ModalActions, useSubmit } from './Modal';

// Corrects a trip's details. (The truck and driver are fixed once a trip exists. If
// those were wrong, cancel the trip and log it again.)
export default function TripEditModal({ trip, onSave, onClose }) {
  const [form, setForm] = useState({
    origin: trip.origin || '',
    destination: trip.destination || '',
    cargoDescription: trip.cargoDescription || '',
    cargoWeightTonnes: trip.cargoWeightTonnes != null ? Number(trip.cargoWeightTonnes) : '',
    departureDate: trip.departureDate || '',
    expectedReturnDate: trip.expectedReturnDate || '',
    actualReturnDate: trip.actualReturnDate || '',
    agreedRevenue: trip.agreedRevenue != null ? Number(trip.agreedRevenue) : '',
    notes: trip.notes || '',
  });
  const { error, saving, submit } = useSubmit(onSave);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const payload = { ...form, agreedRevenue: Number(form.agreedRevenue) };
  if (trip.status !== 'COMPLETED') delete payload.actualReturnDate;

  return (
    <Modal title="Edit trip" onClose={onClose} error={error}>
      <form onSubmit={(e) => submit(e, payload)}>
        <div className="form-row">
          <div className="form-group"><label htmlFor="origin">From</label><input id="origin" name="origin" value={form.origin} onChange={set} required /></div>
          <div className="form-group"><label htmlFor="destination">To</label><input id="destination" name="destination" value={form.destination} onChange={set} required /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label htmlFor="agreedRevenue">Amount (KES)</label><input id="agreedRevenue" name="agreedRevenue" type="number" min="1" step="any" value={form.agreedRevenue} onChange={set} required /></div>
          <div className="form-group"><label htmlFor="cargoWeightTonnes">Cargo (tonnes)</label><input id="cargoWeightTonnes" name="cargoWeightTonnes" type="number" min="0" step="any" value={form.cargoWeightTonnes} onChange={set} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label htmlFor="departureDate">Departure</label><input id="departureDate" name="departureDate" type="date" value={form.departureDate} onChange={set} required /></div>
          <div className="form-group"><label htmlFor="expectedReturnDate">Expected return</label><input id="expectedReturnDate" name="expectedReturnDate" type="date" value={form.expectedReturnDate} onChange={set} /></div>
        </div>
        {trip.status === 'COMPLETED' && (
          <div className="form-group"><label htmlFor="actualReturnDate">Actual return</label><input id="actualReturnDate" name="actualReturnDate" type="date" value={form.actualReturnDate} onChange={set} /></div>
        )}
        <div className="form-group"><label htmlFor="cargoDescription">Cargo description</label><input id="cargoDescription" name="cargoDescription" value={form.cargoDescription} onChange={set} /></div>
        <div className="form-group"><label htmlFor="notes">Notes</label><input id="notes" name="notes" value={form.notes} onChange={set} placeholder="Cross-border transit" /></div>
        <ModalActions onClose={onClose} saving={saving} />
      </form>
    </Modal>
  );
}
