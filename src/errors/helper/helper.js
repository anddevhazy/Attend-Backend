// 🧪 How to Use in Any Controller
// Now in your controller file (lecturer.controller.js, for example), you can:

// js
// Copy
// Edit
// import { BadRequestError, NotFoundError } from '../errors/index.js';

// if (!sessionId) {
//   throw new BadRequestError('Session ID is required');
// }

// if (!session) {
//   throw new NotFoundError('Session not found');
// }
// 🧰 Final Step: Global Error Handler (Optional but Powerful)
// Later, you’ll want to handle all these errors in one place using Express middleware.

// Let me know if you want to set that up next — it’s the final piece of clean error handling.

// Let me know when you’ve set this up — then we can refactor the rest of your app to use it properly.
