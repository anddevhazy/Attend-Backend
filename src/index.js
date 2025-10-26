import { app } from './app.js';
import connectDB from './db/connect.js';
import './queues/workers.js';

const PORT = 8000;

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
