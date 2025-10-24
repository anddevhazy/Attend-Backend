// Here's the goal of index.js

// Loading environment variables

// Connecting to MongoDB

// Starting the Express server upon successful DB connection

import dotenv from 'dotenv';
import { app } from './app.js';
import connectDB from './db/connect.js';
import './queues/workers.js';
import path from 'path';

const envFile = process.env.NODE_ENV === 'prod' ? '.env.prod' : '.env.local';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`⚙️ Server is running at port: ${PORT}`);
    });
  } catch (err) {
    console.log('❌ MONGO DB connection failed!!!', err);
    process.exit(1);
  }
};

startServer();
