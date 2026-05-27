import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'
import api from '../utils/axios'
import { uploadImage } from '../utils/uploadImage'
import DoctorLayout from '../components/DoctorLayout'

const SPECIALITIES = [
  'General physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatricians',
  'Neurologist',
  'Gastroenterologist',
]

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  speciality: '',
  education: '',
  experience: '',
  fees: '',
  address: '',
  about: '',
  image: '',
}

const DoctorProfile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [memberSince, setMemberSince] = useState('')
  const [errors, setErrors] = useState({})
  const fileInputRef = useRef(null)

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile')
      const { stats, ...data } = res.data
      setFormData({ ...emptyForm, ...data, fees: data.fees ?? '' })
      setMemberSince(data.memberSince || '')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchProfile() }, [])

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB')
      return
    }
    setUploadingImage(true)
    try {
      const url = await uploadImage(file)
      setFormData(prev => ({ ...prev, image: url }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  // Doctors can only edit fees, phone and photo — so that's all we validate.
  const validate = () => {
    const next = {}
    if (formData.fees !== '' && Number(formData.fees) < 0) next.fees = 'Fees cannot be negative'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    if (uploadingImage) {
      toast.info('Please wait for the image upload to finish')
      return
    }
    setSaving(true)
    try {
      // Only the doctor-editable fields are sent; the backend ignores the rest.
      await api.put('/profile', {
        fees: Number(formData.fees) || 0,
        phone: formData.phone,
        image: formData.image,
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
      await fetchProfile()
      window.dispatchEvent(new CustomEvent('profile:updated', {
        detail: { profileImage: formData.image || '' },
      }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setErrors({})
    fetchProfile()
  }

  if (isLoading) {
    return (
      <DoctorLayout>
        <p className="text-sm text-gray-500">Loading profile…</p>
      </DoctorLayout>
    )
  }

  const inputCls = (field) =>
    `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
      errors[field] ? 'border-red-300' : 'border-gray-300'
    } ${!isEditing ? 'bg-gray-50' : ''}`

  return (
    <DoctorLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-700">My Profile</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <img
                src={formData.image || assets.upload_area}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover bg-gray-100"
              />
              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    title="Change photo"
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 hover:bg-black/60 transition-colors disabled:cursor-wait"
                  >
                    {uploadingImage ? (
                      <span className="text-white text-xs">Uploading…</span>
                    ) : (
                      <img src={assets.upload_icon} alt="Upload" className="w-8 h-8" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{formData.name}</h3>
            <p className="text-sm text-gray-600">{formData.speciality || 'Doctor'}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <img src={assets.verified_icon} alt="Verified" className="w-4 h-4" />
              <span className="text-xs text-green-600 font-medium">Verified Doctor</span>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-center">
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Consultation Fee</h4>
              <p className="text-sm text-gray-600">${formData.fees || 0}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Experience</h4>
              <p className="text-sm text-gray-600">{formData.experience || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-1">Member Since</h4>
              <p className="text-sm text-gray-600">
                {memberSince ? new Date(memberSince).toLocaleDateString() : 'Not available'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Professional Information</h2>
          <p className="text-xs text-gray-500 mb-6">
            You can update your consultation fee, phone number and photo. Other details are managed by the admin.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input id="name" name="name" type="text" value={formData.name} disabled className={inputCls('name')} />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input id="email" name="email" type="email" value={formData.email} disabled className={inputCls('email')} />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} disabled={!isEditing} className={inputCls('phone')} />
              </div>
              <div>
                <label htmlFor="speciality" className="block text-sm font-medium text-gray-700 mb-2">Speciality *</label>
                <select id="speciality" name="speciality" value={formData.speciality} disabled className={inputCls('speciality')}>
                  <option value="">Select speciality</option>
                  {SPECIALITIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.speciality && <p className="mt-1 text-sm text-red-600">{errors.speciality}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="education" className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                <input id="education" name="education" type="text" value={formData.education} disabled placeholder="e.g. MBBS" className={inputCls('education')} />
              </div>
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                <input id="experience" name="experience" type="text" value={formData.experience} disabled placeholder="e.g. 5 Years" className={inputCls('experience')} />
              </div>
              <div>
                <label htmlFor="fees" className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee ($)</label>
                <input id="fees" name="fees" type="number" min="0" value={formData.fees} onChange={handleChange} disabled={!isEditing} className={inputCls('fees')} />
                {errors.fees && <p className="mt-1 text-sm text-red-600">{errors.fees}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">Clinic Address</label>
              <input id="address" name="address" type="text" value={formData.address} disabled className={inputCls('address')} />
            </div>

            <div>
              <label htmlFor="about" className="block text-sm font-medium text-gray-700 mb-2">About</label>
              <textarea id="about" name="about" rows={4} value={formData.about} disabled placeholder="Brief description shown to patients" className={inputCls('about')} />
            </div>
          </form>
        </div>
      </div>
    </DoctorLayout>
  )
}

export default DoctorProfile
