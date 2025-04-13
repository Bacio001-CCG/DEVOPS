import "dotenv/config";
import express from "express";
import routes from "./routes/index.js";
import { register, httpRequestDuration } from "./prometheus.js";

const app = express();

app.use(express.json());
app.listen(process.env.READ_PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${process.env.READ_PORT}`);
});

app.use("/", routes);

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
