import mongoose from 'mongoose';
import Lecturer from './src/models/lecturer_model.js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const lecturers = JSON.parse(
  fs.readFileSync('./src/data/lecturer.json', 'utf-8')
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ Mongo Error:', err));

const seedDatabase = async () => {
  try {
    await Lecturer.deleteMany();
    await Lecturer.insertMany(lecturers);
    console.log('🎉 Lecturers seeded successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    mongoose.connection.close();
  }
};

seedDatabase();
