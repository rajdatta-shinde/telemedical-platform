import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { uploadBufferToCloudinary } from '../lib/cloudinary.js'

export const uploadRouter = Router()

// Hold the file in memory so we can pipe it straight to Cloudinary without
// touching the filesystem. 5 MB matches the client-side size guard.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'))
    }
    cb(null, true)
  },
})

// Any authenticated user (patient, doctor, admin) can upload a profile/doctor
// image. The endpoint returns the hosted Cloudinary URL — clients store that
// string instead of a base64 blob.
uploadRouter.post('/image', requireAuth(), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' })
    }
    const result = await uploadBufferToCloudinary(req.file.buffer)
    res.json({ url: result.secure_url, publicId: result.public_id })
  } catch (error) {
    console.error('Cloudinary upload failed:', error)
    const status = error?.http_code || 500
    res.status(status).json({ message: error.message || 'Image upload failed' })
  }
})
