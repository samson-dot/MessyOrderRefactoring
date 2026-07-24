import express from "express";
import { config } from "../config/config.js";
import * as controller from "../controller/order.controller.js";
import { errorHandler } from "../error/error.js";
// const metrics = require ("../metrics/metrics.js");
import { metrics } from "../metrics/metrics.js";
//authentication
import { login, register } from "../auth/auth.controller.js";
import { authenticate, authorize } from "../auth/auth.middleware.js";
export const app = express();

app.use(express.json());



app.post("/orders", authenticate, controller.createOrder);
app.get("/orders/:id", authenticate, controller.getOrder);
app.get("/orders", authenticate, controller.listOrders);
// app.patch("/orders/:id/status", authenticate, controller.changeStatus);
app.patch("/orders/:id/status", authenticate, authorize("admin"), controller.changeStatus);
app.get("/customers/:id/orders", authenticate, controller.customerOrders);

//authentication
app.post("/login", login);


//registration
app.post("/register", register);

app.get("/metrics", (req, res) => {res.json(metrics);});



app.use(errorHandler);

app.listen(config.PORT, () =>
  console.log(`messy-orders listening on http://localhost:${config.PORT}`)
);

