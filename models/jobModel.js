const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a job title'],
        trim: true
    },
    
    description: {
        type: String,
        required: [true, 'Please add a job description']
    },
    company: {
        type: String,
        required: [true, 'Please add a company name'],
        trim: true
    },
    location: {
        type: String,
        required: [true, 'Please add a location (e.g., Riyadh, Remote)']
    },
    requirements: {
        type: [String], 
        required: [true, 'Please add job requirements']
    },
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);