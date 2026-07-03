import React, { useState, useEffect } from 'react';
import api from '../services/api';
import OrderStatusBadge from '../components/OrderStatusBadge';

const NEXT_STATUSES = {
  confirmed: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['out_for_delivery'],
  out_for_delivery: ['delivered', 'failed'],
};

const STATUS_LABELS = {
  picked_up: 'Mark Picked Up',
  in_transit: 'Mark In Transit',
  out_for_delivery: 'Mark Out for Delivery',
  delivered: 'Mark Delivered',
  failed: 'Mark Failed',
};

export default function AgentDashboard() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [tracking, setTracking] = useState([]);
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } catch {}
  }

  async function openOrder(orderId) {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data.order);
      setTracking(res.data.trackingEvents);
      setNotes('');
    } catch {}
  }

  async function updateStatus(orderId, status) {
    setErr('');
    try {
      await api.put(`/orders/${orderId}/status`, { status, notes });
      setMsg(`Status updated to: ${status}`);
      fetchOrders();
      openOrder(orderId);
    } catch (e) {
      setErr(e.response?.data?.message || 'Update failed');
    }
  }

  const active = orders.filter(o => !['delivered', 'failed'].includes(o.status));
  const completed = orders.filter(o => ['delivered', 'failed'].includes(o.status));

  return (
    <div style={styles.page}>
      <h2 style={styles.h2}>Agent Dashboard</h2>

      {msg && <div style={styles.success} onClick={() => setMsg('')}>{msg} ✕</div>}
      {err && <div style={styles.error} onClick={() => setErr('')}>{err} ✕</div>}

      {orders.length === 0 && <p style={{ color: '#6b7280' }}>No orders assigned yet.</p>}

      {active.length > 0 && (
        <>
          <h3 style={styles.sectionTitle}>Active ({active.length})</h3>
          <div style={styles.list}>
            {active.map(order => (
              <div key={order._id} style={styles.card} onClick={() => openOrder(order._id)}>
                <div style={styles.row}>
                  <span style={styles.num}>{order.order_number}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div style={styles.meta}>
                  <span>{order.pickup_address?.street} → {order.drop_address?.street}</span>
                  <span>{order.customer?.name} · {order.customer?.phone}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {completed.length > 0 && (
        <>
          <h3 style={styles.sectionTitle}>Completed ({completed.length})</h3>
          <div style={styles.list}>
            {completed.map(order => (
              <div key={order._id} style={{ ...styles.card, opacity: 0.7 }} onClick={() => openOrder(order._id)}>
                <div style={styles.row}>
                  <span style={styles.num}>{order.order_number}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
                <div style={styles.meta}>
                  <span>{order.customer?.name}</span>
                </div>
              </div>
            ))}
          </div>
        </>
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
              <span>Customer</span><span>{selectedOrder.customer?.name} ({selectedOrder.customer?.phone})</span>
              <span>Pickup</span><span>{selectedOrder.pickup_address?.street}, {selectedOrder.pickup_address?.pincode}</span>
              <span>Drop</span><span>{selectedOrder.drop_address?.street}, {selectedOrder.drop_address?.pincode}</span>
              <span>Type</span><span>{selectedOrder.order_type} · {selectedOrder.payment_type}</span>
              <span>Charge</span><span>₹{selectedOrder.charge}</span>
            </div>

            {NEXT_STATUSES[selectedOrder.status] && (
              <div style={{ marginTop: '20px' }}>
                <textarea
                  style={{ ...styles.input, height: '60px', resize: 'vertical' }}
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {NEXT_STATUSES[selectedOrder.status].map(s => (
                    <button key={s} style={s === 'failed' ? styles.btnDanger : styles.btnPrimary} onClick={() => updateStatus(selectedOrder._id, s)}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
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
  page: { maxWidth: '860px', margin: '32px auto', padding: '0 16px' },
  h2: { margin: '0 0 20px', fontSize: '22px', fontWeight: '700', color: '#1e293b' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', color: '#374151', margin: '20px 0 10px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: { background: '#fff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'pointer' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  num: { fontWeight: '700', color: '#1e293b' },
  meta: { display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280', flexWrap: 'wrap' },
  success: { background: '#d1fae5', color: '#065f46', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', cursor: 'pointer', fontSize: '14px' },
  error: { background: '#fee2e2', color: '#991b1b', padding: '10px 16px', borderRadius: '6px', marginBottom: '16px', cursor: 'pointer', fontSize: '14px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280' },
  detailGrid: { display: 'grid', gridTemplateColumns: '110px 1fr', gap: '8px 12px', fontSize: '14px', color: '#374151' },
  input: { padding: '9px 11px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  btnPrimary: { padding: '9px 18px', background: '#1e40af', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  btnDanger: { padding: '9px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  timeline: { display: 'flex', flexDirection: 'column', gap: '12px' },
  timelineItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  dot: { width: '10px', height: '10px', background: '#1e40af', borderRadius: '50%', marginTop: '5px', flexShrink: 0 },
  timelineActor: { fontSize: '13px', color: '#6b7280' },
  timelineTime: { fontSize: '12px', color: '#9ca3af', marginTop: '2px' },
  timelineNotes: { fontSize: '13px', color: '#374151', marginTop: '2px', fontStyle: 'italic' },
};
