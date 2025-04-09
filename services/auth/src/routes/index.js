import express from "express";
import { db } from "../database.js";
import crypto from 'crypto';
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; 
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
    return res.status(200).json("Photo graded");
  } catch (err) {
    return res.status(500).json(err?.message ?? "Internal Server Error");
  }
});

router.post("/register", async function (req, res) {
  try {
    const { email, username, } = req.body;

    const existingUser = await db.collection('users').findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: "Email or username already exists" 
      });
    }

    const password = crypto.randomBytes(8).toString("hex"); 
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.collection("users").insertOne({ email, username, password: hashedPassword, role: 'participant'});

    // Generate JWT token
    const token = jwt.sign(
      { id: result.insertedId, username, role: newUser.role },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    // Use mail service to send email with username and password
    return res.status(201).json({
      message: "User registered successfully",
      //for dev remove when email service is added
      credentials: {
        username,
        password,
        hashedPassword,
        role,
        token
      }
    });
  } catch (err) {
    return res.status(500).json(err?.message ?? "Internal Server Error");
  }
});

export default router;
