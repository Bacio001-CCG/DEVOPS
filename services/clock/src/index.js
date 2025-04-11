import "dotenv/config";
import express from "express";

import routes from "./routes/index.js";
import "./ClockService.js";

const app = express();

app.use(express.json());
app.use("/", routes);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;
