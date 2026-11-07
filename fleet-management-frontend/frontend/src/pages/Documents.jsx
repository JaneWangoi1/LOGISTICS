import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getDocuments, createDocument, updateDocument, deleteDocument } from '../api/documents';
import { getMaintenance, createMaintenance, deleteMaintenance } from '../api/maintenance';
import { getTrucks } from '../api/trucks';
import StatusBadge, { DOCUMENT_STATUS_CONFIG, MAINTENANCE_STATUS_CONFIG, maintenanceState } from '../components/StatusBadge';
import DocumentFormModal from '../components/DocumentFormModal';
import MaintenanceFormModal from '../components/MaintenanceFormModal';
import { documentTypeLabel, formatDate } from '../constants';

// Retired (inactive) trucks are listed but never counted in the banners.
const live = (item) => item.Truck?.status !== 'INACTIVE';

export default function Documents() {
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState(null);
  const [maintenance, setMaintenance] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [truckFilter, setTruckFilter] = useState(searchParams.get('truck') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [docModal, setDocModal] = useState(null); // {} to add, { document } to edit
  const [serviceModal, setServiceModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  function load() {
    Promise.all([getDocuments(), getMaintenance(), getTrucks()])
      .then(([docs, maint, list]) => { setDocuments(docs); setMaintenance(maint); setTrucks(list); })
      .catch(() => setError('Could not load compliance records.'));
  }

  async function handleSaveDocument(values) {
    const body = { documentType: values.documentType, documentNumber: values.documentNumber, expiryDate: values.expiryDate };
    if (docModal.document) await updateDocument(docModal.document.id, body);
    else await createDocument(values.truckId, body);
    setDocModal(null);
    load();
  }

  async function handleSaveService(values) {
    await createMaintenance(values.truckId, values);
    setServiceModal(false);
    load();
  }

  async function handleDeleteDocument(doc) {
    if (!window.confirm(`Delete the ${documentTypeLabel(doc.documentType).toLowerCase()} for ${doc.Truck?.registrationNo}?`)) return;
    await deleteDocument(doc.id);
    load();
  }

  async function handleDeleteService(record) {
    if (!window.confirm(`Delete this ${record.serviceType.trim().toLowerCase()} record for ${record.Truck?.registrationNo}?`)) return;
    await deleteMaintenance(record.id);
    load();
  }

  if (error) return <div className="panel empty-state"><p>{error}</p></div>;
  if (!documents) return <p>Loading…</p>;

  const expired = documents.filter((d) => d.status === 'EXPIRED' && live(d)).length;
  const expiring = documents.filter((d) => d.status === 'EXPIRING_SOON' && live(d)).length;
  const dueTrucks = new Set(maintenance.filter((m) => m.due && live(m)).map((m) => m.truckId)).size;

  const shownDocs = documents.filter((d) => (!truckFilter || String(d.truckId) === truckFilter) && (!statusFilter || d.status === statusFilter));
  const shownService = maintenance.filter((m) => !truckFilter || String(m.truckId) === truckFilter);

  const byTruck = new Map();
  for (const doc of shownDocs) {
    if (!byTruck.has(doc.truckId)) byTruck.set(doc.truckId, []);
    byTruck.get(doc.truckId).push(doc);
  }
  const groups = [...byTruck.entries()]
    .map(([truckId, docs]) => ({ truck: trucks.find((t) => t.id === truckId) || { id: truckId, registrationNo: docs[0].Truck?.registrationNo }, docs }))
    .sort((a, b) => a.truck.registrationNo.localeCompare(b.truck.registrationNo));

  return (
    <>
      <div className="content-header content-header-row">
        <div>
          <h1>Compliance</h1>
          <p>Insurance, inspection, logbooks and servicing for every truck.</p>
        </div>
        <button className="btn-accent" onClick={() => setDocModal({})}>+ Add document</button>
      </div>

      <div className="banners">
        {expired > 0 && <div className="banner banner-urgent"><strong>{expired}</strong>expired {expired === 1 ? 'document' : 'documents'}</div>}
        {expiring > 0 && <div className="banner banner-attention"><strong>{expiring}</strong>expiring within 30 days</div>}
        {dueTrucks > 0 && <div className="banner banner-attention"><strong>{dueTrucks}</strong>{dueTrucks === 1 ? 'truck' : 'trucks'} due for service</div>}
        {expired + expiring + dueTrucks === 0 && <div className="banner banner-good">Everything is up to date.</div>}
      </div>

      <div className="toolbar">
        <select value={truckFilter} onChange={(e) => setTruckFilter(e.target.value)} aria-label="Filter by truck">
          <option value="">All trucks</option>
          {trucks.map((t) => <option key={t.id} value={t.id}>{t.registrationNo}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="EXPIRED">Expired</option>
          <option value="EXPIRING_SOON">Expiring soon</option>
          <option value="VALID">Valid</option>
        </select>
      </div>

      {groups.length === 0 ? (
        <div className="panel empty-state"><p>{documents.length === 0 ? 'No documents yet. Add the first one.' : 'No documents match these filters.'}</p></div>
      ) : groups.map(({ truck, docs }) => (
        <div className="panel truck-group" key={truck.id}>
          <div className="truck-group-head">
            <Link to={`/trucks/${truck.id}`} className="plate cell-link">{truck.registrationNo}</Link>
            <span className="muted">{[truck.make, truck.model].filter(Boolean).join(' ')}</span>
          </div>
          <div className="table-scroll">
            <table className="data-table static">
              <thead><tr><th>Document</th><th>Number</th><th>Expiry date</th><th>Status</th><th /></tr></thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id}>
                    <td>{documentTypeLabel(doc.documentType)}</td>
                    <td className="mono-cell">{doc.documentNumber || '—'}</td>
                    <td className="mono-cell">{formatDate(doc.expiryDate)}</td>
                    <td><StatusBadge status={doc.status} config={DOCUMENT_STATUS_CONFIG} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-mini" onClick={() => setDocModal({ document: doc })}>Edit</button>
                        <button className="btn-mini danger" onClick={() => handleDeleteDocument(doc)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <div className="panel" style={{ marginTop: '1.5rem' }}>
        <div className="section-head">
          <h2>Servicing</h2>
          <button className="btn-secondary" onClick={() => setServiceModal(true)}>+ Add service record</button>
        </div>
        {shownService.length === 0 ? (
          <div className="empty-state"><p>No service records yet.</p></div>
        ) : (
          <div className="table-scroll">
            <table className="data-table static">
              <thead><tr><th>Truck</th><th>Service</th><th>Date</th><th>Next due</th><th>Status</th><th /></tr></thead>
              <tbody>
                {shownService.map((record) => (
                  <tr key={record.id}>
                    <td className="plate">{record.Truck?.registrationNo}</td>
                    <td>{record.serviceType.trim()}</td>
                    <td className="mono-cell">{formatDate(record.serviceDate)}</td>
                    <td>
                      {[record.nextServiceDueMileage ? `${Number(record.nextServiceDueMileage).toLocaleString()} km` : '', record.nextServiceDueDate ? formatDate(record.nextServiceDueDate) : ''].filter(Boolean).join(' or ') || '—'}
                    </td>
                    <td><StatusBadge status={maintenanceState(record)} config={MAINTENANCE_STATUS_CONFIG} /></td>
                    <td><div className="row-actions"><button className="btn-mini danger" onClick={() => handleDeleteService(record)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {docModal && <DocumentFormModal document={docModal.document} trucks={trucks} onSave={handleSaveDocument} onClose={() => setDocModal(null)} />}
      {serviceModal && <MaintenanceFormModal trucks={trucks} onSave={handleSaveService} onClose={() => setServiceModal(false)} />}
    </>
  );
}
