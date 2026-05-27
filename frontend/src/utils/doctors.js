import api from './axios'
import { doctors as seedDoctors } from '../assets/assets'

// Normalise a backend doctor record into the shape the patient pages expect.
// Seed doctors use `_id`/`degree`; the backend stores `id`/`education`.
const normalizeBackendDoctor = (d) => ({
  ...d,
  _id: d.id,
  degree: d.education || d.degree || '',
  experience: d.experience || '',
  about: d.about || '',
  fees: d.fees ?? 0,
  address: d.address || { line1: '', line2: '' },
  image: d.image || '',
})

// Fetch every doctor a patient can browse: admin-added (backend) + static seed.
// De-dupe by name + speciality so a backend copy hides its seed twin.
// Admin-added doctors come first so newly added ones are visible immediately.
export const fetchDoctors = async () => {
  try {
    const res = await api.get('/doctors')
    const adminDoctors = (res.data || []).map(normalizeBackendDoctor)
    const seen = new Set(
      adminDoctors.map((d) => `${d.name}|${d.speciality}`.toLowerCase())
    )
    return [
      ...adminDoctors,
      ...seedDoctors.filter(
        (d) => !seen.has(`${d.name}|${d.speciality}`.toLowerCase())
      ),
    ]
  } catch (error) {
    console.error('Failed to load doctors:', error)
    // Backend unreachable — still show the seed doctors patients can browse.
    return seedDoctors
  }
}
