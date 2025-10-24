import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'prod' ? '.env.prod' : '.env.local';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

import mongoose from 'mongoose';
// eslint-disable-next-line no-unused-vars
import Course from './src/models/course.model.js';
// eslint-disable-next-line no-unused-vars
import Location from './src/models/location.model.js';
import User from './src/models/user.model.js';

import fs from 'fs';

mongoose
  .connect(`${process.env.MONGO_URI}`)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('Mongo Error:', err));

// eslint-disable-next-line no-unused-vars
const courses = JSON.parse(fs.readFileSync('./src/data/courses.json'));
// eslint-disable-next-line no-unused-vars
const locations = JSON.parse(fs.readFileSync('./src/data/locations.json'));
// const students = JSON.parse(fs.readFileSync('./src/data/student.json'));
const lecturers = JSON.parse(fs.readFileSync('./src/data/lecturer.json'));

const seedDatabase = async () => {
  try {
    // await Course.deleteMany();
    // await Course.insertMany(courses);
    // console.log('Courses seeded!');

    // await Location.deleteMany();
    // await Location.insertMany(locations);
    // console.log('Locations seeded!');

    await User.deleteMany();
    // Drop the problematic index
    await User.collection.dropIndex('matricNumber_1').catch(() => {
      console.log('Index does not exist, skipping...');
    });

    // Recreate the index with sparse option
    await User.collection.createIndex(
      { matricNumber: 1 },
      { unique: true, sparse: true }
    );

    await User.insertMany(lecturers);
    console.log('Lecturers seeded!');

    mongoose.connection.close();
  } catch (err) {
    console.error('Seeding failed:', err);
    mongoose.connection.close();
  }
};

seedDatabase();
