import "dotenv/config";
import express from "express";

import scoreRoutes from "./routes/score.js";

const app = express();

app.use(express.json());
app.use("/", scoreRoutes);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;
