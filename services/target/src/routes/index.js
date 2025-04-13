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
  {
    queue: "get_photos_by_target",
    consume: true,
    function: async (msg) => {
      const targetId = msg.content.toString();
      const photos = await db.collection("photos").find({ target: targetId }).toArray();
      const replyTo = msg.properties.replyTo;
      const correlationId = msg.properties.correlationId;
  
      rabbitMQClient.channel.sendToQueue(
        replyTo,
        Buffer.from(JSON.stringify(photos)),
        { correlationId }
      );
    },
  },
  {
    queue: "delete_photos_by_target",
    consume: true,
    function: async (msg) => {
      const targetId = msg.content.toString();
      await db.collection("photos").deleteMany({ target: targetId });
      console.log(`Deleted all photos for target: ${targetId}`);
    },
  },
  {
    queue: "get_photo_by_id",
    consume: true,
    function: async (msg) => {
      const photoId = msg.content.toString();
      const photo = await db
        .collection("photos")
        .findOne({ _id: new ObjectId(photoId) });
  
      const replyTo = msg.properties.replyTo;
      const correlationId = msg.properties.correlationId;
  
      await rabbitMQClient.channel.sendToQueue(
        replyTo,
        Buffer.from(JSON.stringify(photo ?? null)),
        { correlationId }
      );
    }
  },
  {
    queue: "delete_photo_by_id",
    consume: true,
    function: async (msg) => {
      const photoId = msg.content.toString();
      await db.collection("photos").deleteOne({ _id: new ObjectId(photoId) });
      console.log(`Photo ${photoId} deleted`);
    }
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

router.get("/:target/myScores", authenticateJWT, async function (req, res) {
  try {
    const scores = await db
      .collection("photos")
      .find({ target: req.params.target, owner: req.user.username })
      .toArray();

    return res.status(200).json(scores);
  } catch (err) {
    console.error("Error in myScores handler:", err);
    return res
      .status(500)
      .json({ message: err?.message ?? "Internal Server Error" });
  }
});

router.delete("/photo/:photoId", authenticateJWT, async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const username = req.user.username;
    
    const photo = await db
      .collection("photos")
      .findOne({ _id: new ObjectId(photoId) });

    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    if (photo.owner !== username) {
      return res
        .status(403)
        .json({ message: "You can only delete your own photos" });
    }

    await db
      .collection("photos")
      .deleteOne({ _id: new ObjectId(photoId) });

    return res.status(200).json({ message: "Photo deleted successfully" });
  } catch (err) {
    console.error("Error deleting photo:", err);
    return res
      .status(500)
      .json({ message: err?.message ?? "Internal Server Error" });
  }
});


export default router;
