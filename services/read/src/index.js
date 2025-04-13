import "dotenv/config";
import express from "express";

import routes from "./routes/index.js";

const app = express();

app.use(express.json());
app.use("/", routes);

// Health check for gateway
app.use((req, res, next) => {
  if (req.method === "HEAD") {
    res.status(200).end();
  } else {
    next();
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;
