import "dotenv/config";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "../routes.config.js";
import { authenticateJWT } from "./middleware/auth.js";
import CircuitBreaker from "opossum";
import axios from "axios";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { fileURLToPath } from "url";
import { register, httpRequestDuration } from "./prometheus.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, "../swagger.yaml"));

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.listen(process.env.GATEWAY_PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${process.env.GATEWAY_PORT}`);
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const circuitBreakerOptions = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
};

const checkServiceHealth = (route) => {
  return axios.head(route.target, { timeout: 3000 });
};

routes.forEach((route) => {
  console.log("Setting up proxy for", route.path);

  const breaker = new CircuitBreaker(
    () => checkServiceHealth(route),
    circuitBreakerOptions
  );

  if (route.auth) {
    app.use(route.path, (req, res, next) => {
      authenticateJWT(req, res, () => next());
    });
  }

  app.use(route.path, async (req, res, next) => {
    try {
      await breaker.fire();
      createProxyMiddleware({
        target: route.target,
        changeOrigin: true,
        logLevel: "debug",
        timeout: 10000,
        proxyTimeout: 10000,
        onError(err, req, res) {
          console.error("Proxy encountered an error:", err.message);
          if (!res.headersSent) {
            res.writeHead(503, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                message: "Service unavailable. Please try again later.",
              })
            );
          }
        },
      })(req, res, next);
    } catch (err) {
      if (!res.headersSent) {
        console.error("Circuit breaker blocked request:", err.message);
        res
          .status(503)
          .json({ message: "Service unavailable. Please try again later." });
      }
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

export default app;
