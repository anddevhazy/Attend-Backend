import mongoose from 'mongoose';

const LocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required']
  },
  corners: [
    {
      latitude: {
        type: Number,
        required: [true, 'Latitude is required']
      },
      longitude: {
        type: Number,
        required: [true, 'Longitude is required']
      }
    }
  ]
}, { timestamps: true });

export default mongoose.model('Location', LocationSchema);