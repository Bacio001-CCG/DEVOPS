import 'dotenv/config';
import express from 'express';

import bookRouter from './routes/book.js';

const app = express();

app.use(express.json());
app.use('/', bookRouter);
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
})


export default app;
