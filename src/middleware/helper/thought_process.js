// 🌍 Imagine a school hallway

// A request (like someone asking your server for something) is a student walking down the hallway.
// On the way to the classroom (the final answer/response), the student passes by teachers (middlewares).

// Each teacher can:

// Check something in the student’s backpack 🎒 (look at the request).

// Add a note or change something 📋 (modify request or response).

// Stop the student ❌ ("you’re not allowed, go home").

// Or just say "carry on!" ➡️ (call next() to move to the next teacher).

// 📚 What about error middleware?

// Sometimes the student trips and falls in the hallway 😢 (something goes wrong in your app).
// Now we need a special nurse teacher 🧑‍⚕️ (error-handling middleware).

// The nurse:

// Picks up the student (catches the error).

// Decides how bad it is (status code).

// Writes a nice note home 📝 ("Oops, something broke, but here’s what happened").

// Without the nurse, the student just lies on the floor 😱 (your app crashes or shows messy errors).

// 🎯 Are teachers (middlewares) only nurses (error handlers)?

// Nope! Different teachers do different jobs:

// One checks if you have your ID card 🪪 (authentication).

// Another writes your name in a logbook 📝 (logging).

// Another hands out books 📘 (serving static files).

// And the nurse catches accidents (errors).

// 👉 You don’t have to know all middlewares before writing controllers.
// The normal flow is:

// Write controller → it works, but has repeated “gate” logic.

// Spot the repetition or pre-controller checks → extract into middleware.

// Update routes to use the new middleware.

// That’s how most projects grow naturally. You discover middlewares as you code, not all upfront.
