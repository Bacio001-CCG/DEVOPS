import express from "express";
import { db } from "../database.js";
const router = express.Router();
import RabbitMQClient from "../rabbitmq.js";

const rabbitMQClient = new RabbitMQClient([
  {
    queue: "score_photo",
    consume: false,
  },
]);

// const testFunction = async (msg) => {
//   console.log("Received:", msg.content.toString());
// };

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
    // rabbitMQClient.send("test", "Hello World!");

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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The photo file to upload
 *     responses:
 *       200:
 *         description: Photo successfully received
 *       500:
 *         description: Server error
 */
router.post("/:target/photo", async function (req, res) {
  try {
    // TODO: Check auth, get user ID and save it in the owner field
    const files = req.files;
    const formData = req.body;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    const results = Object.keys(files).map(async (key) => {
      const file = files[key];
      const fileBase64 = file.data.toString("base64");
      const fileName = file.name;
      await db.collection("photos").insertOne({
        fileName: fileName,
        fileBase64: fileBase64,
        target: req.params.target,
        owner: null,
      });
      return rabbitMQClient.send(
        "score_photo",
        JSON.stringify({
          target: req.params.target,
          photo: fileBase64,
        })
      );
    });

    await Promise.all(results);
    return res.status(200).json({
      message: "Photos received and saved",
      formData: formData,
    });
  } catch (err) {
    console.error("Error in photo upload handler:", err);
    return res
      .status(500)
      .json({ message: err?.message ?? "Internal Server Error" });
  }
});

export default router;
