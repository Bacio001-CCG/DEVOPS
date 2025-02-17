import 'dotenv/config';
import express from 'express';

import memberRouter from './routes/member.js';

const app = express();

app.use(express.json());
app.use('/', memberRouter);
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})

export default app;
