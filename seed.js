import mongoose from 'mongoose';
// import Lecturer from './src/models/lecturer_model.js';
// import Course from './src/models/course_model.js';
import Location from './src/models/location_model.js';

import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// const lecturers = JSON.parse(
//   fs.readFileSync('./src/data/lecturer.json', 'utf-8')
// );

// const courses = JSON.parse(fs.readFileSync('./src/data/course.json', 'utf-8'));

const courses = JSON.parse(
  fs.readFileSync('./src/data/location.json', 'utf-8')
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ Mongo Error:', err));

const seedDatabase = async () => {
  // try {
  //   await Lecturer.deleteMany();
  //   await Lecturer.insertMany(lecturers);
  //   console.log('🎉 Lecturers seeded successfully!');
  // } catch (err) {
  //   console.error('Seeding failed:', err);
  // } finally {
  //   mongoose.connection.close();
  // }

  //   try {
  //     await Course.deleteMany();
  //     await Course.insertMany(courses);
  //     console.log('🎉 Courses seeded successfully!');
  //   } catch (err) {
  //     console.error('Seeding failed:', err);
  //   } finally {
  //     mongoose.connection.close();
  //   }
  // };

  try {
    await Location.deleteMany();
    await Location.insertMany(courses);
    console.log('🎉 Locations seeded successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    mongoose.connection.close();
  }
};
seedDatabase();
