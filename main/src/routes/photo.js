import express from "express";
import { db } from "../database.js";
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Photos
 *   description: Photo management
 */
router.get("/:target/photos", async function (req, res) {
  try {
    const list = [];
    return res.status(200).json(list);
  } catch (err) {
    return res
      .status(500)
      .json({ message: err?.message ?? "Internal Server Error" });
  }
});

router.post("/:target/photo", async function (req, res) {
  try {
    return res.status(200).json("Photo recieved");
  } catch (err) {
    return res.status(500).json(err?.message ?? "Internal Server Error");
  }
});

export default router;
