const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Job title is required'] 
  },
  company: { 
    type: String, 
    required: [true, 'Company name is required'] 
  },
  location: { 
    type: String, 
    default: 'Remote' 
  },
  type: { 
    type: String, 
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    default: 'Full-time' 
  },
  experience: { 
    type: String,
    default: ''
  },
  skills: { 
    type: String,
    default: ''
  },
  postedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);