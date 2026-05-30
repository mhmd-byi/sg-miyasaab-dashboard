import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined in environment variables');

// Reuse connection across Next.js hot reloads in dev
const cache = (global as { __mongoCache?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).__mongoCache
  ?? { conn: null, promise: null };
(global as { __mongoCache?: typeof cache }).__mongoCache = cache;

export async function dbConnect() {
  if (cache.conn) return cache.conn;
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI as string, { bufferCommands: false });
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
