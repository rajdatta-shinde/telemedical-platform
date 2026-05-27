import mongoose from 'mongoose'

export async function connectDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set in backend/.env')
  }
  if (mongoose.connection.readyState === 1) return mongoose.connection

  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB || 'telemedical',
    serverSelectionTimeoutMS: 15000,
  })
  console.log('MongoDB connected')
  return mongoose.connection
}
