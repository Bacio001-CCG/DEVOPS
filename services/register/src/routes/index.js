import express from "express";
import { db } from "../database.js";
import { authenticateJWT } from "../middleware/auth.js";

const router = express.Router();

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
    // I added userId, you can also use req.user.username wich is also unique
    const userId = req.user.id;
    const dateTime = new Date(`${date}T${time}`).toISOString();
    const target = Math.random().toString(36).substring(2, 15);

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
        owner: userId,
        title: title,
        description: description,
        location: location,
        endTime: dateTime,
        startTime: new Date().toISOString(),
      });
    });

    await Promise.all(results);
    return res.status(200).json({
      message: "Photos received and saved",
      formData: formData,
    });
  } catch (err) {
    return res.status(500).json(err?.message ?? "Internal Server Error");
  }
});

export default router;
