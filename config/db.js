const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/recruitment_system_db';        
        
        await mongoose.connect(MONGO_URI);
        console.log(' Connected to MongoDB successfully!');
    } catch (err) {
        console.error(' MongoDB connection error:', err);
        process.exit(1); 
    }
};

module.exports = connectDB;