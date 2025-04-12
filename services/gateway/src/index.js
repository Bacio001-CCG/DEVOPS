import "dotenv/config";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "../routes.config.js";
import { authenticateJWT } from "./middleware/auth.js";

const app = express();

// Security, CORS and logging middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));

routes.forEach((route) => {
  console.log("Setting up proxy for", route.path);

  if (route.auth) {
    app.use(route.path, (req, res, next) => {
      // Here you have access to next()
      authenticateJWT(req, res, () => {
        console.log("Authentication successful");
        next(); // Continue to proxy
      });
    });
  }

  app.use(
    route.path,
    createProxyMiddleware({
      target: route.target,
      changeOrigin: true,
      logLevel: "debug",
    })
  );
});

const PORT = process.env.PORT || 5008;

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});

export default app;
