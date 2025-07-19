// Got you, and this is exactly where you're supposed to start. Let's fix that once and for all — I’ll teach you how to **build any function from scratch**, even if you're given only a problem description.

// We'll walk through this in layers — so by the end, you’ll not only write a function, you’ll *understand* how to shape it **every single time**.

// ---

// ## 🚀 THE 5-STEP METHOD TO WRITING ANY FUNCTION

// ### 🧱 Step 1: **What’s the function supposed to do?**

// Write it in 1 sentence.

// > ✅ *"I want a function that adds two numbers."*

// ---

// ### 🧠 Step 2: **What are the inputs (parameters)?**

// Ask:

// * What does the function need in order to work?

// > ✅ *"It needs two numbers. I'll call them `a` and `b`."*

// ---

// ### 🎯 Step 3: **What should it return or output?**

// Think of the final result you want.

// > ✅ *"I want it to return the sum of the two numbers."*

// ---

// ### 🛠️ Step 4: **Write the logic inside**

// Ask:

// * What steps must happen between input and output?

// > ✅ *"Add the two numbers: `a + b`"*

// ---

// ### 🧑‍💻 Step 5: **Write the function in code**

// There are two ways. Let’s start with **function declaration**:

// ```js
// function add(a, b) {
//   return a + b;
// }
// ```

// Or the **arrow function** (modern syntax):

// ```js
// const add = (a, b) => {
//   return a + b;
// };
// ```

// ---

// ## ✅ FULL EXAMPLE 1: Add two numbers

// ### Step-by-step breakdown:

// ```js
// // 1. What is the function for?
// // ➤ It adds two numbers

// // 2. What are the inputs?
// // ➤ Two numbers: a, b

// // 3. What should it return?
// // ➤ The sum

// // 4. Logic?
// // ➤ Add a + b

// // 5. Final function:
// function add(a, b) {
//   return a + b;
// }
// ```

// ---

// ## ✅ FULL EXAMPLE 2: Check if someone can vote

// > *"Write a function that checks if someone's age is 18 or above and returns true or false."*

// ```js
// function canVote(age) {
//   return age >= 18;
// }
// ```

// ---

// ## ✅ FULL EXAMPLE 3: Async function that fetches data

// If you're writing a function that talks to a database or external source, use `async`.

// > *"Write a function that waits for user data and returns it"*

// ```js
// async function getUser(userId) {
//   const user = await User.findById(userId);
//   return user;
// }
// ```

// ---

// ## 🔁 SUMMARY: Cheat Sheet

// | Part        | What to Ask                          |
// | ----------- | ------------------------------------ |
// | 📌 Purpose  | What does this function do?          |
// | 🧾 Inputs   | What data does it need?              |
// | 🎯 Output   | What should it return?               |
// | ⚙️ Logic    | What steps must happen inside?       |
// | 🧑‍💻 Write | Choose `function` or `const = () =>` |

// ---

// ## 💡 Now You Try

// Tell me one simple function idea in your head.

// I'll help you walk through it — then you’ll write the next one 100% by yourself.

// Just say:

// > “Let’s build a function that…”
