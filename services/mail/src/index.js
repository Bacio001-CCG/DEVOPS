import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";
import RabbitMQClient from "./rabbitmq.js";
import { register, httpRequestDuration } from "./prometheus.js";

const app = express();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.use(express.json());
app.listen(process.env.MAIL_PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${process.env.MAIL_PORT}`);
});

new RabbitMQClient([
  {
    queue: "send_email",    
    consume: true,
    function: function (msg) {
      const content = JSON.parse(msg.content.toString());
      sendEmail(content.to, content.subject, content.text);
    },
  },
]);

const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

app.post("/", () => {
  const mailOptions = {
    from: "kartonkoekje@gmail.com",
    to: "ajw.berkers@student.avans.nl",
    subject: "Sending Email using Node.js",
    text: "That was easy!",
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
});

// Metrics endpoint for prometheus
app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", register.contentType);
  res.send(await register.metrics());
});

// Health check for prometheus
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration / 1000);
  });
  next();
});

// Health check for gateway
app.use((req, res, next) => {
  if (req.method === "HEAD") {
    res.status(200).end();
  } else {
    next();
  }
});

export default app;
