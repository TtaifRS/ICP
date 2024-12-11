import mongoose from 'mongoose';


const jobLeadSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  location: { type: String, required: false },

  companyURL: { type: String, required: false },
  updatedCloseCRM: { type: Date, required: false },
  processed: { type: Boolean, default: false, required: false },
  jobs: [
    {
      jobTitle: { type: String, required: true },
      jobLink: { type: String, required: true },
      jobDate: { type: Date, required: false },

    },
  ],
}, { timestamps: true });

const JobLead = mongoose.model('JobLead', jobLeadSchema)

export default JobLead

