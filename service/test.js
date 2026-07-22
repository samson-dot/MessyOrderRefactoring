

import * as orderService from "./order.service.js";
import { cache } from "../cache/cache.js"; 
const mockOrder = {
  customerId: "c1",
  customerName: "Ada",
  items: [
    {
      sku: "BOOK",
      qty: 2,
      price: 10
    }

    // { sku: "PEN", qty: 3, price: 2 }
  ]
};


// A test case for invalid discount code to assert that the it works.

test("creates an order", () => {
    const result = orderService.createOrder(mockOrder);
    expect(result.customerId).toBe("c1");
    expect(result.customerName).toBe("Ada");
    expect(result.status).toBe("pending");

  });


// a test for missing customerId to assert that the it works.
test("missing customerId throws", () => {  
    const invalidOrder = { ...mockOrder, customerId: undefined };
    expect(() => orderService.createOrder(invalidOrder))
      .toThrow("customerId and customerName are required");
  });


// test business logic
test("calculates the total correctly", () => {
  const result = orderService.createOrder(mockOrder);
  expect(result.total).toBe(21.5);
// expect(result.total).toBeCloseTo(21.5, 2);   // "equal to 2 decimal places"
});

test("total incorrect", () => {
  const result = orderService.createOrder(mockOrder);
  expect(result.total).not.toBe(21);
// expect(result.total).toBeCloseTo(21.5, 2);   // "equal to 2 decimal places"
});





// a test case for changing order status to assert that the it works.
test("changes order status", () => {

    const order = orderService.createOrder(mockOrder);
    const result = orderService.changeStatus(
      order.id,
      "confirmed"
    );
    expect(result.status).toBe("confirmed");

  });


  // Fake discount for testing
const mockFakeDiscount = {customerId:"c1",customerName:"Ada",code:"FAKE99",items:[{sku:"BOOK",qty:1,price:10}]}

test("invalid discount code throws", () => {
  expect(() => orderService.createOrder(mockFakeDiscount))
    .toThrow("invalid discount code");
});


// --- CACHE TESTS ---
test("getOrder fetches from DB on first call and serves from cache on second call", () => {
  const created = orderService.createOrder(mockOrder);

  // 1st call: Cache Miss (goes to DB)
  const firstGet = orderService.getOrder(created.id);
  // 2nd call: Cache Hit (served instantly from node-cache)
  const secondGet = orderService.getOrder(created.id);

  expect(firstGet.id).toBe(created.id);
  expect(secondGet.id).toBe(created.id);

  // Use cache.getEfficiency() instead of the old 'stats' variable
  const report = cache.getEfficiency();
  expect(report.misses).toBeGreaterThanOrEqual(1);
  expect(report.hits).toBeGreaterThanOrEqual(1);
});



test("measures cache efficiency and performance speedup", () => {
  const created = orderService.createOrder(mockOrder);

  // 1. Measure 1st call (Cache Miss - SLOW)
  const start1 = performance.now();
  orderService.getOrder(created.id);
  const timeUncached = performance.now() - start1; // uncached

  // 2. Measure 2nd call (Cache Hit - FAST)
  const start2 = performance.now();
  orderService.getOrder(created.id);
  const timeCached = performance.now() - start2; // cached

  // 3. Measure 3rd call (Cache Hit - FAST)
  orderService.getOrder(created.id);

  // --- ASSERTS FOR ASSIGNMENT ---
  
  // Verify execution time (Cached call MUST be faster than uncached DB call)
  expect(timeCached).toBeLessThan(timeUncached);

  // Get efficiency stats
  const report = cache.getEfficiency();

  // We made 3 total requests: 1 Miss, 2 Hits
  expect(report.hits).toBeGreaterThanOrEqual(2);
  expect(report.misses).toBeGreaterThanOrEqual(1);

  // Log report so you can screenshot it for your assignment submission!

  console.log("===== REPort =========================");
  console.log(`Uncached Latency : ${timeUncached.toFixed(4)} ms`);
  console.log(`Cached Latency   : ${timeCached.toFixed(4)} ms`);
  console.log(`Speedup Factor   : ${(timeUncached / timeCached).toFixed(1)}x faster`);
  console.log(`Cache Hit Ratio  : ${report.hitRatio}`);
  console.log("==============================\n");
});