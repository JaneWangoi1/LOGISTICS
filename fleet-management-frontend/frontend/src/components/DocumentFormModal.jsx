import { useState } from 'react';
import Modal, { ModalActions, useSubmit } from './Modal';
import { DOCUMENT_TYPES } from '../constants';

// `trucks` is passed when adding from the Compliance page (so you choose the truck);
// from a truck's own profile the truck is already known.
export default function DocumentFormModal({ document, trucks, onSave, onClose }) {
  const [form, setForm] = useState({
    truckId: '',
    documentType: document?.documentType || 'INSURANCE',
    documentNumber: document?.documentNumber || '',
    expiryDate: document?.expiryDate || '',
  });
  const { error, saving, submit } = useSubmit(onSave);
  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const needsTruck = !document && trucks;

  return (
    <Modal title={document ? 'Edit document' : 'Add document'} onClose={onClose} error={error}>
      <form onSubmit={(e) => submit(e, form)}>
        {needsTruck && (
          <div className="form-group">
            <label htmlFor="truckId">Truck</label>
            <select id="truckId" name="truckId" value={form.truckId} onChange={set} required>
              <option value="">Select a truck…</option>
              {trucks.map((t) => <option key={t.id} value={t.id}>{t.registrationNo}</option>)}
            </select>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="documentType">Document type</label>
          <select id="documentType" name="documentType" value={form.documentType} onChange={set}>
            {DOCUMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="documentNumber">Number (optional)</label>
            <input id="documentNumber" name="documentNumber" value={form.documentNumber} onChange={set} placeholder="INS-2026-0871" />
          </div>
          <div className="form-group">
            <label htmlFor="expiryDate">Expiry date</label>
            <input id="expiryDate" name="expiryDate" type="date" value={form.expiryDate} onChange={set} required />
          </div>
        </div>
        <ModalActions onClose={onClose} saving={saving} />
      </form>
    </Modal>
  );
}
