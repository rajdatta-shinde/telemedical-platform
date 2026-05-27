import { v2 as cloudinary } from 'cloudinary'

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.warn(
    '[cloudinary] Missing CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET — image uploads will fail until these are set in .env.'
  )
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
})

const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER || 'telemedical'

// Stream the buffer into Cloudinary's upload pipeline so we never have to
// write the file to disk. Returns the parsed Cloudinary result.
export const uploadBufferToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: uploadFolder,
        resource_type: 'image',
        ...options,
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    stream.end(buffer)
  })

export { cloudinary }
