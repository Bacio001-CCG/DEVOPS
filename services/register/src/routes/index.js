import express from "express";
import { db } from "../database.js";
import { authenticateJWT } from "../middleware/auth.js";
import RabbitMQClient from "../rabbitmq.js";
import { getAllTargets } from "../index.js";

const router = express.Router();

const rabbitMQClient = new RabbitMQClient([]);

router.get("/", async function (req, res) {
  try {
    const list = [];
    return res.status(200).json(list);
  } catch (err) {
    return res
      .status(500)
      .json({ message: err?.message ?? "Internal Server Error" });
  }
});

// Use authenticateOrganizerJWT if you want to restrict this route to users with role organizers only
router.post("/", authenticateJWT, async function (req, res) {
  try {
    const files = req.files;
    const formData = req.body;
    const title = formData.title;
    const description = formData.description;
    const location = formData.location;
    const date = formData.date;
    const time = formData.time;
    const username = req.user.username;    
    console.log("email:", req.user.email);
    const email = req.user.email;
    const target = Math.random().toString(36).substring(2, 15);

    const originalDate = new Date(`${date}T${time}`);
    const adjustedDate = new Date(originalDate.getTime() - 2 * 60 * 60 * 1000); // subtract 2 hours
    const dateTime = adjustedDate.toISOString();

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({ message: "No files were uploaded." });
    }

    if (!title || !description || !location || !date || !time) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const results = Object.keys(files).map(async (key) => {
      const file = files[key];
      const fileBase64 = file.data.toString("base64");
      const fileName = file.name;
      await db.collection("registration").insertOne({
        fileName: fileName,
        fileBase64: fileBase64,
        target: target,
        owner: username,
        ownerEmail: email,
        title: title,
        description: description,
        location: location,
        endTime: dateTime,
        startTime: new Date().toISOString(),        
        winner: null,
        score: null,
        isEnded: false,
      });
    });

    await Promise.all(results);

    await rabbitMQClient.send(
      "start_clock",
      JSON.stringify({
        targetId: target,
        endTime: dateTime,
      })
    );

    return res.status(200).json({
      message: "Photos received and saved, TargetId: " + target,
      formData: formData,      
    });
  } catch (err) {
    return res.status(500).json(err?.message ?? "Internal Server Error");
  }
});

router.get("/target/:target/results", authenticateJWT, async function (req, res) {
  try {
    const { target } = req.params;
    const username = req.user.username;

    // Check ownership
    const targetDoc = await db.collection("registration").findOne({ target, owner: username });
    if (!targetDoc) {
      return res.status(403).json({ message: "Unauthorized access to target" });
    }

    // Request photos from target service
    const photos = await rabbitMQClient.request("get_photos_by_target", target);

    const sorted = photos.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return res.status(200).json(sorted);
  } catch (err) {
    console.error("Error fetching target results:", err);
    return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
  }
});

router.delete("/target/:target", authenticateJWT, async function (req, res) {
  try {
    const { target } = req.params;
    const username = req.user.username;

    // Check ownership
    const targetDoc = await db.collection("registration").findOne({ target, owner: username });
    if (!targetDoc) {
      return res.status(403).json({ message: "Unauthorized access to target" });
    }

    // Delete the target from local DB
    await db.collection("registration").deleteOne({ target });

    // Instruct target service to delete photos by target
    await rabbitMQClient.send("delete_photos_by_target", target);

    return res.status(200).json({ message: "Target and associated photos deleted" });
  } catch (err) {
    console.error("Error deleting target:", err);
    return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
  }
});

router.delete("/target/:target/photo/:photoId", authenticateJWT, async function (req, res) {
  try {
    const { target, photoId } = req.params;
    const username = req.user.username;

    // Check ownership
    const targetDoc = await db.collection("registration").findOne({ target, owner: username });
    if (!targetDoc) {
      return res.status(403).json({ message: "You do not own this target" });
    }

    // Request photo details from target service
    const photo = await rabbitMQClient.request("get_photo_by_id", photoId);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    if (photo.target !== target) {
      return res.status(400).json({ message: "Photo does not belong to this target" });
    }

    //Request deletion from target service
    await rabbitMQClient.send("delete_photo_by_id", photoId);

    return res.status(200).json({ message: "Photo deleted successfully" });
  } catch (err) {
    console.error("Error deleting photo:", err);
    return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
  }
});


export default router;
