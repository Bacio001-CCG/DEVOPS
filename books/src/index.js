import 'dotenv/config';
import express from 'express';

import indexRouter from './routes/index.js';

const app = express();

app.use(express.json());
app.use('/', indexRouter);
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})


export default app;
