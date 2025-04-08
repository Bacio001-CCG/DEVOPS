import "dotenv/config";
import express from "express";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

import uploadRouter from "./routes/photo.js";

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
        url: "http://localhost:5001",
      },
    ],
  },
  apis: ["./routes/*.js"], // files containing annotations as above
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

app.use(express.json());
app.use("/", uploadRouter);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;
