import express from "express";
import RabbitMQClient from "../rabbitmq.js";

const router = express.Router();
const rabbitMQ = new RabbitMQClient([]);

router.get("/active-targets", async function (req, res) {
  try {
    const result = await rabbitMQ.request("get_targets", { isEnded: false });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
  }
});

router.get("/ended-targets", async function (req, res) {
  try {
    const result = await rabbitMQ.request("get_targets", { isEnded: true });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
  }
});

export default router;
