import { randomUUID } from "node:crypto";
import { config } from "../config/config.js";
import * as orderRepo from "../repository/order.repo.js";
import * as payment from "../integration/payment.js";
import { logger } from "../logger/logger.js";
import { metrics } from "../metrics/metrics.js";
import { cache } from "../cache/cache.js";


// errors carry a status the controller can translate
const fail = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};


// Receives clean data 'b' from the controller

export const createOrder = (b) => {

  logger.info("Creating order", {customerId: b.customerId}); 

  // added cause I wanted to test
  if (!b.customerId || !b.customerName)
  throw fail(400, "customerId and customerName are required");

  // pricing rules
  let subtotal = 0;

  for (const it of b.items)
    subtotal += it.qty * it.price;

  let discount = 0;
  if (b.code) {
    const rate = config.DISCOUNTS[b.code];
    if (rate === undefined){
      metrics.invalidDiscounts++; // metrics invalid discount

      throw fail(400, "invalid discount code"); // stop processing and return error to controller
    }
    discount = subtotal * rate;
  }

  const tax = (subtotal - discount) * config.TAX_RATE;
  const total = subtotal - discount + tax;
  
  logger.info("Calculated order totals", {
    subtotal,
    discount,
    tax,
    total
  });

  // payment
  const result = payment.takePayment();

  if (!result.ok) {                              
    metrics.paymentFailures++;
    logger.error("Payment failed", { reason: result.reason });   // ← now WHY is logged
    throw fail(502, "payment failed, try again");
  }

  logger.info("Payment successful");

  // persist
  const id = randomUUID();

  const createdAt = new Date().toISOString();

  orderRepo.saveOrder(
    {
      id,
      customerId: b.customerId,
      customerName: b.customerName,
      subtotal,
      discount,
      tax,
      total,
      status: "pending",
      createdAt,
    },
    b.items
  );

    logger.info("Order saved", {orderId: id});

  return orderRepo.findOrder(id);   

};

// export const getOrder = (id) => orderRepo.findOrder(id);

export const getOrder = (id) => {
  // First, check if order is already in cache
  const cachedOrder = cache.get(id);
  if (cachedOrder) return cachedOrder;
  // If not in cache, go to database
  const order = orderRepo.findOrder(id);
  
  // Save to cache for next time
  if (order) cache.set(id, order);

  return order;
};

export const listOrders = (filters) => orderRepo.listOrders(filters);

export const changeStatus = (id, next) => {
  const order = orderRepo.findOrder(id);

  if (!order) throw fail(404, "order not found"); // if it doesnt return an orderid, return a 404 error to the controller
  const allowed = config.NEXT_STATUS[order.status] || [];

  if (!allowed.includes(next))
    throw fail(409, `cannot move from ${order.status} to ${next}`);

  orderRepo.updateStatus(id, next);

  // console.log("order", id, order.status, "->", next);
  logger.info(`Order status updated`, { id, from: order.status, to: next });


  return { id, status: next };
};



