// Here's the goal of index.js

// Loading environment variables

// Connecting to MongoDB

// Starting the Express server upon successful DB connection

import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({ path: "./.env" });

import connectDB from "./db/index.js";

const startServer = async () => {
  try {
    await connectDB();
    // start server if DB connection succeds
  } catch (err) {
    console.log("❌ MONGO DB connection failed!!!", err);
  }
};

app.listen(PORT, () => {
  console.log("⚙️ Server is running at port: ${PORT}");
});

// const connectDB = require("./db/connect");

// const port = process.env.PORT || 5000;

// const start = async () => {
//   try {
//     await connectDB(process.env.MONGO_URI);
//     app.listen(port, () =>
//       console.log(`Server is listening on port ${port}...`)
//     );
//   } catch (error) {
//     console.log(error);
//   }
// };

// start();
