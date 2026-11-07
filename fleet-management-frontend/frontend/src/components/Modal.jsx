import { useState } from 'react';

export default function Modal({ title, onClose, error, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {error && <div className="form-error" role="alert">{error}</div>}
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ onClose, saving, label = 'Save' }) {
  return (
    <div className="modal-actions">
      <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
      <button type="submit" className="btn-accent" disabled={saving}>{saving ? 'Saving…' : label}</button>
    </div>
  );
}

// Shared submit handling for the forms: runs onSave, and shows the server's own
// message (for example "A truck with that registration number already exists.") if it refuses.
export function useSubmit(onSave) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(e, payload) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(payload);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save. Please try again.');
      setSaving(false);
    }
  }
  return { error, saving, submit };
}
