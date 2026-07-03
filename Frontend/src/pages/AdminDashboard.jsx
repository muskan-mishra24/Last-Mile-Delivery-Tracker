import React, { useState, useEffect } from 'react';
import api from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';

const PINCODES = [
  { label: 'Connaught Place (110001)', value: '110001', area: 'Connaught Place', city: 'Delhi' },
  { label: 'Karol Bagh (110005)', value: '110005', area: 'Karol Bagh', city: 'Delhi' },
  { label: 'Paharganj (110055)', value: '110055', area: 'Paharganj', city: 'Delhi' },
  { label: 'Chandni Chowk (110006)', value: '110006', area: 'Chandni Chowk', city: 'Delhi' },
  { label: 'Dwarka (110075)', value: '110075', area: 'Dwarka', city: 'Delhi' },
  { label: 'Rohini (110085)', value: '110085', area: 'Rohini', city: 'Delhi' },
  { label: 'Janakpuri (110058)', value: '110058', area: 'Janakpuri', city: 'Delhi' },
  { label: 'Pitampura (110088)', value: '110088', area: 'Pitampura', city: 'Delhi' },
  { label: 'Faridabad (121001)', value: '121001', area: 'Faridabad', city: 'Faridabad' },
  { label: 'Gurgaon (122001)', value: '122001', area: 'Gurgaon', city: 'Gurgaon' },
  { label: 'Noida (201301)', value: '201301', area: 'Noida', city: 'Noida' },
  { label: 'Ghaziabad (201001)', value: '201001', area: 'Ghaziabad', city: 'Ghaziabad' },
];

