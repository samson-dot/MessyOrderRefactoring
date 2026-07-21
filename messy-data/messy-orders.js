// ============================================================================
//  messy-orders.js  —  Day 2 exercise: "Structuring & Designing for Change"
// ----------------------------------------------------------------------------
//  This is ONE file that works but mixes every concern together: configuration,
//  HTTP handling, validation, business rules, data access, and a payment call.
//
//  Your job: split it into layers WITHOUT changing what it does.
//    - config      → all the hard-coded settings & secrets at the top
//    - routes      → the HTTP endpoints (req / res, status codes)
//    - controller  → glue between HTTP and the service
//    - service     → the business rules (totals, discounts, tax, transitions)
//    - repository  → the only place that talks SQL
//    - integration → the payment call
//  Keep it runnable at every step. When you're done, a teammate should be able
//  to open the project and instantly know where to add a new field to an order.
//
//  Run it (inside the course-code repo, which has the dependencies installed):
//    node exercises/messy-orders.js
//  Then:
//    curl -X POST localhost:4000/orders -H 'x-api-key: super-secret-123' \
//      -H 'content-type: application/json' \
//      -d '{"customerId":"c1","customerName":"Ada","code":"SAVE10",
//           "items":[{"sku":"BOOK","qty":2,"price":15.5},{"sku":"PEN","qty":3,"price":2}]}'
// ============================================================================

import express from "express";
import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

// --- settings & secrets, right here in the code ------------------------------
const PORT = 4000;
const API_KEY = "super-secret-123";
const TAX_RATE = 0.075;
const DISCOUNTS = { SAVE10: 0.10, VIP: 0.20, LAUNCH: 0.25 };
const NEXT_STATUS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// --- database, set up inline -------------------------------------------------
const db = new Database("messy-orders.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY, customer_id TEXT, customer_name TEXT,
    subtotal REAL, discount REAL, tax REAL, total REAL,
    status TEXT, created_at TEXT
  );
  CREATE TABLE IF NOT EXISTS order_items (
    order_id TEXT, sku TEXT, qty INTEGER, price REAL
  );
`);

const app = express();
app.use(express.json());

// --- create an order ---------------------------------------------------------
app.post("/orders", (req, res) => {
  // auth
  if (req.header("x-api-key") !== API_KEY)
    return res.status(401).json({ error: "unauthorized" });

  // validation
  const b = req.body || {};
  if (!b.customerId || !b.customerName)
    return res.status(400).json({ error: "customerId and customerName are required" });
  if (!Array.isArray(b.items) || b.items.length === 0)
    return res.status(400).json({ error: "an order needs at least one item" });
  for (const it of b.items) {
    if (!it.sku || typeof it.qty !== "number" || it.qty <= 0 || typeof it.price !== "number" || it.price < 0)
      return res.status(400).json({ error: "each item needs a sku, a positive qty and a price" });
  }

  // pricing rules
  let subtotal = 0;
  for (const it of b.items) subtotal += it.qty * it.price;
  let discount = 0;
  if (b.code) {
    const rate = DISCOUNTS[b.code];
    if (rate === undefined) return res.status(400).json({ error: "invalid discount code" });
    discount = subtotal * rate;
  }
  const tax = (subtotal - discount) * TAX_RATE;
  const total = subtotal - discount + tax;

  // take payment (flaky third party, called inline)
  let paid = false;
  for (let attempt = 1; attempt <= 3 && !paid; attempt++) {
    if (Math.random() > 0.25) paid = true; // pretend network call
  }
  if (!paid) return res.status(502).json({ error: "payment failed, try again" });

  // persist (order + items) in a transaction
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO orders (id, customer_id, customer_name, subtotal, discount, tax, total, status, created_at)
                VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(id, b.customerId, b.customerName, subtotal, discount, tax, total, "pending", createdAt);
    for (const it of b.items)
      db.prepare(`INSERT INTO order_items (order_id, sku, qty, price) VALUES (?,?,?,?)`)
        .run(id, it.sku, it.qty, it.price);
  });
  tx();

  console.log("created order", id, "total", total.toFixed(2));
  const items = db.prepare(`SELECT sku, qty, price FROM order_items WHERE order_id = ?`).all(id);
  res.status(201).json({ id, customerId: b.customerId, customerName: b.customerName,
    subtotal, discount, tax, total, status: "pending", createdAt, items });
});

// --- get one order -----------------------------------------------------------
app.get("/orders/:id", (req, res) => {
  if (req.header("x-api-key") !== API_KEY)
    return res.status(401).json({ error: "unauthorized" });

  const row = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "order not found" });
  const items = db.prepare(`SELECT sku, qty, price FROM order_items WHERE order_id = ?`).all(row.id);
  // map DB row -> response shape
  res.json({ id: row.id, customerId: row.customer_id, customerName: row.customer_name,
    subtotal: row.subtotal, discount: row.discount, tax: row.tax, total: row.total,
    status: row.status, createdAt: row.created_at, items });
});

// --- list orders, with optional filters --------------------------------------
app.get("/orders", (req, res) => {
  if (req.header("x-api-key") !== API_KEY)
    return res.status(401).json({ error: "unauthorized" });

  // load everything, then filter and attach items in JS (works... for now)
  let rows = db.prepare(`SELECT * FROM orders ORDER BY created_at DESC`).all();
  if (req.query.status) rows = rows.filter((r) => r.status === req.query.status);
  if (req.query.customer) rows = rows.filter((r) => r.customer_id === req.query.customer);

  const allItems = db.prepare(`SELECT * FROM order_items`).all();
  const out = rows.map((row) => {
    const items = allItems.filter((i) => i.order_id === row.id) // scans every item, every order
      .map((i) => ({ sku: i.sku, qty: i.qty, price: i.price }));
    return { id: row.id, customerId: row.customer_id, customerName: row.customer_name,
      subtotal: row.subtotal, discount: row.discount, tax: row.tax, total: row.total,
      status: row.status, createdAt: row.created_at, items };
  });
  res.json(out);
});

// --- change an order's status ------------------------------------------------
app.patch("/orders/:id/status", (req, res) => {
  if (req.header("x-api-key") !== API_KEY)
    return res.status(401).json({ error: "unauthorized" });

  const next = (req.body || {}).status;
  if (!next) return res.status(400).json({ error: "status is required" });

  const row = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "order not found" });

  // transition rule
  const allowed = NEXT_STATUS[row.status] || [];
  if (!allowed.includes(next))
    return res.status(409).json({ error: `cannot move from ${row.status} to ${next}` });

  db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(next, row.id);
  console.log("order", row.id, row.status, "->", next);
  res.json({ id: row.id, status: next });
});

// --- a customer's orders (looks a lot like list, doesn't it?) -----------------
app.get("/customers/:id/orders", (req, res) => {
  if (req.header("x-api-key") !== API_KEY)
    return res.status(401).json({ error: "unauthorized" });

  const rows = db.prepare(`SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC`).all(req.params.id);
  const out = rows.map((row) => {
    const items = db.prepare(`SELECT sku, qty, price FROM order_items WHERE order_id = ?`).all(row.id);
    return { id: row.id, customerId: row.customer_id, customerName: row.customer_name,
      subtotal: row.subtotal, discount: row.discount, tax: row.tax, total: row.total,
      status: row.status, createdAt: row.created_at, items };
  });
  res.json(out);
});

app.listen(PORT, () => console.log(`messy-orders listening on http://localhost:${PORT}`));