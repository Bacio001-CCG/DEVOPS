import express from "express";
import { db } from "../database.js";
import { ObjectId } from "mongodb";
const router = express.Router();
import RabbitMQClient from "../rabbitmq.js";

import { authenticateJWT } from "../middleware/auth.js";

const rabbitMQClient = new RabbitMQClient([
  {
    queue: "score_photo",
    consume: false,
  },
  {
    queue: "score_result",
    consume: true,
    function: async (msg) => {
      try {
        const { score, photoId } = JSON.parse(msg.content.toString());
        await db.collection("photos").updateOne(
          { _id: new ObjectId(photoId) },
          { $set: { score } }
        );
        console.log(`Score ${score} saved for photo ${photoId}`);
      } catch (error) {
        console.error("Error saving score:", error);
      }
    },
  },
  {
    queue: "get_highest_scorer",
    consume: true,
    function: async (msg) => {
      try {
        const targetId = JSON.parse(msg.content.toString());
        const highestScorePhoto = await db
          .collection("photos")
          .find({ target: targetId })
          .sort({ score: -1 })
          .limit(1)
          .toArray();

        const highestScorer = highestScorePhoto[0]?.owner || "no one";
        const score = highestScorePhoto[0]?.score || 0;

        await rabbitMQClient.send(
          "set_winner",
          JSON.stringify({ targetId, highestScorer, score }),
        );
        console.log(`Highest scorer for target ${targetId}: ${highestScorer}, with score: ${score}`);
      } catch (error) {
        console.error("Error getting highest scorer:", error);
      }
    },
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

// Use authenticateOrganizerJWT if you want to restrict this route to users with role organizers only
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
router.post("/:target/photo", authenticateJWT, async function (req, res) {
  try {
    const files = req.files;
    const formData = req.body;
    const username = req.user.username;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    const results = Object.keys(files).map(async (key) => {
      const file = files[key];
      const fileBase64 = file.data.toString("base64");
      const fileName = file.name;
      const photo = await db.collection("photos").insertOne({
        fileName: fileName,
        fileBase64: fileBase64,
        target: req.params.target,
        owner: username,
        score: null,
      });
      const photoId = photo.insertedId.toString();
      return rabbitMQClient.send(
        "score_photo",
        JSON.stringify({
          target: req.params.target,
          photo: fileBase64,
          photoId,
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