const ALL_STATUSES = ['created', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed'];

const emptyOrderForm = {
  pickup_street: '', pickup_city: '', pickup_pincode: '',
  drop_street: '', drop_city: '', drop_pincode: '',
  length: '', breadth: '', height: '',
  actual_weight: '', order_type: 'B2C', payment_type: 'Prepaid',
  customer_id: '',
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [zones, setZones] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [overrideStatus, setOverrideStatus] = useState('');
  const [overrideNotes, setOverrideNotes] = useState('');
  const [assignAgentId, setAssignAgentId] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderForm, setOrderForm] = useState(emptyOrderForm);
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    fetchOrders();
    fetchAgents();
    fetchCustomers();
    fetchZones();
  }, []);

  async function fetchOrders() {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterZone) params.zone_id = filterZone;
      if (filterAgent) params.agent_id = filterAgent;
      const res = await api.get('/orders', { params });
      setOrders(res.data);
    } catch {}
  }

  async function fetchAgents() {
    try {
      const res = await api.get('/orders/admin/agents');
      setAgents(res.data);
    } catch {}
  }

  async function fetchCustomers() {
    try {
      const res = await api.get('/orders/admin/customers');
      setCustomers(res.data);
    } catch {}
  }

  async function fetchZones() {
    try {
      const res = await api.get('/zones');
      setZones(res.data);
    } catch {}
  }

  useEffect(() => { fetchOrders(); }, [filterStatus, filterZone, filterAgent]);

  async function openOrder(orderId) {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data.order);
      setTracking(res.data.trackingEvents);
      setOverrideStatus(res.data.order.status);
      setOverrideNotes('');
      setAssignAgentId(res.data.order.agent?._id || '');
    } catch {}
  }

  async function handleOverrideStatus() {
    setErr('');
    try {
      await api.put(`/orders/admin/${selectedOrder._id}/status`, { status: overrideStatus, notes: overrideNotes });
      setMsg('Status overridden');
      fetchOrders();
      openOrder(selectedOrder._id);
    } catch (e) {
      setErr(e.response?.data?.message || 'Override failed');
    }
  }

  async function handleAssignAgent() {
    if (!assignAgentId) return setErr('Select an agent');
    setErr('');
    try {
      await api.put(`/orders/admin/${selectedOrder._id}/assign`, { agent_id: assignAgentId });
      setMsg('Agent assigned');
      fetchOrders();
      fetchAgents();
      openOrder(selectedOrder._id);
    } catch (e) {
      setErr(e.response?.data?.message || 'Assignment failed');
    }
  }

  async function handleAutoAssign() {
    setErr('');
    try {
      const res = await api.post(`/orders/admin/${selectedOrder._id}/auto-assign`);
      setMsg(`Auto-assigned: ${res.data.agent?.name}`);
      fetchOrders();
      fetchAgents();
      openOrder(selectedOrder._id);
    } catch (e) {
      setErr(e.response?.data?.message || 'Auto-assign failed');
    }
  }

  function handlePincodeChange(type, pincode) {
    const selected = PINCODES.find(p => p.value === pincode);
    if (type === 'pickup') {
      f({ pickup_pincode: pincode, pickup_city: selected?.city || '' });
    } else {
      f({ drop_pincode: pincode, drop_city: selected?.city || '' });
    }
  }

  async function handleCalculate(e) {
    e.preventDefault();
    setErr(''); setPreview(null);
    if (!orderForm.pickup_city || !orderForm.drop_city) return setErr('Please select both pickup and drop locations');
    try {
      const res = await api.post('/orders/calculate', {
        pickup_pincode: orderForm.pickup_pincode,
        drop_pincode: orderForm.drop_pincode,
        dimensions: { length: +orderForm.length, breadth: +orderForm.breadth, height: +orderForm.height },
        actual_weight: +orderForm.actual_weight,
        order_type: orderForm.order_type,
        payment_type: orderForm.payment_type,
      });
      setPreview(res.data);
    } catch (e) {
      setErr(e.response?.data?.message || 'Calculation failed');
    }
  }

  async function handlePlaceOrder() {
    if (!orderForm.customer_id) return setErr('Select a customer');
    setLoading(true); setErr('');
    try {
      await api.post('/orders', {
        pickup_address: { street: orderForm.pickup_street, city: orderForm.pickup_city, pincode: orderForm.pickup_pincode },
        drop_address: { street: orderForm.drop_street, city: orderForm.drop_city, pincode: orderForm.drop_pincode },
        dimensions: { length: +orderForm.length, breadth: +orderForm.breadth, height: +orderForm.height },
        actual_weight: +orderForm.actual_weight,
        order_type: orderForm.order_type,
        payment_type: orderForm.payment_type,
        customer_id: orderForm.customer_id,
      });
      setMsg('Order created');
      setShowOrderForm(false);
      setOrderForm(emptyOrderForm);
      setPreview(null);
      fetchOrders();
    } catch (e) {
      setErr(e.response?.data?.message || 'Order creation failed');
    } finally {
      setLoading(false);
    }
  }

  function f(v) { setOrderForm(prev => ({ ...prev, ...v })); }

  return (
    <div style={styles.page}>
      <h2 style={styles.h2}>Admin Dashboard</h2>

      {msg && <div style={styles.success} onClick={() => setMsg('')}>{msg} ✕</div>}
      {err && <div style={styles.error} onClick={() => setErr('')}>{err} ✕</div>}

      <div style={styles.tabs}>
        {['orders', 'agents', 'create-order'].map(t => (
          <button key={t} style={activeTab === t ? styles.tabActive : styles.tab} onClick={() => setActiveTab(t)}>
            {t === 'orders' ? `Orders (${orders.length})` : t === 'agents' ? `Agents (${agents.length})` : 'Create Order'}
          </button>
        ))}
      </div>

      {activeTab === 'orders' && (
        <>
          <div style={styles.filters}>
            <select style={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
            </select>
            <select style={styles.filterSelect} value={filterZone} onChange={e => setFilterZone(e.target.value)}>
              <option value="">All Zones</option>
              {zones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
            </select>
            <select style={styles.filterSelect} value={filterAgent} onChange={e => setFilterAgent(e.target.value)}>
              <option value="">All Agents</option>
              {agents.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
            <button style={styles.btnGhost} onClick={() => { setFilterStatus(''); setFilterZone(''); setFilterAgent(''); }}>Clear</button>
          </div>

          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Order #</span><span>Customer</span><span>Route</span><span>Type</span><span>Agent</span><span>Charge</span><span>Status</span>
            </div>
            {orders.length === 0 && <p style={{ padding: '16px', color: '#6b7280' }}>No orders.</p>}
            {orders.map(o => (
              <div key={o._id} style={styles.tableRow} onClick={() => openOrder(o._id)}>
                <span style={{ fontWeight: 600 }}>{o.order_number}</span>
                <span>{o.customer?.name}</span>
                <span>{o.pickup_zone?.name} → {o.drop_zone?.name}</span>
                <span>{o.order_type}</span>
                <span>{o.agent?.name || '—'}</span>
                <span>₹{o.charge}</span>
                <span><OrderStatusBadge status={o.status} /></span>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'agents' && (
        <div style={styles.agentList}>
          {agents.map(a => (
            <div key={a._id} style={styles.agentCard}>
              <div style={styles.agentName}>{a.name}</div>
              <div style={styles.agentMeta}>{a.email} · {a.phone}</div>
              <div style={styles.agentMeta}>Zone: {a.currentZone?.name || '—'}</div>
              <span style={{ ...styles.badge, background: a.isAvailable ? '#d1fae5' : '#fee2e2', color: a.isAvailable ? '#065f46' : '#991b1b' }}>
                {a.isAvailable ? 'Available' : 'Busy'}
              </span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'create-order' && (
        <div style={styles.card}>
          <h3 style={{ margin: '0 0 16px' }}>Create Order for Customer</h3>
          <form onSubmit={handleCalculate} style={styles.grid}>
            <div style={styles.section}>
              <strong>Customer</strong>
              <select style={styles.input} value={orderForm.customer_id} onChange={e => f({ customer_id: e.target.value })} required>
                <option value="">Select customer</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
              </select>
            </div>
            <div style={styles.section}>
              <strong>Order Type & Payment</strong>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select style={styles.input} value={orderForm.order_type} onChange={e => f({ order_type: e.target.value })}>
                  <option value="B2C">B2C</option>
                  <option value="B2B">B2B</option>
                </select>
                <select style={styles.input} value={orderForm.payment_type} onChange={e => f({ payment_type: e.target.value })}>
                  <option value="Prepaid">Prepaid</option>
                  <option value="COD">COD</option>
                </select>
              </div>
            </div>
            <div style={styles.section}>
              <strong>Pickup</strong>
              <input style={styles.input} placeholder="Street" value={orderForm.pickup_street} onChange={e => f({ pickup_street: e.target.value })} required />
              <select style={styles.input} value={orderForm.pickup_pincode} onChange={e => handlePincodeChange('pickup', e.target.value)} required>
                <option value="">Select pincode</option>
                {PINCODES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <input style={{ ...styles.input, background: '#f3f4f6', color: '#6b7280' }} placeholder="City (auto-filled)" value={orderForm.pickup_city} readOnly />
            </div>
            <div style={styles.section}>
              <strong>Drop</strong>
              <input style={styles.input} placeholder="Street" value={orderForm.drop_street} onChange={e => f({ drop_street: e.target.value })} required />
              <select style={styles.input} value={orderForm.drop_pincode} onChange={e => handlePincodeChange('drop', e.target.value)} required>
                <option value="">Select pincode</option>
                {PINCODES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <input style={{ ...styles.input, background: '#f3f4f6', color: '#6b7280' }} placeholder="City (auto-filled)" value={orderForm.drop_city} readOnly />
            </div>
            <div style={styles.section}>
              <strong>Dimensions (cm)</strong>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={styles.input} type="number" placeholder="L" value={orderForm.length} onChange={e => f({ length: e.target.value })} required min="1" />
                <input style={styles.input} type="number" placeholder="B" value={orderForm.breadth} onChange={e => f({ breadth: e.target.value })} required min="1" />
                <input style={styles.input} type="number" placeholder="H" value={orderForm.height} onChange={e => f({ height: e.target.value })} required min="1" />
              </div>
            </div>
            <div style={styles.section}>
              <strong>Weight</strong>
              <input style={styles.input} type="number" placeholder="Actual weight (kg)" value={orderForm.actual_weight} onChange={e => f({ actual_weight: e.target.value })} required min="0.1" step="0.1" />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <button style={styles.btnSecondary} type="submit">Calculate Charge</button>
            </div>
          </form>

          {preview && (
            <div style={styles.preview}>
              <h4 style={{ margin: '0 0 12px' }}>Charge Breakdown</h4>
              <div style={styles.previewGrid}>
                <span>Pickup Zone</span><span>{preview.pickup_zone?.name}</span>
                <span>Drop Zone</span><span>{preview.drop_zone?.name}</span>
                <span>Billed Weight</span><span><strong>{preview.billed_weight} kg</strong></span>
                <span>Rate/kg</span><span>₹{preview.rate_per_kg}</span>
                {preview.cod_surcharge > 0 && <><span>COD Surcharge</span><span>₹{preview.cod_surcharge}</span></>}
                <span style={{ fontWeight: 700 }}>Total</span><span style={{ fontWeight: 700, color: '#1e40af' }}>₹{preview.total_charge}</span>
              </div>
              <button style={{ ...styles.btnPrimary, marginTop: '16px' }} onClick={handlePlaceOrder} disabled={loading}>
                {loading ? 'Creating…' : 'Place Order'}
              </button>
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <div style={styles.overlay} onClick={() => setSelectedOrder(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{selectedOrder.order_number}</h3>
              <button style={styles.closeBtn} onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div style={styles.detailGrid}>
              <span>Status</span><span><OrderStatusBadge status={selectedOrder.status} /></span>
              <span>Customer</span><span>{selectedOrder.customer?.name} ({selectedOrder.customer?.email})</span>
              <span>Agent</span><span>{selectedOrder.agent?.name || '—'}</span>
              <span>Pickup</span><span>{selectedOrder.pickup_address?.street}, {selectedOrder.pickup_address?.pincode}</span>
              <span>Drop</span><span>{selectedOrder.drop_address?.street}, {selectedOrder.drop_address?.pincode}</span>
              <span>Route</span><span>{selectedOrder.pickup_zone?.name} → {selectedOrder.drop_zone?.name}</span>
              <span>Type</span><span>{selectedOrder.order_type} · {selectedOrder.payment_type}</span>
              <span>Charge</span><span><strong>₹{selectedOrder.charge}</strong></span>
            </div>

            <div style={styles.adminSection}>
              <strong>Assign Agent</strong>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <select style={styles.input} value={assignAgentId} onChange={e => setAssignAgentId(e.target.value)}>
                  <option value="">Select agent</option>
                  {agents.map(a => <option key={a._id} value={a._id}>{a.name} {a.isAvailable ? '✓' : '(busy)'}</option>)}
                </select>
                <button style={styles.btnPrimary} onClick={handleAssignAgent}>Assign</button>
                <button style={styles.btnSecondary} onClick={handleAutoAssign}>Auto</button>
              </div>
            </div>

            <div style={styles.adminSection}>
              <strong>Override Status</strong>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                <select style={styles.input} value={overrideStatus} onChange={e => setOverrideStatus(e.target.value)}>
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </select>
                <input style={styles.input} placeholder="Notes" value={overrideNotes} onChange={e => setOverrideNotes(e.target.value)} />
                <button style={styles.btnPrimary} onClick={handleOverrideStatus}>Override</button>
              </div>
            </div>

            <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>Tracking Timeline</h4>
            <div style={styles.timeline}>
              {tracking.map((ev, i) => (
                <div key={ev._id || i} style={styles.timelineItem}>
                  <div style={styles.dot} />
                  <div>
                    <OrderStatusBadge status={ev.status} />
                    <span style={styles.timelineActor}> by {ev.actor?.name} ({ev.actor?.role})</span>
                    <div style={styles.timelineTime}>{new Date(ev.timestamp).toLocaleString()}</div>
                    {ev.notes && <div style={styles.timelineNotes}>{ev.notes}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '1100px', margin: '32px auto', padding: '0 16px' },
  h2: { margin: '0 0 20px', fontSize: '22px', fontWeight: '700', color: '#1e293b' },
  tabs: { display: 'flex', gap: '4px', marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '0' },
  tab: { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#6b7280', fontWeight: '500', borderBottom: '2px solid transparent', marginBottom: '-2px' },
  tabActive: { padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#1e40af', fontWeight: '700', borderBottom: '2px solid #1e40af', marginBottom: '-2px' },
  filters: { display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' },
  filterSelect: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', outline: 'none' },
  btnGhost: { padding: '8px 14px', background: 'none', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' },
  table: { background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  tableHeader: { display: 'grid', gridTemplateColumns: '140px 120px 180px 60px 120px 80px 140px', gap: '12px', padding: '12px 16px', background: '#f8fafc', fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },
  tableRow: { display: 'grid', gridTemplateColumns: '140px 120px 180px 60px 120px 80px 140px', gap: '12px', padding: '12px 16px', fontSize: '13px', color: '#374151', borderTop: '1px solid #f1f5f9', cursor: 'pointer', alignItems: 'center' },
  agentList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' },
  agentCard: { background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' },
  agentName: { fontWeight: '700', fontSize: '15px', marginBottom: '4px' },
  agentMeta: { fontSize: '13px', color: '#6b7280', marginBottom: '4px' },
  badge: { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', marginTop: '8px' },
  card: { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  input: { padding: '9px 11px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  btnPrimary: { padding: '9px 18px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSecondary: { padding: '9px 18px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },
  preview: { marginTop: '20px', background: '#f8fafc', borderRadius: '8px', padding: '16px' },
  previewGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '14px', color: '#374151' },
  success: { background: '#d1fae5', color: '#065f46', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', cursor: 'pointer', fontSize: '14px' },
  error: { background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', cursor: 'pointer', fontSize: '14px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '88vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' },
  detailGrid: { display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px 12px', fontSize: '14px', color: '#374151' },
  adminSection: { marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px' },
  timeline: { display: 'flex', flexDirection: 'column', gap: '12px' },
  timelineItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  dot: { width: '10px', height: '10px', background: '#1e40af', borderRadius: '50%', marginTop: '5px', flexShrink: 0 },
  timelineActor: { fontSize: '13px', color: '#6b7280' },
  timelineTime: { fontSize: '12px', color: '#9ca3af', marginTop: '2px' },
  timelineNotes: { fontSize: '13px', color: '#374151', marginTop: '2px', fontStyle: 'italic' },
};
