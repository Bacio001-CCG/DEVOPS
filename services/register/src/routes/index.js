import express from "express";
import { db } from "../database.js";
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

router.post("/", async function (req, res) {
  try {
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
        target: Math.random().toString(36).substring(2, 15),
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
