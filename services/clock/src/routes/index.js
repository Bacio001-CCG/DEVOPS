import express from "express";
import { db } from "../database.js";
import ClockService from "../clockService.js";

const router = express.Router();

router.get("/", async function (req, res) {
  try {
    const targetTimings = await db.collection("target_timings").find().toArray();
    return res.status(200).json(targetTimings); // Return the data as JSON
  } catch (err) {
    return res
      .status(500)
      .json({ message: err?.message ?? "Internal Server Error" });
  }
});

export default router;
