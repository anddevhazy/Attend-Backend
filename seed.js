import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Course from './src/models/course.model.js';
import Location from './src/models/location.model.js';
import User from './src/models/user.model.js';

import fs from 'fs';

mongoose
  .connect(`${process.env.MONGO_URI}`)
  .then(() => console.log('MongoDB Connected'))
  .catch((err) => console.error('Mongo Error:', err));

const courses = JSON.parse(fs.readFileSync('./src/data/courses.json'));
const locations = JSON.parse(fs.readFileSync('./src/data/locations.json'));
const users = JSON.parse(fs.readFileSync('./src/data/user.json'));

const seedDatabase = async () => {
  try {
    // await Course.deleteMany();
    await Course.insertMany(courses);
    console.log('Courses seeded!');

    await Location.deleteMany();
    await Location.insertMany(locations);
    console.log('Locations seeded!');

    await User.deleteMany();
    await User.insertMany(users);
    console.log('Users seeded!');

    mongoose.connection.close();
  } catch (err) {
    console.error('Seeding failed:', err);
    mongoose.connection.close();
  }
};

seedDatabase();
