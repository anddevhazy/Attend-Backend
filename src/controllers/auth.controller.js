export const studentExtractData = async (req, res) => {
  // Perform OCR on uploaded image
  // Extract student data(matric no, name, programme & level) from OCR text for signup
};

export const studentSignUp = async (req, res) => {
  // student enters email and password
  // email verification link gets sent
  // user gets created with the extracted data and the email and password
};

export const login = async (req, res) => {
  // lecturer or student logs in with their password and email
};

export const logout = async (req, res) => {
  // lecturer or student logs out
};

export const lecturerSignUp = async (req, res) => {
  // all the lecturer emails have actually been seeded to the database, but just their email
  // lecturer enters email(has to match one of the ones already seeded) and password, name , department and faculty
  // email verification link gets sent
  // lecturer gets created with the details
};
