import "dotenv/config";
import express from "express";

import routes from "./routes/index.js";
import passport from "./config/passport.js";

const app = express();

app.use(express.json());
app.use(passport.initialize());
app.use("/", routes);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
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
