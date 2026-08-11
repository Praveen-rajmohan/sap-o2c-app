const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

app.use(cors({ origin: '*' }));
app.use(bodyParser.json());
app.use(express.json());

// Mock In-Memory Database
let inventory = {
  "SAP S/4HANA License": 50,
  "Industrial Sensor Kit": 12,
  "Enterprise Server Rack": 3
};

let customerCredentials = {
  "Acme Corp": { creditScore: 780, unpaidInvoices: 0, status: "Verified" },
  "TechGlobal": { creditScore: 620, unpaidInvoices: 2, status: "Warning" },
  "Unknown Enterprise": { creditScore: 450, unpaidInvoices: 5, status: "High Risk" }
};

let orders = [];

// AI Credential Evaluation Mock
function runAICredentialCheck(customerName) {
  const cred = customerCredentials[customerName] || { creditScore: 500, unpaidInvoices: 3, status: "Unverified" };
  
  if (cred.creditScore > 700 && cred.unpaidInvoices === 0) {
    return { aiApproved: true, score: cred.creditScore, risk: "Low", recommendation: "Auto-Approve Recommended" };
  } else if (cred.creditScore >= 600) {
    return { aiApproved: false, score: cred.creditScore, risk: "Medium", recommendation: "Manual Review Required" };
  } else {
    return { aiApproved: false, score: cred.creditScore, risk: "High", recommendation: "Reject - Financial Risk" };
  }
}

// 1. Submit Order
app.post('/api/orders', (req, res) => {
  const { customerName, productName, quantity } = req.body;
  const aiResult = runAICredentialCheck(customerName);

  const newOrder = {
    id: 'SO-' + Math.floor(100000 + Math.random() * 900000),
    customerName,
    productName,
    quantity: parseInt(quantity) || 1,
    aiEvaluation: aiResult,
    status: 'Pending Sales Approval',
    invoiceAmount: (parseInt(quantity) || 1) * 500,
    paid: false,
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder); // Adds new order to the top of the array
  res.status(201).json({ message: 'Order Created', order: newOrder });
});

// 2. Fetch All Orders
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// 3. Sales Approval / Disapproval
app.patch('/api/orders/:id/sales', (req, res) => {
  const { id } = req.params;
  const { approved } = req.body;
  
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = approved ? 'Sales Approved' : 'Rejected by Sales';
  res.json(order);
});

// 4. Warehouse Stock Verification & Dispatch
app.patch('/api/orders/:id/warehouse', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const availableStock = inventory[order.productName] || 0;
  if (availableStock >= order.quantity) {
    inventory[order.productName] -= order.quantity;
    order.status = 'Invoiced';
    res.json({ success: true, order, remainingStock: inventory[order.productName] });
  } else {
    order.status = 'Backordered (Insufficient Stock)';
    res.json({ success: false, message: 'Insufficient Stock', order });
  }
});

// 5. Process Payment
app.patch('/api/orders/:id/pay', (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.paid = true;
  order.status = 'Completed & Paid';
  res.json(order);
});

// 6. Get Inventory
app.get('/api/inventory', (req, res) => {
  res.json(inventory);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SAP O2C Backend running on port ${PORT}`));