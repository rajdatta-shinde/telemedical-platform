import api from './axios'

// Upload an image file to the backend, which forwards it to Cloudinary and
// returns the hosted URL. Callers store the URL string in their form state.
export const uploadImage = async (file) => {
  const formData = new FormData()
  formData.append('image', file)
  const { data } = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  return data.url
}
