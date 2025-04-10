import express from "express";
import { db } from "../database.js";
const router = express.Router();
import RabbitMQClient from "../rabbitmq.js";

const rabbitMQClient = new RabbitMQClient([
  {
    queue: "test",
    function: function (msg) {
      console.log("Received:", msg.content.toString());
    },
  },
]);

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
    // Connect to RabbitMQ
    rabbitMQClient.send("test", "Hello World!");

    // Change the response to verify code update is working
    const list = [1, 3, 5, 7, 9]; // Changed values

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
