import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrucks, createTruck } from '../api/trucks';
import StatusBadge, { TRUCK_STATUS_CONFIG } from '../components/StatusBadge';
import TruckFormModal from '../components/TruckFormModal';

export default function Trucks() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadTrucks();
  }, []);

  function loadTrucks() {
    setLoading(true);
    getTrucks()
      .then(setTrucks)
      .finally(() => setLoading(false));
  }

  async function handleAdd(data) {
    await createTruck(data);
    setShowAddModal(false);
    loadTrucks();
  }

  return (
    <>
      <div className="content-header content-header-row">
        <div>
          <h1>Trucks</h1>
          <p>{trucks.length} {trucks.length === 1 ? 'truck' : 'trucks'} in the fleet</p>
        </div>
        <button className="btn-accent" onClick={() => setShowAddModal(true)}>
          + Add truck
        </button>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading…</p>
        ) : trucks.length === 0 ? (
          <div className="empty-state">
            <p>No trucks yet. Add your first one to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Registration</th>
                <th>Make / Model</th>
                <th>Year</th>
                <th>Mileage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trucks.map((truck) => (
                <tr key={truck.id} onClick={() => navigate(`/trucks/${truck.id}`)}>
                  <td className="plate">{truck.registrationNo}</td>
                  <td>{[truck.make, truck.model].filter(Boolean).join(' ') || '—'}</td>
                  <td>{truck.year || '—'}</td>
                  <td>{truck.mileage?.toLocaleString() ?? 0} km</td>
                  <td>
                    <StatusBadge status={truck.status} config={TRUCK_STATUS_CONFIG} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <TruckFormModal onSave={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}
