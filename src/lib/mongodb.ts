import mongoose from 'mongoose';

declare global {
    // eslint-disable-next-line no-var
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    } | undefined;
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;

const cached = global.mongooseCache ?? { conn: null, promise: null };

if (process.env.NODE_ENV !== 'production') {
    global.mongooseCache = cached;
}

export async function connectToDatabase() {
    if (!MONGO_URI) {
        throw new Error('Please define the MONGO_URI environment variable inside .env');
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        mongoose.set('strictQuery', false);
        cached.promise = mongoose.connect(MONGO_URI).then((instance: typeof mongoose) => instance);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default mongoose;
