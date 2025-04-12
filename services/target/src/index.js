import "dotenv/config";
import express from "express";
import swaggerUI from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import fileUpload from "express-fileupload";

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
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

app.use("/", routes);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));


// Health check for gateway
app.use((req, res, next) => {
  if (req.method === "HEAD") {
    res.status(200).end();
  } else {
    next();
  }
});

app.listen(5006, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;
