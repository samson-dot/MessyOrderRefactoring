import Database from "better-sqlite3";
import { config } from "../config/config.js";

const db = new Database(config.DB_FILE);
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


const mapOrder = (row, items) => ({
  id: row.id,
  customerId: row.customer_id,
  customerName: row.customer_name,
  subtotal: row.subtotal, discount: row.discount,
  tax: row.tax, total: row.total,
  status: row.status, createdAt: row.created_at,
  items,
});

export const itemsFor = (orderId) =>
  db.prepare(`SELECT sku, qty, price FROM order_items WHERE order_id = ?`).all(orderId);

export const saveOrder = (o, items) => {
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO orders (id, customer_id, customer_name, subtotal, discount, tax, total, status, created_at)
                VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(o.id, o.customerId, o.customerName, o.subtotal, o.discount, o.tax, o.total, o.status, o.createdAt);
    for (const it of items)
      db.prepare(`INSERT INTO order_items (order_id, sku, qty, price) VALUES (?,?,?,?)`)
        .run(o.id, it.sku, it.qty, it.price);
  });
  tx();
};

export const findOrder = (id) => {
  const row = db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id);
  return row ? mapOrder(row, itemsFor(row.id)) : null;
};

export const listOrders = ({ status, customerId } = {}) => {
  // filtering now happens IN SQL — no more load-everything
  const where = [];
  const args = [];
  if (status) { where.push("status = ?"); args.push(status); }
  if (customerId) { where.push("customer_id = ?"); args.push(customerId); }
  const sql = `SELECT * FROM orders` +
    (where.length ? ` WHERE ${where.join(" AND ")}` : "") +
    ` ORDER BY created_at DESC`;
  return db.prepare(sql).all(...args).map((row) => mapOrder(row, itemsFor(row.id)));
};

export const updateStatus = (id, next) =>
  db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(next, id);

