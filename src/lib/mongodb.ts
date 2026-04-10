/**
 * lib/mongodb.ts
 * Connessione a MongoDB Atlas con pattern singleton per Next.js.
 * In sviluppo, la connessione viene riutilizzata tra hot-reload.
 * In produzione, viene creata una volta per istanza serverless.
 */
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('Variabile MONGODB_URI non configurata in .env.local')
}

// Cache della connessione (risolve il problema di Next.js hot-reload)
interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined
}

const cached: MongooseCache = global.mongoose ?? { conn: null, promise: null }
if (!global.mongoose) global.mongoose = cached

export async function connectDB(): Promise<typeof mongoose> {
  // Riusa connessione esistente
  if (cached.conn) return cached.conn

  // Aspetta connessione in corso
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (err) {
    cached.promise = null
    throw err
  }

  return cached.conn
}
