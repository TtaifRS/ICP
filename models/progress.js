import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  date: { type: String, required: true }, // YYYY-MM-DD format
  source: { type: String, required: true }, // 'indeed' or 'stepstone'
  completedTitles: [
    {
      title: String,
      leadsAdded: { type: Number, default: 0 }, // Track the number of leads added for each title
    },
  ],
});

const Progress = mongoose.model('Progress', progressSchema);

export default Progress;