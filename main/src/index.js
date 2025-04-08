import "dotenv/config";
import express from "express";

import uploadRouter from "./routes/photo.js";

const app = express();

app.use(express.json());
app.use("/", uploadRouter);
app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;
