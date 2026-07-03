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

const emptyForm = {
  pickup_street: '', pickup_city: '', pickup_pincode: '',
  drop_street: '', drop_city: '', drop_pincode: '',
  length: '', breadth: '', height: '', actual_weight: '',
  order_type: 'B2C', payment_type: 'Prepaid',
};

export default function CustomerDashboard() {
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  function handlePincodeChange(type, pincode) {
    const selected = PINCODES.find(p => p.value === pincode);
    if (type === 'pickup') {
      f({ pickup_pincode: pincode, pickup_city: selected?.city || '' });
    } else {
      f({ drop_pincode: pincode, drop_city: selected?.city || '' });
    }
  }

  async function fetchOrders() {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch {}
  }

  async function handleCalculate(e) {
    e.preventDefault();
    setErr(''); setPreview(null);
    if (!form.pickup_city || !form.drop_city) return setErr('Please select both pickup and drop locations');
    try {
      const res = await api.post('/orders/calculate', {
        pickup_pincode: form.pickup_pincode,
        drop_pincode: form.drop_pincode,
        dimensions: { length: +form.length, breadth: +form.breadth, height: +form.height },
        actual_weight: +form.actual_weight,
        order_type: form.order_type,
        payment_type: form.payment_type,
      });
      setPreview(res.data);
    } catch (e) {
      setErr(e.response?.data?.message || 'Calculation failed');
    }
  }

  async function handlePlaceOrder() {
    setLoading(true); setErr('');
    try {
      await api.post('/orders', {
        pickup_address: { street: form.pickup_street, city: form.pickup_city, pincode: form.pickup_pincode },
        drop_address: { street: form.drop_street, city: form.drop_city, pincode: form.drop_pincode },
        dimensions: { length: +form.length, breadth: +form.breadth, height: +form.height },
        actual_weight: +form.actual_weight,
        order_type: form.order_type,
        payment_type: form.payment_type,
      });
      setMsg('Order placed successfully!');
      setShowForm(false);
      setForm(emptyForm);
      setPreview(null);
      fetchOrders();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(orderId) {
    try {
      await api.post(`/orders/${orderId}/confirm`);
      setMsg('Order confirmed!');
      fetchOrders();
      if (selectedOrder?._id === orderId) openOrder(orderId);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to confirm');
    }
  }

  async function openOrder(orderId) {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data.order);
      setTracking(res.data.trackingEvents);
    } catch {}
  }

  async function handleReschedule(orderId) {
    if (!rescheduleDate) return setErr('Please pick a date');
    try {
      await api.post(`/orders/${orderId}/reschedule`, { new_date: rescheduleDate });
      setMsg('Order rescheduled!');
      setRescheduleDate('');
      fetchOrders();
      openOrder(orderId);
    } catch (e) {
      setErr(e.response?.data?.message || 'Reschedule failed');
    }
  }

  function f(v) { return setForm(prev => ({ ...prev, ...v })); }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.h2}>My Orders</h2>
        <button style={styles.btnPrimary} onClick={() => { setShowForm(!showForm); setPreview(null); setErr(''); }}>
          {showForm ? 'Cancel' : '+ New Order'}
        </button>
      </div>

      {msg && <div style={styles.success} onClick={() => setMsg('')}>{msg} ✕</div>}
      {err && <div style={styles.error} onClick={() => setErr('')}>{err} ✕</div>}

      {showForm && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Place New Order</h3>
          <form onSubmit={handleCalculate} style={styles.grid}>
            <div style={styles.section}>
              <strong>Pickup</strong>
              <input style={styles.input} placeholder="Street address" value={form.pickup_street} onChange={e => f({ pickup_street: e.target.value })} required />
              <select style={styles.input} value={form.pickup_pincode} onChange={e => handlePincodeChange('pickup', e.target.value)} required>
                <option value="">Select pincode</option>
                {PINCODES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <input style={{ ...styles.input, background: '#f3f4f6', color: '#6b7280' }} placeholder="City (auto-filled)" value={form.pickup_city} readOnly />
            </div>
            <div style={styles.section}>
              <strong>Drop</strong>
              <input style={styles.input} placeholder="Street address" value={form.drop_street} onChange={e => f({ drop_street: e.target.value })} required />
              <select style={styles.input} value={form.drop_pincode} onChange={e => handlePincodeChange('drop', e.target.value)} required>
                <option value="">Select pincode</option>
                {PINCODES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <input style={{ ...styles.input, background: '#f3f4f6', color: '#6b7280' }} placeholder="City (auto-filled)" value={form.drop_city} readOnly />
            </div>
            <div style={styles.section}>
              <strong>Package Dimensions (cm)</strong>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input style={styles.input} type="number" placeholder="L" value={form.length} onChange={e => f({ length: e.target.value })} required min="1" />
                <input style={styles.input} type="number" placeholder="B" value={form.breadth} onChange={e => f({ breadth: e.target.value })} required min="1" />
                <input style={styles.input} type="number" placeholder="H" value={form.height} onChange={e => f({ height: e.target.value })} required min="1" />
              </div>
            </div>
            <div style={styles.section}>
              <strong>Weight & Type</strong>
              <input style={styles.input} type="number" placeholder="Actual weight (kg)" value={form.actual_weight} onChange={e => f({ actual_weight: e.target.value })} required min="0.1" step="0.1" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <select style={styles.input} value={form.order_type} onChange={e => f({ order_type: e.target.value })}>
                  <option value="B2C">B2C</option>
                  <option value="B2B">B2B</option>
                </select>
                <select style={styles.input} value={form.payment_type} onChange={e => f({ payment_type: e.target.value })}>
                  <option value="Prepaid">Prepaid</option>
                  <option value="COD">COD</option>
                </select>
              </div>
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
                <span>Actual Weight</span><span>{preview.actual_weight} kg</span>
                <span>Volumetric Weight</span><span>{preview.volumetric_weight} kg</span>
                <span>Billed Weight</span><span><strong>{preview.billed_weight} kg</strong></span>
                <span>Rate/kg</span><span>₹{preview.rate_per_kg}</span>
                {preview.cod_surcharge > 0 && <><span>COD Surcharge</span><span>₹{preview.cod_surcharge}</span></>}
                <span style={{ fontWeight: 700 }}>Total Charge</span><span style={{ fontWeight: 700, color: '#1e40af' }}>₹{preview.total_charge}</span>
              </div>
              <button style={{ ...styles.btnPrimary, marginTop: '16px' }} onClick={handlePlaceOrder} disabled={loading}>
                {loading ? 'Placing…' : 'Confirm & Place Order'}
              </button>
            </div>
          )}
        </div>
      )}

      <div style={styles.orderList}>
        {orders.length === 0 && <p style={{ color: '#6b7280' }}>No orders yet.</p>}
        {orders.map(order => (
          <div key={order._id} style={styles.orderCard} onClick={() => openOrder(order._id)}>
            <div style={styles.orderRow}>
              <span style={styles.orderNum}>{order.order_number}</span>
              <OrderStatusBadge status={order.status} />
            </div>
            <div style={styles.orderMeta}>
              <span>{order.pickup_zone?.name} → {order.drop_zone?.name}</span>
              <span>{order.order_type} · {order.payment_type}</span>
              <span><strong>₹{order.charge}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div style={styles.overlay} onClick={() => setSelectedOrder(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0 }}>{selectedOrder.order_number}</h3>
              <button style={styles.closeBtn} onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div style={styles.detailGrid}>
              <span>Status</span><span><OrderStatusBadge status={selectedOrder.status} /></span>
              <span>Type</span><span>{selectedOrder.order_type} · {selectedOrder.payment_type}</span>
              <span>Charge</span><span><strong>₹{selectedOrder.charge}</strong></span>
              <span>Pickup</span><span>{selectedOrder.pickup_address?.street}, {selectedOrder.pickup_address?.pincode}</span>
              <span>Drop</span><span>{selectedOrder.drop_address?.street}, {selectedOrder.drop_address?.pincode}</span>
              <span>Agent</span><span>{selectedOrder.agent?.name || '—'}</span>
              {selectedOrder.scheduled_date && <><span>Scheduled</span><span>{new Date(selectedOrder.scheduled_date).toLocaleDateString()}</span></>}
            </div>

            {selectedOrder.status === 'created' && (
              <button style={{ ...styles.btnPrimary, marginTop: '16px' }} onClick={() => handleConfirm(selectedOrder._id)}>
                Confirm Order
              </button>
            )}

            {selectedOrder.status === 'failed' && (
              <div style={{ marginTop: '16px' }}>
                <input type="date" style={styles.input} value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                <button style={{ ...styles.btnPrimary, marginTop: '8px' }} onClick={() => handleReschedule(selectedOrder._id)}>
                  Reschedule
                </button>
              </div>
            )}

            <h4 style={{ marginTop: '20px', marginBottom: '8px' }}>Tracking Timeline</h4>
            <div style={styles.timeline}>
              {tracking.map((ev, i) => (
                <div key={ev._id || i} style={styles.timelineItem}>
                  <div style={styles.dot} />
                  <div>
                    <OrderStatusBadge status={ev.status} />
                    <span style={styles.timelineActor}> by {ev.actor?.name}</span>
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
  page: { maxWidth: '900px', margin: '32px auto', padding: '0 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  h2: { margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e293b' },
  card: { background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: '24px' },
  cardTitle: { margin: '0 0 16px', fontSize: '16px', fontWeight: '700' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  section: { display: 'flex', flexDirection: 'column', gap: '8px' },
  input: { padding: '9px 11px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  btnPrimary: { padding: '10px 20px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  preview: { marginTop: '20px', background: '#f8fafc', borderRadius: '8px', padding: '16px' },
  previewGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '14px', color: '#374151' },
  orderList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  orderCard: { background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'pointer', transition: 'box-shadow 0.2s' },
  orderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  orderNum: { fontWeight: '700', color: '#1e293b' },
  orderMeta: { display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' },
  success: { background: '#d1fae5', color: '#065f46', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', cursor: 'pointer', fontSize: '14px' },
  error: { background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', cursor: 'pointer', fontSize: '14px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '540px', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' },
  detailGrid: { display: 'grid', gridTemplateColumns: '130px 1fr', gap: '8px 12px', fontSize: '14px', color: '#374151' },
  timeline: { display: 'flex', flexDirection: 'column', gap: '12px' },
  timelineItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  dot: { width: '10px', height: '10px', background: '#1e40af', borderRadius: '50%', marginTop: '5px', flexShrink: 0 },
  timelineActor: { fontSize: '13px', color: '#6b7280' },
  timelineTime: { fontSize: '12px', color: '#9ca3af', marginTop: '2px' },
  timelineNotes: { fontSize: '13px', color: '#374151', marginTop: '2px', fontStyle: 'italic' },
};
