import "dotenv/config";
import express from "express";
import fileUpload from "express-fileupload";

import routes from "./routes/index.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    createParentPath: true,
    limits: { fileSize: 50 * 1024 * 1024 },
  })
);

app.use("/", routes);

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
