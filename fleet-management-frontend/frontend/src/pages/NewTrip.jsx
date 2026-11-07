import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { getCustomers, createCustomer } from '../api/customers';
import { getTrucks } from '../api/trucks';
import { getDrivers } from '../api/drivers';
import { createTrip } from '../api/trips';

const EMPTY_FORM = {
  customerId: '', newCustomerName: '', truckId: '', driverId: '',
  origin: '', destination: '', cargoDescription: '', cargoWeightTonnes: '',
  departureDate: '', expectedReturnDate: '', actualReturnDate: '', agreedRevenue: '', notes: '',
};

// Two jobs in one form. Booking a live trip ties up a truck and a driver. Logging a trip
// that has already finished (the "Log income" button) just records the income, so it can
// use any truck or driver, even one that is out on another job today.
export default function NewTrip() {
  const [searchParams] = useSearchParams();
  const [finished, setFinished] = useState(searchParams.get('logged') === '1');
  const [customers, setCustomers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getCustomers(), getTrucks(), getDrivers()]).then(([c, t, d]) => {
      setCustomers(c); setTrucks(t); setDrivers(d); setLoading(false);
    });
  }, []);

  const set = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  function toggleFinished(checked) {
    setFinished(checked);
    setForm({ ...form, truckId: '', driverId: '' }); // the lists change, so the old choice may no longer be valid
  }

  function handleCustomerSelect(e) {
    if (e.target.value === '__new__') { setAddingCustomer(true); setForm({ ...form, customerId: '' }); }
    else { setAddingCustomer(false); setForm({ ...form, customerId: e.target.value }); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let customerId = form.customerId;
      if (addingCustomer) {
        if (!form.newCustomerName.trim()) throw { response: { data: { error: 'Enter a name for the new customer.' } } };
        customerId = (await createCustomer({ name: form.newCustomerName.trim() })).id;
      }
      if (!customerId) throw { response: { data: { error: 'Choose a customer, or add a new one.' } } };

      const trip = await createTrip({
        customerId,
        truckId: form.truckId,
        driverId: form.driverId,
        origin: form.origin,
        destination: form.destination,
        cargoDescription: form.cargoDescription,
        cargoWeightTonnes: form.cargoWeightTonnes ? Number(form.cargoWeightTonnes) : null,
        departureDate: form.departureDate,
        expectedReturnDate: form.expectedReturnDate || null,
        agreedRevenue: Number(form.agreedRevenue),
        notes: form.notes,
        ...(finished ? { status: 'COMPLETED', actualReturnDate: form.actualReturnDate || form.departureDate } : {}),
      });
      navigate(finished ? '/income' : `/trips/${trip.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save the trip.');
      setSaving(false);
    }
  }

  if (loading) return <p>Loading…</p>;

  const truckChoices = finished ? trucks : trucks.filter((t) => t.status === 'AVAILABLE');
  const driverChoices = finished ? drivers : drivers.filter((d) => d.employmentStatus === 'ACTIVE');

  return (
    <div className="form-page">
      <Link to={finished ? '/income' : '/trips'} className="back-link">← Back</Link>
      <div className="content-header"><h1>{finished ? 'Log income' : 'New trip'}</h1></div>

      <div className="panel">
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="check-row">
            <input type="checkbox" checked={finished} onChange={(e) => toggleFinished(e.target.checked)} />
            This trip has already finished (just log it for the records)
          </label>

          <div className="form-group">
            <label htmlFor="customerId">Customer</label>
            <select id="customerId" value={addingCustomer ? '__new__' : form.customerId} onChange={handleCustomerSelect} required={!addingCustomer}>
              <option value="">Select a customer…</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__new__">+ Add new customer</option>
            </select>
          </div>
          {addingCustomer && (
            <div className="form-group">
              <label htmlFor="newCustomerName">New customer name</label>
              <input id="newCustomerName" name="newCustomerName" value={form.newCustomerName} onChange={set} placeholder="ABC Logistics" required />
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="truckId">Truck</label>
              <select id="truckId" name="truckId" value={form.truckId} onChange={set} required>
                <option value="">{finished ? 'Select a truck…' : 'Select an available truck…'}</option>
                {truckChoices.map((t) => <option key={t.id} value={t.id}>{t.registrationNo}</option>)}
              </select>
              {truckChoices.length === 0 && <p className="field-hint">No trucks are currently available.</p>}
            </div>
            <div className="form-group">
              <label htmlFor="driverId">Driver</label>
              <select id="driverId" name="driverId" value={form.driverId} onChange={set} required>
                <option value="">{finished ? 'Select a driver…' : 'Select an active driver…'}</option>
                {driverChoices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group"><label htmlFor="origin">From</label><input id="origin" name="origin" value={form.origin} onChange={set} placeholder="Nairobi" required /></div>
            <div className="form-group"><label htmlFor="destination">To</label><input id="destination" name="destination" value={form.destination} onChange={set} placeholder="Mombasa" required /></div>
          </div>

          <div className="form-row">
            <div className="form-group"><label htmlFor="agreedRevenue">Amount (KES)</label><input id="agreedRevenue" name="agreedRevenue" type="number" min="1" step="any" value={form.agreedRevenue} onChange={set} placeholder="185000" required /></div>
            <div className="form-group"><label htmlFor="cargoWeightTonnes">Cargo (tonnes)</label><input id="cargoWeightTonnes" name="cargoWeightTonnes" type="number" min="0" step="any" value={form.cargoWeightTonnes} onChange={set} placeholder="20" /></div>
          </div>

          <div className="form-row">
            <div className="form-group"><label htmlFor="departureDate">Departure date</label><input id="departureDate" name="departureDate" type="date" value={form.departureDate} onChange={set} required /></div>
            {finished
              ? <div className="form-group"><label htmlFor="actualReturnDate">Return date</label><input id="actualReturnDate" name="actualReturnDate" type="date" value={form.actualReturnDate} onChange={set} /></div>
              : <div className="form-group"><label htmlFor="expectedReturnDate">Expected return</label><input id="expectedReturnDate" name="expectedReturnDate" type="date" value={form.expectedReturnDate} onChange={set} /></div>}
          </div>

          <div className="form-group"><label htmlFor="cargoDescription">Cargo description</label><input id="cargoDescription" name="cargoDescription" value={form.cargoDescription} onChange={set} placeholder="General cargo" /></div>
          <div className="form-group"><label htmlFor="notes">Notes (optional)</label><input id="notes" name="notes" value={form.notes} onChange={set} placeholder="Cross-border transit" /></div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate(finished ? '/income' : '/trips')}>Cancel</button>
            <button type="submit" className="btn-accent" disabled={saving}>{saving ? 'Saving…' : finished ? 'Save entry' : 'Create trip'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
