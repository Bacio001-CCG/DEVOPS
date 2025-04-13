import express from "express";
import { db } from "../database.js";
import passport from "../config/passport.js";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import RabbitMQClient from "../rabbitmq.js";

const router = express.Router();

const rabbitMQClient = new RabbitMQClient();

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

router.post("/register", async function (req, res) {
  console.log("Registering user:", req.body);
  try {
    const { email, username, organizer = false } = req.body;

    if (!email || !username) {
      return res.status(400).json({ message: "Email and username are required" });
    }

    const existingUser = await db.collection("users").findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const password = crypto.randomBytes(8).toString("hex");
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = organizer ? "organizer" : "participant";

    const userResult = await db.collection("users").insertOne({
      email,
      username,
      password: hashedPassword,
      email: email,
      role,
    });

    const userId = userResult.insertedId;

    const token = jwt.sign(
      { id: userId, username, role, email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    const mailMessage = {
      to: email,
      subject: "Your Photo Hunt Account",
      text: `Welcome to Photo Hunt!\n\nYour credentials:\nUsername: ${username}\nPassword: ${password}\nRole: ${role}`,
    };
    await rabbitMQClient.send("send_email", JSON.stringify(mailMessage));

    return res.status(201).json({
      message: "User registered successfully. Check your email for credentials.",
      token,
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
  }
});

router.post("/login", async function (req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    const user = await db.collection("users").findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: err?.message ?? "Internal Server Error" });
  }
});

router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  async function (req, res) {
    try {
      const user = await db
        .collection("users")
        .findOne({ _id: req.user._id }, { projection: { password: 0 } });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({
        username: user.username,
        email: user.email,
        role: user.role,
      });
    } catch (err) {
      console.error("Get user error:", err);
      return res
        .status(500)
        .json({ message: err.message ?? "Internal Server Error" });
    }
  }
);

export default router;
