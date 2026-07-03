import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = {
  customer: [
    {
      icon: '📦',
      title: 'Place Order',
      description: 'Create a new delivery order with auto-calculated shipping charges',
      link: '/dashboard',
      buttonText: 'Go to Orders',
    },
    {
      icon: '👁️',
      title: 'Live Tracking',
      description: 'Track your delivery in real-time from pickup to delivery',
      link: '/dashboard',
      buttonText: 'View Tracking',
    },
    {
      icon: '🔄',
      title: 'Reschedule Delivery',
      description: 'Reschedule failed deliveries to a new date',
      link: '/dashboard',
      buttonText: 'Reschedule',
    },
    {
      icon: '💰',
      title: 'Charge Preview',
      description: 'See complete charge breakdown before confirming order',
      link: '/dashboard',
      buttonText: 'Calculate Charges',
    },
  ],
  delivery_agent: [
    {
      icon: '📋',
      title: 'View Assigned Orders',
      description: 'See all orders assigned to you for delivery',
      link: '/agent',
      buttonText: 'View Orders',
    },
    {
      icon: '📍',
      title: 'Update Delivery Status',
      description: 'Update order status: Picked Up → In Transit → Out for Delivery → Delivered/Failed',
      link: '/agent',
      buttonText: 'Update Status',
    },
    {
      icon: '📝',
      title: 'Add Delivery Notes',
      description: 'Add notes for each status update (optional)',
      link: '/agent',
      buttonText: 'Add Notes',
    },
    {
      icon: '✅',
      title: 'Mark Delivered/Failed',
      description: 'Complete delivery or mark as failed for rescheduling',
      link: '/agent',
      buttonText: 'Complete Delivery',
    },
  ],
  admin: [
    {
      icon: '📦',
      title: 'Create Orders',
      description: 'Create orders on behalf of customers with automatic charge calculation',
      link: '/admin',
      section: 'Create Order',
    },
    {
      icon: '📊',
      title: 'View All Orders',
      description: 'Filter orders by status, zone, agent. Override order statuses.',
      link: '/admin',
      section: 'Orders',
    },
    {
      icon: '👥',
      title: 'Manage Agents',
      description: 'Assign agents to orders, view agent availability and zones',
      link: '/admin',
      section: 'Agents',
    },
    {
      icon: '🤖',
      title: 'Auto-Assign Agents',
      description: 'Auto-assign nearest available agent to orders',
      link: '/admin',
      section: 'Orders',
    },
    {
      icon: '🗺️',
      title: 'Manage Zones',
      description: 'Create and configure delivery zones',
      link: '/admin',
    },
    {
      icon: '💳',
      title: 'Rate Cards',
      description: 'Configure shipping rates for zone pairs and order types',
      link: '/admin',
    },
  ],
};

