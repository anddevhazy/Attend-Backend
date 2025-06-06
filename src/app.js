// app.js (Combined version)

// import express from "express"
// import dotenv from "dotenv"
// import cors from "cors"
// import cookieParser from "cookie-parser"
// import mongoose from "mongoose"

// routes
// import userRouter from './routes/user.routes.js'
// import healthcheckRouter from "./routes/healthcheck.routes.js"
// import tweetRouter from "./routes/tweet.routes.js"
// import subscriptionRouter from "./routes/subscription.routes.js"
// import videoRouter from "./routes/video.routes.js"
// import commentRouter from "./routes/comment.routes.js"
// import likeRouter from "./routes/like.routes.js"
// import playlistRouter from "./routes/playlist.routes.js"
// import dashboardRouter from "./routes/dashboard.routes.js"

// // config
// dotenv.config({ path: './.env' })

// const app = express()

// // middlewares
// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }))
// app.use(express.json({ limit: "16kb" }))
// app.use(express.urlencoded({ extended: true, limit: "16kb" }))
// app.use(express.static("public"))
// app.use(cookieParser())

// // routes
// app.use("/api/v1/healthcheck", healthcheckRouter)
// app.use("/api/v1/users", userRouter)
// app.use("/api/v1/tweets", tweetRouter)
// app.use("/api/v1/subscriptions", subscriptionRouter)
// app.use("/api/v1/videos", videoRouter)
// app.use("/api/v1/comments", commentRouter)
// app.use("/api/v1/likes", likeRouter)
// app.use("/api/v1/playlist", playlistRouter)
// app.use("/api/v1/dashboard", dashboardRouter)

// MongoDB connection and server start
const DB_NAME = "your-db-name"; // optionally put in .env

const startServer = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("MONGO DB connection failed !!! ", error);
    process.exit(1);
  }
};

startServer();
