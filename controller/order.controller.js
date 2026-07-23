import * as orderService from "../service/order.service.js";

export const createOrder = async (req, res, next) => {   

  const b = req.body || {};

  if (!b.customerId || !b.customerName) // verify that customerId and customerName are provided
    return res.status(400).json({
      error: "customerId and customerName are required"
    });

  if (!Array.isArray(b.items) || b.items.length === 0) // verify that items is an array and has at least one item
    return res.status(400).json({
      error: "an order needs at least one item"
    });

  for (const it of b.items) {
    if (
      !it.sku ||
      typeof it.qty !== "number" || // verify that qty is a number
      it.qty <= 0 ||
      typeof it.price !== "number" || // verify that price is a number
      it.price < 0
    )
      return res.status(400).json({
        error: "each item needs a sku, a positive qty and a price"
      });
  }

  try {
    // Set the customerId to the logged-in user's ID
    b.customerId = req.user.id;
    const order = await orderService.createOrder(b);   // call the service to create the order
    res.status(201).json(order);
  } catch (err) { // catches the thrown error from service 
    next(err);       // pass the error to the error handler middleware        
  }

};


export const getOrder = (req, res) => {

  const order = orderService.getOrder(req.params.id);

  if (!order) {
    return res.status(404).json({
      error: "order not found"
    });
  }

  if (req.user.role !== "admin" && order.customerId !== req.user.id) {
    return res.status(403).json({ error: "forbidden" });
  }

  res.json(order);
};

export const listOrders = (req, res) => {

  res.json(
    orderService.listOrders({
      status: req.query.status,
      customerId: req.query.customer,
    })
  );

};

export const changeStatus = (req, res) => {

  const next = (req.body || {}).status;

  if (!next)
    return res.status(400).json({
      error: "status is required"
    });

  // res.json(
  //   orderService.changeStatus(
  //     req.params.id,
  //     next
  //   )
  // );
  try {
    res.json(orderService.changeStatus(req.params.id, next));
} catch (err) {
    res.status(err.status || 500).json({ error: err.message });
}
};

export const customerOrders = (req, res) => {

  // res.json(
  //   orderService.listOrders({
  //     customerId: req.params.id,
  //   })
  // );
  // before anyone logged in could see if the customer is an admin/the customer.
  const targetId = req.user.role === "admin" ? req.params.id : req.user.id;
  res.json(
    orderService.listOrders({ customerId: targetId })
  );

};