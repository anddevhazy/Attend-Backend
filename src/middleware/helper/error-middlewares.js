// Perfect. Let's now set up your **global error handler middleware**, the final piece that catches any `throw new BadRequestError(...)` or any other error and sends a **clean response** to the client — consistently across the entire app.

// ---

// ## ✅ 1. Create `error-handler.js` Middleware

// 📄 File: `src/middleware/error-handler.js`

// ```js
// import { StatusCodes } from 'http-status-codes';
// import { CustomAPIError } from '../errors/index.js';

// const errorHandlerMiddleware = (err, req, res, next) => {
//   // If it's a custom error (one of your own), use its status code and message
//   if (err instanceof CustomAPIError) {
//     return res.status(err.statusCode).json({ error: err.message });
//   }

//   // Otherwise, it's an unexpected error — send a generic 500 response
//   console.error('Unhandled Error:', err);

//   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
//     error: 'Something went wrong. Please try again later.',
//   });
// };

// export default errorHandlerMiddleware;
// ```

// ---

// ## ✅ 2. Create a `not-found.js` Middleware (for unknown routes)

// 📄 File: `src/middleware/not-found.js`

// ```js
// const notFoundMiddleware = (req, res) => {
//   res.status(404).json({ error: `Route ${req.originalUrl} not found` });
// };

// export default notFoundMiddleware;
// ```

// ---

// ## ✅ 3. Use Both in Your Main App Entry File

// 📄 In `src/app.js` or `src/server.js` (whichever is your main Express file):

// ```js
// import express from 'express';
// import errorHandlerMiddleware from './middleware/error-handler.js';
// import notFoundMiddleware from './middleware/not-found.js';

// const app = express();

// // Your other middleware and routes here
// app.use(express.json());
// // app.use('/api/v1/lecturers', lecturerRoutes);
// // ... etc

// // Handle unknown routes
// app.use(notFoundMiddleware);

// // Catch all thrown errors (must be last)
// app.use(errorHandlerMiddleware);

// export default app;
// ```

// 🧠 **Important:**

// * `errorHandlerMiddleware` must come **after** your routes
// * It **automatically catches** any `throw new SomeError(...)` from your controllers

// ---

// ## ✅ 4. Now You Can Clean Up Controllers Like This:

// Instead of this:

// ```js
// if (!sessionId) {
//   return res.status(400).json({ message: 'Session ID is required' });
// }
// ```

// You write:

// ```js
// if (!sessionId) {
//   throw new BadRequestError('Session ID is required');
// }
// ```

// And the middleware handles the rest.

// ---

// ## 🧪 Done? Test It.

// Hit a bad route or throw a `NotFoundError` in a controller. You should get a consistent error JSON like:

// ```json
// {
//   "error": "Session not found"
// }
// ```

// And if it's a bug or unexpected crash:

// ```json
// {
//   "error": "Something went wrong. Please try again later."
// }
// ```

// ---

// ## 🧱 You Now Have Clean Error Handling

// Your app now has:

// * Centralized error logic
// * Reusable error classes
// * Consistent responses
// * A separation of concerns (controllers don’t format errors)

// ---

// Let me know if you want to add:

// * **Logging to file or service**
// * **Different environments (prod vs dev)**
// * **Field validation errors from Mongoose or Joi**

// Or we can move on to cleaning up the rest of your controllers with this setup.
