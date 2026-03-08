const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            console.error('❌ MONGODB_URI is not defined!');
            console.error('Please copy .env.example to .env and configure your MongoDB connection.');
            console.error('See .env.example for the required format.');
            process.exit(1);
        }

        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error('Make sure MongoDB is running and MONGODB_URI is correctly configured.');
        process.exit(1);
    }
};

module.exports = connectDB;
