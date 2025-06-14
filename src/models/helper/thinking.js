// 1. what makes a class a class?
// 2. what makes a marked attendance a marked attendance?

// Student Sign Up
// Student Login
// Student Logout
// Lecturer Sign Up
// Lecturer Login
// Lecturer Logout













// Student Course Selection , a student will be here selecting his courses for the semester from the presaved list of courses, so here he expects to meet
// a list of  presaved courses and he expects to save his course preference
// so I'm thinking a collection that holds every fucking course
// and the users collection should have a field that holds a list of the courses selected by the student





// Student Dashboard, a student will be here to check if a class is live, it's either none is live or one is live, if none is live, he closes the app, if 
// one is live, he clicks on it to mark attendance, so I don't think there's need for any collection here, there's nothing to remember
//  and there's nothing to newly save




// Lecturer Create Attendance Session, the lecturer comes here to create a session by choosing the course from the presaved list of courses
// the location from the presaved list of locations, the start and end time. so this session must be saved as a unique document in the SESSIONS
//  COLLECTION with a unique session ID and must also include a field that holds a list of students that clock in for this session
// and yeah there needs to already exist a COLLECTION THAT HOLDS EVERY FUCKING LOCATION





// Student Attendance Marking, a student presses the button to mark attendance, if it's the first time, the device ID gets saved to the device 
// ID field of the user's document in the Users collection, then a selfie must be taken, then the student's uid gets populated to the appropriate
// document in the session collection. If it's not the first time we compare the device ID with the saved one and it either matches or 
// conflicts, if it matches uid gets populatd to the appropriate document in the session document





// Student Override Request, if there's a conflict above either because the phone doesn't have biometric feature or the device ID is tied 
// to another user, the student takes a selfie and request lecturer override. So apparently his uid doesn't get added to the list of students
// that have clocked in for the session rather a document gets created in OVERRIDE REQUESTS COLLECTION where each document must have the id 
//  of the requester ,the session ID, the selfie taken, the matric number of who originally owns that device , the selfie of who has clocked in
//  for that session with that device






// Student Profile View, the student comes here to check the sessions he clocked in for, the ones he missed and the ones that are pending approval
// so this will be fetched from the user collection fields - marked sessions, missed sessions and pending approval fields





// Lecturer Live Attendance View, here the lecturer comes to view real-time student checkins, 
// this will be being fetched from the attendees field of that session's document



// Lecturer Manual Override Approval/Denial, here the lecturer denies or approves overrides
// the pending requests will be fetched from the OVERRIDE REQUESTS COLLECTION and when he approves a request , the student's id gets added
// to the attendees list of that session and the request's status field gets updated to approve in the OVERRIDE REQUESTS COLLECTION
// and if he denies only the status gets updated.





// Lecturer Profile View, the lecturer comes here to check a list of all the sessions he has created and can tap into any to export the data
// so this will be fetched from the SESSIONS collection





// Lecturer Attendance Data Export,









