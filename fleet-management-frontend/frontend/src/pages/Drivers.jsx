import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDrivers, createDriver } from '../api/drivers';
import StatusBadge, { DRIVER_STATUS_CONFIG } from '../components/StatusBadge';
import DriverFormModal from '../components/DriverFormModal';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDrivers();
  }, []);

  function loadDrivers() {
    setLoading(true);
    getDrivers()
      .then(setDrivers)
      .finally(() => setLoading(false));
  }

  async function handleAdd(data) {
    await createDriver(data);
    setShowAddModal(false);
    loadDrivers();
  }

  return (
    <>
      <div className="content-header content-header-row">
        <div>
          <h1>Drivers</h1>
          <p>{drivers.length} {drivers.length === 1 ? 'driver' : 'drivers'} on record</p>
        </div>
        <button className="btn-accent" onClick={() => setShowAddModal(true)}>
          + Add driver
        </button>
      </div>

      <div className="panel">
        {loading ? (
          <p>Loading…</p>
        ) : drivers.length === 0 ? (
          <div className="empty-state">
            <p>No drivers yet. Add your first one to get started.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>License</th>
                <th>Assigned truck</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const currentTruck = driver.TruckDriverAssignments?.[0]?.Truck;
                return (
                  <tr key={driver.id} onClick={() => navigate(`/drivers/${driver.id}`)}>
                    <td>{driver.name}</td>
                    <td>{driver.phone || '—'}</td>
                    <td>{driver.licenseNumber || '—'}</td>
                    <td className="plate">{currentTruck ? currentTruck.registrationNo : '—'}</td>
                    <td>
                      <StatusBadge status={driver.employmentStatus} config={DRIVER_STATUS_CONFIG} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <DriverFormModal onSave={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
    </>
  );
}
