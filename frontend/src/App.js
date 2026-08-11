import React, { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://sap-o2c-backend.onrender.com';

function App() {
  const [activeTab, setActiveTab] = useState('customer');
  const [orders, setOrders] = useState([]); // Ensures it starts as an array
  const [inventory, setInventory] = useState({});

  // Customer Form State
  const [customerName, setCustomerName] = useState('Acme Corp');
  const [productName, setProductName] = useState('SAP S/4HANA License');
  const [quantity, setQuantity] = useState(1);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders`);
      const data = await res.json();
      // Ensure we only set orders if data is actually an array
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]); // Fallback to empty array on network error
    }
  };

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/inventory`);
      const data = await res.json();
      setInventory(data || {});
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setInventory({});
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchInventory();
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName, productName, quantity }),
      });
      fetchOrders();
      alert('Order submitted successfully!');
    } catch (err) {
      console.error('Failed to create order:', err);
    }
  };

  const handleSalesDecision = async (id, approved) => {
    try {
      await fetch(`${API_BASE_URL}/api/orders/${id}/sales`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
      });
      fetchOrders();
    } catch (err) {
      console.error('Failed to update sales decision:', err);
    }
  };

  const handleWarehouseDispatch = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/orders/${id}/warehouse`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (!data.success) alert(data.message);
      fetchOrders();
      fetchInventory();
    } catch (err) {
      console.error('Failed warehouse dispatch:', err);
    }
  };

  const handlePayment = async (id) => {
    try {
      await fetch(`${API_BASE_URL}/api/orders/${id}/pay`, {
        method: 'PATCH',
      });
      fetchOrders();
    } catch (err) {
      console.error('Failed to process payment:', err);
    }
  };

  // Safe checks for filtering arrays safely
  const safeOrders = Array.isArray(orders) ? orders : [];

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">SAP O2C Portal</div>
        <div className="nav-tabs">
          <button className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`} onClick={() => setActiveTab('customer')}>1. Customer Portal</button>
          <button className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>2. Sales (AI Check)</button>
          <button className={`tab-btn ${activeTab === 'warehouse' ? 'active' : ''}`} onClick={() => setActiveTab('warehouse')}>3. Warehouse</button>
          <button className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>4. Finance & Payment</button>
        </div>
      </nav>

      <main className="content-area">
        {/* TAB 1: CUSTOMER PORTAL */}
        {activeTab === 'customer' && (
          <div className="card">
            <h2>Place New Order</h2>
            <form onSubmit={handleCreateOrder}>
              <div className="form-group">
                <label>Customer Name</label>
                <select className="form-select" value={customerName} onChange={(e) => setCustomerName(e.target.value)}>
                  <option value="Acme Corp">Acme Corp (Low Risk)</option>
                  <option value="TechGlobal">TechGlobal (Medium Risk)</option>
                  <option value="Unknown Enterprise">Unknown Enterprise (High Risk)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Select Product</label>
                <select className="form-select" value={productName} onChange={(e) => setProductName(e.target.value)}>
                  <option value="SAP S/4HANA License">SAP S/4HANA License</option>
                  <option value="Industrial Sensor Kit">Industrial Sensor Kit</option>
                  <option value="Enterprise Server Rack">Enterprise Server Rack</option>
                </select>
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" min="1" className="form-input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary">Submit Order</button>
            </form>
          </div>
        )}

        {/* TAB 2: SALES & AI EVALUATION */}
        {activeTab === 'sales' && (
          <div className="card">
            <h2>Sales Approval & AI Customer Vetting</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>AI Credit Score</th>
                  <th>AI Risk Assessment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeOrders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.customerName}</td>
                    <td>{o.productName} ({o.quantity})</td>
                    <td>{o.aiEvaluation?.score}</td>
                    <td>
                      <span className={`badge badge-${(o.aiEvaluation?.risk || 'low').toLowerCase()}`}>
                        {o.aiEvaluation?.risk} Risk ({o.aiEvaluation?.recommendation})
                      </span>
                    </td>
                    <td><span className="status-pill">{o.status}</span></td>
                    <td>
                      {o.status === 'Pending Sales Approval' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-approve" onClick={() => handleSalesDecision(o.id, true)}>Approve</button>
                          <button className="btn btn-reject" onClick={() => handleSalesDecision(o.id, false)}>Disapprove</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: WAREHOUSE */}
        {activeTab === 'warehouse' && (
          <div>
            <div className="card">
              <h2>Current Warehouse Stock</h2>
              <ul>
                {Object.entries(inventory).map(([prod, count]) => (
                  <li key={prod} style={{ margin: '0.5rem 0' }}><strong>{prod}:</strong> {count} units remaining</li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h2>Fulfillment & Stock Verification</h2>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Product</th>
                    <th>Required Qty</th>
                    <th>Status</th>
                    <th>Warehouse Action</th>
                  </tr>
                </thead>
                <tbody>
                  {safeOrders.filter(o => o.status === 'Sales Approved' || o.status?.includes('Stock')).map((o) => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.productName}</td>
                      <td>{o.quantity}</td>
                      <td><span className="status-pill">{o.status}</span></td>
                      <td>
                        <button className="btn btn-action" onClick={() => handleWarehouseDispatch(o.id)}>Verify Stock & Dispatch</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FINANCE & INVOICING */}
        {activeTab === 'finance' && (
          <div className="card">
            <h2>Invoicing & Payment Tracking</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Invoice Amount</th>
                  <th>Payment Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {safeOrders.filter(o => o.status === 'Invoiced' || o.paid).map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{o.customerName}</td>
                    <td>${o.invoiceAmount}</td>
                    <td>
                      <span className={`badge ${o.paid ? 'badge-low' : 'badge-high'}`}>
                        {o.paid ? 'PAID' : 'UNPAID'}
                      </span>
                    </td>
                    <td>
                      {!o.paid && (
                        <button className="btn btn-approve" onClick={() => handlePayment(o.id)}>Process Payment</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;