

import * as orderService from "../service/order.service.js";

const mockOrder = {
  customerId: "c1",
  customerName: "Ada",
  items: [
    {
      sku: "BOOK",
      qty: 2,
      price: 10
    },

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

test("calculates the total correctly", () => {
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

