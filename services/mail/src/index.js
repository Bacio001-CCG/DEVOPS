import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";
import RabbitMQClient from "./rabbitmq.js"

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
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
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

export default app;
