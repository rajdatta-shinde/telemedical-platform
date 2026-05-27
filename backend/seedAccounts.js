import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { nanoid } from 'nanoid'
import { connectDb } from './src/lib/db.js'
import { User } from './src/models/User.js'
import { Doctor } from './src/models/Doctor.js'

const accounts = [
  { collection: 'user',   role: 'admin',   name: 'Admin',   email: 'admin123@gmail.com',   password: 'admin123' },
  { collection: 'user',   role: 'patient', name: 'Patient', email: 'patient123@gmail.com', password: 'patient123' },
]

await connectDb()

for (const a of accounts) {
  const email = a.email.toLowerCase()
  const hash = await bcrypt.hash(a.password, 10)

  if (a.collection === 'user') {
    const existing = await User.findOne({ email })
    if (existing) {
      existing.password = hash
      existing.role = a.role
      existing.name = a.name
      await existing.save()
      console.log(`Updated ${a.role} user: ${email}`)
    } else {
      await User.create({ id: nanoid(), name: a.name, email, password: hash, role: a.role })
      console.log(`Created ${a.role} user: ${email}`)
    }
  } else {
    const existing = await Doctor.findOne({ email })
    if (existing) {
      existing.password = hash
      existing.name = a.name
      existing.speciality = a.speciality
      existing.fees = a.fees
      await existing.save()
      console.log(`Updated doctor: ${email}`)
    } else {
      await Doctor.create({
        id: nanoid(),
        name: a.name,
        email,
        password: hash,
        speciality: a.speciality,
        fees: a.fees,
        role: 'doctor',
      })
      console.log(`Created doctor: ${email}`)
    }
  }
}

await mongoose.connection.close()
console.log('Done.')
process.exit(0)
