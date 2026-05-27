// Authoritative reference data for the static "seed" doctors that the frontend
// ships in src/assets/assets.js. These doctors are not stored in the database,
// so the API keeps its own copy of the trustworthy fields (id, name,
// speciality, fees, address) to validate appointment bookings against.
//
// Keep this list in sync with frontend/src/assets/assets.js.

import { Doctor } from '../models/Doctor.js'

export const seedDoctors = [
  { id: 'doc1',  name: 'Dr. Richard James',     speciality: 'General physician',   fees: 50, address: { line1: '17th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc2',  name: 'Dr. Emily Larson',      speciality: 'Gynecologist',        fees: 60, address: { line1: '27th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc3',  name: 'Dr. Sarah Patel',       speciality: 'Dermatologist',       fees: 30, address: { line1: '37th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc4',  name: 'Dr. Christopher Lee',   speciality: 'Pediatricians',       fees: 40, address: { line1: '47th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc5',  name: 'Dr. Jennifer Garcia',   speciality: 'Neurologist',         fees: 50, address: { line1: '57th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc6',  name: 'Dr. Andrew Williams',   speciality: 'Neurologist',         fees: 50, address: { line1: '57th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc7',  name: 'Dr. Christopher Davis', speciality: 'General physician',   fees: 50, address: { line1: '17th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc8',  name: 'Dr. Timothy White',    speciality: 'Gynecologist',        fees: 60, address: { line1: '27th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc9',  name: 'Dr. Ava Mitchell',     speciality: 'Dermatologist',       fees: 30, address: { line1: '37th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc10', name: 'Dr. Jeffrey King',     speciality: 'Pediatricians',       fees: 40, address: { line1: '47th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc11', name: 'Dr. Zoe Kelly',        speciality: 'Neurologist',         fees: 50, address: { line1: '57th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc12', name: 'Dr. Patrick Harris',   speciality: 'Neurologist',         fees: 50, address: { line1: '57th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc13', name: 'Dr. Chloe Evans',      speciality: 'General physician',   fees: 50, address: { line1: '17th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc14', name: 'Dr. Ryan Martinez',    speciality: 'Gynecologist',        fees: 60, address: { line1: '27th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
  { id: 'doc15', name: 'Dr. Amelia Hill',      speciality: 'Dermatologist',       fees: 30, address: { line1: '37th Cross, Richmond', line2: 'Circle, Ring Road, London' } },
]

// Resolve a doctor by id from either the database (admin-added) or the seed
// list. Returns a normalised { id, name, speciality, fees, address } or null.
export async function resolveDoctor(doctorId) {
  if (!doctorId) return null
  const dbDoctor = await Doctor.findOne({ id: doctorId }).lean()
  if (dbDoctor) {
    return {
      id: dbDoctor.id,
      name: dbDoctor.name,
      email: dbDoctor.email || null,
      speciality: dbDoctor.speciality,
      fees: Number(dbDoctor.fees) || 0,
      address: dbDoctor.address || { line1: '', line2: '' },
      image: dbDoctor.image || '',
      unavailability: dbDoctor.unavailability || [],
    }
  }
  const seed = seedDoctors.find(d => d.id === doctorId)
  return seed ? { ...seed, email: null, image: '', unavailability: [] } : null
}
