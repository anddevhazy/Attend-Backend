// Alright — you're not as lost as you think. You've actually written a decent amount of working logic, which is more than most beginners manage. But yeah, it's time to level it up. Let's **refactor your most complex controller**, clean it up, and make it **production-ready**.

// ---

// ## 🧠 Step 1: Pick the Most Complex Controller

// The most complex and logic-heavy controller in your code is:

// ### ✅ `approveOverride`

// It:

// * Fetches and validates a DB record
// * Updates multiple models (`OverrideRequest`, `Session`)
// * Has conditional flows (`already approved?`)
// * Combines multiple entities (`student`, `session`, `request`)
// * Writes a new record into an array (`attendees`)
// * Returns a structured response

// ---

// ## 🛠 Step 2: Refactor Goals

// Here's what we're going to fix/improve:

// | Problem                          | Fix                                           |
// | -------------------------------- | --------------------------------------------- |
// | Repetitive `res.status().json()` | Use error classes from the `errors/` folder   |
// | Lack of separation               | Extract decision logic from raw controller    |
// | Unsafe async code                | Add fallback guards and clear error responses |
// | Verbose and nested code          | Flatten the logic                             |
// | Inconsistent status codes        | Use proper HTTP codes consistently            |

// ---

// ## ✨ Refactored: `approveOverride` (Cleaned Version)

// ```js
// import { StatusCodes } from 'http-status-codes'
// import OverrideRequest from '../models/overrideRequest.model.js'
// import Session from '../models/attendanceSession.model.js'
// import {
//   BadRequestError,
//   NotFoundError,
// } from '../errors/index.js' // assuming you've set up your errors folder

// export const approveOverride = async (req, res) => {
//   const { overrideRequestId } = req.params
//   const { lecturerId } = req.body

//   if (!overrideRequestId || !lecturerId) {
//     throw new BadRequestError('Missing required fields')
//   }

//   const overrideRequest = await OverrideRequest.findById(overrideRequestId)
//     .populate('studentId', 'name matricNumber deviceId')
//     .populate('sessionId', '_id attendees')

//   if (!overrideRequest) {
//     throw new NotFoundError('Override request not found')
//   }

//   if (overrideRequest.status !== 'pending') {
//     throw new BadRequestError(
//       `Override request has already been ${overrideRequest.status}`
//     )
//   }

//   const session = overrideRequest.sessionId
//   const student = overrideRequest.studentId

//   if (!session || !student) {
//     throw new NotFoundError('Related session or student not found')
//   }

//   // Approve the override
//   overrideRequest.status = 'approved'
//   overrideRequest.lecturerId = lecturerId
//   overrideRequest.decisionTimestamp = new Date()
//   await overrideRequest.save()

//   // Add student to session attendees
//   session.attendees.push({
//     studentId: student._id,
//     selfie: overrideRequest.selfie,
//     timestamp: overrideRequest.createdAt,
//     deviceIdUsed: student.deviceId || 'override-approved',
//     matricNumber: student.matricNumber,
//   })

//   await session.save()

//   return res.status(StatusCodes.OK).json({
//     success: true,
//     message: 'Override request approved successfully',
//     data: {
//       overrideRequest: {
//         _id: overrideRequest._id,
//         status: overrideRequest.status,
//         decisionTimestamp: overrideRequest.decisionTimestamp,
//       },
//       student: {
//         _id: student._id,
//         name: student.name,
//         matricNumber: student.matricNumber,
//       },
//       sessionId: session._id,
//       studentAdded: true,
//     },
//   })
// }
// ```

// ---

// ## ✅ Key Changes Explained

// ### 1. **Replaced Manual Checks with Error Classes**

// ```js
// throw new BadRequestError('...')
// throw new NotFoundError('...')
// ```

// * These replace `res.status(400).json(...)` style blocks.
// * Keeps controller **focused on logic**, not formatting responses.
// * Lets a global error middleware handle response formatting.

// ---

// ### 2. **Flat Structure (Early Returns/Errors)**

// No deep nesting — errors are thrown immediately when something's wrong, keeping the happy path clear and straight.

// ---

// ### 3. **Logical Separation**

// Breaks things down cleanly:

// * Validate input
// * Fetch data
// * Validate state
// * Update & persist
// * Return success

// ---

// ### 4. **Consistent Use of Status Codes**

// ```js
// StatusCodes.OK  // 200
// StatusCodes.BAD_REQUEST // 400
// StatusCodes.NOT_FOUND // 404
// ```

// Instead of typing raw numbers.

// ---

// ### 5. **Avoids Silent Failures**

// Checks for missing student/session data even after population. This helps when relationships break in MongoDB.

// ---

// ## 🧠 How This Helps You Grow

// This isn’t just cleanup — it teaches you **backend discipline**:

// * Use **custom errors**
// * Follow **single responsibility**
// * Always handle **unexpected cases**
// * Keep **controllers lean**, and error handling consistent
// * Let middleware do its job (e.g. format and log errors)

// ---

// ## 🛠 Next Step for You

// 1. Build your `errors/` folder like we discussed
// 2. Refactor all other controllers using the same logic
// 3. Create an `errorHandlerMiddleware` to handle all `throw`ed errors globally

// Let me know if you want help writing that middleware or setting up a boilerplate structure for new controllers. We can build it together.
