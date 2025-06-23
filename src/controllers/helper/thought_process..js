// 🧠 THE GOLDEN RULE:
// Default to grouping by role when that role is the only one using it.
// Group by category only when the feature is shared between multiple roles.

// If it has to do with login, signup, or logout (i.e. authentication lifecycle) , 🔐 Always put it in auth.controller.js, even if it's for a specific role.







// Student Sign Up 
// is this particular to a role? yes = auth.controller.js

// Student Login
// is this particular to a role? yes = auth.controller.js

// Student Logout

// is this particular to a role? no 
// so which category does it belong to? auth = auth.controller.js

// Lecturer Sign Up
// is this particular to a role? yes = auth.controller.js

// Lecturer Login
// is this particular to a role? yes = auth.controller.js

// Lecturer Logout
// is this particular to a role? no 
// so which category does it belong to? auth = auth.controller.js

// Student Course Selection
// is this particular to a role? yes = student.controller.js

// Student Dashboard
// is this particular to a role? yes = student.controller.js

// Student Attendance Marking
// is this particular to a role? yes = student.controller.js

// Student Override Request
// is this particular to a role? yes = student.controller.js

// Student Profile View
// is this particular to a role? yes = student.controller.js

// Lecturer Create Attendance Session
// is this particular to a role? yes = lecturer.controller.js

// Lecturer Live Attendance View
// is this particular to a role? yes = lecturer.controller.js

// Lecturer Manual Override Approval/Denial
// is this particular to a role? yes = lecturer.controller.js

// Lecturer Profile View
// is this particular to a role? yes = lecturer.controller.js

// Lecturer Attendance Data Export
// is this particular to a role? yes = lecturer.controller.js
