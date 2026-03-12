import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGOURI;

        if (!mongoUri) {
            throw new Error('MongoDB URI is missing. Set MONGODB_URI in backend/.env');
        }

        await mongoose.connect(mongoUri, { dbName: 'Vendor_Picker' });
        console.log('MongoDB connected successfully');
    }catch (err){
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
}

export default connectDB;