const FEATURE_DETAILS = {
  customer: {
    title: '📦 Customer Portal',
    color: '#10b981',
    description: 'Manage your deliveries, track in real-time, and control your shipments',
  },
  delivery_agent: {
    title: '🚚 Delivery Agent Portal',
    color: '#f59e0b',
    description: 'Complete assigned deliveries, update status, and manage your route',
  },
  admin: {
    title: '⚙️ Admin Dashboard',
    color: '#8b5cf6',
    description: 'Full control over orders, agents, zones, and rate configurations',
  },
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div style={styles.landingPage}>
        <div style={styles.landingContainer}>
          <h1 style={styles.landingTitle}>🚀 Last-Mile Delivery Tracker</h1>
          <p style={styles.landingSubtitle}>
            Complete delivery management platform with real-time tracking, auto-assignment, and customer notifications
          </p>
          <div style={styles.landingRoles}>
            <div style={styles.roleCard}>
              <h3 style={{ margin: 0 }}>📦 Customer</h3>
              <p>Place orders, preview charges, track deliveries, reschedule failed orders</p>
            </div>
            <div style={styles.roleCard}>
              <h3 style={{ margin: 0 }}>🚚 Delivery Agent</h3>
              <p>View assigned orders, update status, complete deliveries</p>
            </div>
            <div style={styles.roleCard}>
              <h3 style={{ margin: 0 }}>⚙️ Admin</h3>
              <p>Manage orders, agents, zones, rates, and configurations</p>
            </div>
          </div>
          <button style={styles.btnPrimary} onClick={() => navigate('/login')}>
            Login to Get Started
          </button>
        </div>
      </div>
    );
  }

  const features = FEATURES[user.role] || [];
  const roleInfo = FEATURE_DETAILS[user.role] || {};

  return (
    <div style={styles.page}>
      <div style={{ ...styles.header, borderBottomColor: roleInfo.color }}>
        <h1 style={styles.roleTitle}>{roleInfo.title}</h1>
        <p style={styles.roleDescription}>{roleInfo.description}</p>
      </div>

      <div style={styles.featuresGrid}>
        {features.map((feature, idx) => (
          <div key={idx} style={styles.featureCard}>
            <div style={styles.featureIcon}>{feature.icon}</div>
            <h3 style={styles.featureTitle}>{feature.title}</h3>
            <p style={styles.featureDesc}>{feature.description}</p>
            <button
              style={{ ...styles.btnFeature, borderTopColor: roleInfo.color }}
              onClick={() => navigate(feature.link)}
            >
              {feature.section ? `Go to ${feature.section}` : feature.buttonText || 'Open'}
            </button>
          </div>
        ))}
      </div>

      <div style={styles.infoBox}>
        <h3 style={{ marginTop: 0 }}>💡 How to Use</h3>
        {user.role === 'customer' && (
          <ul>
            <li><strong>Place Order:</strong> Click "Place Order" button to create a new delivery</li>
            <li><strong>Preview Charges:</strong> See full breakdown before confirming</li>
            <li><strong>Track Delivery:</strong> Click on any order to see real-time tracking timeline</li>
            <li><strong>Reschedule:</strong> If delivery fails, you can reschedule to a new date</li>
          </ul>
        )}
        {user.role === 'delivery_agent' && (
          <ul>
            <li><strong>View Assignments:</strong> All orders assigned to you appear in the dashboard</li>
            <li><strong>Update Status:</strong> Click an order and update status at each step</li>
            <li><strong>Add Notes:</strong> Optional notes help explain delays or issues</li>
            <li><strong>Complete:</strong> Mark as delivered or failed when finished</li>
          </ul>
        )}
        {user.role === 'admin' && (
          <ul>
            <li><strong>Orders Tab:</strong> View all orders, filter by status/zone/agent, override statuses</li>
            <li><strong>Create Order:</strong> Create orders on behalf of customers</li>
            <li><strong>Agents Tab:</strong> View availability and manually assign agents</li>
            <li><strong>Auto-Assign:</strong> Automatically assign nearest available agent</li>
          </ul>
        )}
      </div>
    </div>
  );
}

const styles = {
  landingPage: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  landingContainer: {
    maxWidth: '800px',
    textAlign: 'center',
    color: '#fff',
  },
  landingTitle: {
    fontSize: '48px',
    margin: '0 0 16px',
    fontWeight: '800',
  },
  landingSubtitle: {
    fontSize: '18px',
    margin: '0 0 40px',
    opacity: 0.95,
  },
  landingRoles: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '40px',
  },
  roleCard: {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 16px',
  },
  header: {
    marginBottom: '40px',
    paddingBottom: '24px',
    borderBottom: '4px solid #10b981',
  },
  roleTitle: {
    margin: '0 0 12px',
    fontSize: '32px',
    fontWeight: '800',
    color: '#1e293b',
  },
  roleDescription: {
    margin: 0,
    fontSize: '16px',
    color: '#6b7280',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  featureCard: {
    background: '#fff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    border: '1px solid #f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  featureIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  featureTitle: {
    margin: '0 0 8px',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
  },
  featureDesc: {
    margin: '0 0 16px',
    fontSize: '14px',
    color: '#6b7280',
    flex: 1,
  },
  btnFeature: {
    padding: '10px 16px',
    borderTopWidth: '3px',
    borderTopStyle: 'solid',
    borderLeft: 'none',
    borderRight: 'none',
    borderBottom: 'none',
    background: '#f8fafc',
    color: '#1e40af',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  infoBox: {
    background: '#f0fdf4',
    borderLeft: '4px solid #10b981',
    padding: '20px',
    borderRadius: '8px',
    color: '#166534',
  },
  btnPrimary: {
    padding: '14px 32px',
    background: '#fff',
    color: '#667eea',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
};
