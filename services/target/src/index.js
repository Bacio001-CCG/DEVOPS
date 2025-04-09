import "dotenv/config";
import express from "express";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

import routes from "./routes/index.js";

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
app.use("/", routes);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.listen(5006, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;
