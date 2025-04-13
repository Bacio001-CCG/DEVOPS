import * as promClient from "prom-client";

const register = new promClient.Registry();

register.setDefaultLabels({
  app: "clock-service",
});

promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5],
});

register.registerMetric(httpRequestDuration);

export { register, httpRequestDuration };
