import express from "express";
import { config } from "../config/config.js";
import * as controller from "../controller/order.controller.js";
import { errorHandler } from "../error/error.js";
// const metrics = require ("../metrics/metrics.js");
import { metrics } from "../metrics/metrics.js";


export const app = express();

app.use(express.json());

const requireKey = (req, res, next) => {
  if (req.header("x-api-key") !== config.API_KEY)
    return res.status(401).json({ error: "unauthorized" });

  next();
};

app.post("/orders", requireKey, controller.createOrder);

app.get("/orders/:id", requireKey, controller.getOrder);

app.get("/orders", requireKey, controller.listOrders);

app.patch("/orders/:id/status", requireKey, controller.changeStatus);

app.get("/customers/:id/orders", requireKey, controller.customerOrders);

app.use(errorHandler);

app.listen(config.PORT, () =>
  console.log(`messy-orders listening on http://localhost:${config.PORT}`)
);

app.get("/metrics", (req, res) => {res.json(metrics);});