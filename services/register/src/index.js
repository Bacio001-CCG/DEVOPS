import "dotenv/config";
import express from "express";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import fileUpload from "express-fileupload";

import routes from "./routes/index.js";

import RabbitMQClient from "./rabbitmq.js";
import { db } from "./database.js";

const rabbitMQClient = new RabbitMQClient([
  {
    queue: "register_request",
    consume: true,
    function: async (msg) => {
      try {
        // Get the replyTo from message properties (not from content)
        const { replyTo, correlationId } = msg.properties;

        // Parse the content
        const { target } = JSON.parse(msg.content.toString());

        // Query the database
        const result = await db
          .collection("registration")
          .find({ target })
          .toArray();

        // Check if replyTo exists in message properties
        if (replyTo) {
          console.log(
            `Sending result to replyTo queue: ${replyTo} with correlationId: ${correlationId}`
          );

          // Format your response data
          const responseData = result[0] || {};

          // Send response back to the replyTo queue with the same correlationId
          await rabbitMQClient.channel.sendToQueue(
            replyTo,
            Buffer.from(JSON.stringify(responseData)),
            { correlationId }
          );

          console.log("Response sent successfully");
        } else {
          console.warn("No replyTo queue specified in the message properties");
        }
      } catch (error) {
        console.error("Error processing request:", error);

        // If there's a replyTo, send back an error response
        if (msg.properties.replyTo) {
          await rabbitMQClient.channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(
              JSON.stringify({
                error: error.message,
                success: false,
              })
            ),
            { correlationId: msg.properties.correlationId }
          );
        }
      }
    },
  },
  {
    queue: "end_target",
    consume: true,
    function: async (msg) => {
      try {             
      const targetId = JSON.parse(msg.content.toString()); 

        if (!targetId) {
          console.warn("No targetId provided in message");
          return;
        }

        console.log("send mq");
        await rabbitMQClient.send(
          "get_highest_scorer",
          JSON.stringify(targetId)
        );

        await db.collection("registration").updateMany(
          { target: targetId },
          { $set: { isEnded: true } }
        );
      } catch (err) {
        console.error("Error handling target end", err);
      }
    },
  },  
  {
    queue: "set_winner",
    consume: true,
    function: async (msg) => {
      try {              
        const { targetId, highestScorer, score} = JSON.parse(msg.content.toString()); 

        if (!targetId) {
          console.warn("No targetId provided in message");
          return;
        }

        await db.collection("registration").updateMany(
          { target: targetId },
          { $set: { winner: highestScorer, score} }
        );

        console.log(`Target ${targetId} ended with winner: ${highestScorer} and score: ${score}`);
      } catch (err) {
        console.error("Error handling target end", err);
      }
    },
  },
  {
    queue: "get_targets",
    consume: true,
    function: async (msg) => {
      try {
        const { replyTo, correlationId } = msg.properties;
        const { isEnded } = JSON.parse(msg.content.toString());
  
        const result = await getAllTargets(isEnded); // This is your existing function
  
        if (replyTo) {
          await rabbitMQClient.channel.sendToQueue(
            replyTo,
            Buffer.from(JSON.stringify(result)),
            { correlationId }
          );
          console.log(`Sent ${isEnded ? "ended" : "active"} targets to read service`);
        }
      } catch (err) {
        console.error("Error fetching targets:", err);
        if (msg.properties.replyTo) {
          await rabbitMQClient.channel.sendToQueue(
            msg.properties.replyTo,
            Buffer.from(
              JSON.stringify({ error: err.message, success: false })
            ),
            { correlationId: msg.properties.correlationId }
          );
        }
      }
    }
  },
]);

const app = express();

const swaggerOptions = {
  swaggerDefinition: {
    myapi: "0.0.1",
    info: {
      title: "Devops API",
      version: "0.0.1",
      description: "API documentation",
    },
    servers: [
      {
        url: "http://localhost:" + process.env.PORT,
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

app.use("/", routes);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export const getAllTargets = async (getEndedTargets) => {
  try {
    const sortOrder = getEndedTargets ? -1 : 1;

    const results = await db
      .collection("registration")
      .find({ isEnded: getEndedTargets })
      .sort({ endTime: sortOrder })
      .toArray();

    const orderedResults = results.map(target => {
      const base = {
        title: target.title,
        target: target.target,
        description: target.description,
        location: target.location,
        owner: target.owner,
        startTime: target.startTime,
        endTime: target.endTime,
        fileName: target.fileName,
        fileBase64: target.fileBase64,
      };

      // Add winner & score if the target has ended
      if (getEndedTargets) {
        base.winner = target.winner ?? null;
        base.score = target.score ?? null;
      }

      return base;
    });

    return orderedResults;
  } catch (err) {
    console.error("Error fetching targets", err);
    throw err;
  }
};

export default app;
