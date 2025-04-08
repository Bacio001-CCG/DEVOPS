import express from "express";
import { db } from "../database.js";
const router = express.Router();

/**
 * @swagger
 * /{target}/photos:
 *   get:
 *     tags:
 *       - Photos
 *     summary: Get a target's photos
 *     description: Retrieves all photos associated with a specific target
 *     parameters:
 *       - in: path
 *         name: target
 *         required: true
 *         description: Target identifier
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of photos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       500:
 *         description: Server error
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

/**
 * @swagger
 * /{target}/photo:
 *   post:
 *     tags:
 *       - Photos
 *     summary: Upload a photo for a target
 *     description: Uploads a new photo associated with a specific target
 *     parameters:
 *       - in: path
 *         name: target
 *         required: true
 *         description: Target identifier
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Photo successfully received
 *       500:
 *         description: Server error
 */
router.post("/:target/photo", async function (req, res) {
  try {
    return res.status(200).json("Photo recieved");
  } catch (err) {
    return res.status(500).json(err?.message ?? "Internal Server Error");
  }
});

export default router;
