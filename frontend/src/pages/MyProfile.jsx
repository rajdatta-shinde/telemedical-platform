import React, { useState, useEffect, useRef } from 'react'
import { assets } from '../assets/assets'
import api from '../utils/axios'
import { toast } from 'react-toastify'
import { uploadImage } from '../utils/uploadImage'

// Patients store `address` as a plain string, but doctors store it as an object
// ({ line1, line2 }). The form binds address to a text input, so an object would
// render as "[object Object]". Flatten it to a single string for display.
const normalizeAddress = (address) => {
  if (!address) return ''
  if (typeof address === 'string') return address
  return [address.line1, address.line2].filter(Boolean).join(', ')
}

const MyProfile = () => {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalHistory: '',
    currentMedications: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        setIsLoading(false)
        return
      }

      const response = await api.get('/profile')
      console.log('Fetched profile:', response.data)
      const { stats, ...profileData } = response.data
      setFormData({
        ...profileData,
        address: normalizeAddress(profileData.address),
        stats: {
          totalAppointments: stats?.totalAppointments || 0,
          lastVisit: stats?.lastVisit ? new Date(stats.lastVisit).toLocaleDateString() : 'No visits yet',
          upcomingAppointments: stats?.upcomingAppointments || 0,
          completedAppointments: stats?.completedAppointments || 0
        }
      })
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching profile:', error.response?.data || error.message)
      setIsLoading(false)
      toast.error(error.response?.data?.message || 'Failed to load profile. Please try logging in again.')
    }
  }
  const [errors, setErrors] = useState({})
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef(null)

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
      setFormData((prev) => ({ ...prev, profileImage: url }))
    } catch (error) {
      console.error('Image upload failed:', error)
      toast.error(error.response?.data?.message || 'Image upload failed')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required'
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (uploadingImage) {
      toast.info('Please wait for the image upload to finish')
      return
    }
    if (validateForm()) {
      try {
        const token = sessionStorage.getItem('token')
        if (!token) {
          toast.error('Please log in to update your profile')
          return
        }

        console.log('Sending profile update:', formData)
        const response = await api.put('/profile', formData)

        console.log('Profile update response:', response.data)
        setIsEditing(false)
        toast.success('Profile updated successfully!')
        await fetchProfile() // Refresh profile data
        // Notify other components (e.g. NavBar) that the profile changed
        window.dispatchEvent(new CustomEvent('profile:updated', {
          detail: { profileImage: formData.profileImage || '' }
        }))
      } catch (error) {
        console.error('Error updating profile:', error.response?.data || error.message)
        toast.error(error.response?.data?.message || 'Failed to update profile. Please try again.')
      }
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setErrors({})
    fetchProfile() // discard any unsaved edits, including the profile image
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className='py-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-800 mb-2'>My Profile</h1>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Profile Picture and Basic Info */}
          <div className='lg:col-span-1'>
            <div className='bg-white p-6 rounded-xl shadow-md border border-gray-100'>
              <div className='text-center'>
                <div className='relative w-24 h-24 mx-auto mb-4'>
                  <img
                    src={formData.profileImage || assets.upload_area}
                    alt="Profile"
                    className='w-24 h-24 rounded-full object-cover'
                  />
                  {isEditing && (
                    <>
                      <button
                        type='button'
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        title='Change profile photo'
                        className='absolute inset-0 flex items-center justify-center rounded-full bg-black/45 hover:bg-black/60 transition-colors disabled:cursor-wait'
                      >
                        {uploadingImage ? (
                          <span className='text-white text-xs'>Uploading…</span>
                        ) : (
                          <img src={assets.upload_icon} alt='Upload' className='w-8 h-8' />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                        className='hidden'
                      />
                    </>
                  )}
                </div>
                <h3 className='text-xl font-semibold text-gray-800'>{formData.name}</h3>
                <p className='text-gray-600'>{formData.email}</p>
                <div className='flex items-center justify-center gap-1 mt-2'>
                  <img src={assets.verified_icon} alt="Verified" className='w-4 h-4' />
                  <span className='text-xs text-green-600 font-medium'>Verified Account</span>
                </div>
              </div>

              <div className='mt-6 space-y-4'>
                <div className='text-center'>
                  <h4 className='font-medium text-gray-800 mb-2'>Member Since</h4>
                  <p className='text-sm text-gray-600'>
                    {formData.memberSince ? new Date(formData.memberSince).toLocaleDateString() : 'Not available'}
                  </p>
                </div>

                <div className='text-center'>
                  <h4 className='font-medium text-gray-800 mb-2'>Appointments</h4>
                  <p className='text-sm text-gray-600'>
                    Total: {formData.stats?.totalAppointments || 0}
                  </p>
                  <p className='text-sm text-green-600'>
                    Upcoming: {formData.stats?.upcomingAppointments || 0}
                  </p>
                  <p className='text-sm text-blue-600'>
                    Completed: {formData.stats?.completedAppointments || 0}
                  </p>
                </div>

                <div className='text-center'>
                  <h4 className='font-medium text-gray-800 mb-2'>Last Visit</h4>
                  <p className='text-sm text-gray-600'>{formData.stats?.lastVisit || 'No visits yet'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className='lg:col-span-2'>
            <div className='bg-white p-6 rounded-xl shadow-md border border-gray-100'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-xl font-semibold text-gray-800'>Personal Information</h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className='bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors'
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className='flex gap-2'>
                    <button
                      onClick={handleCancel}
                      className='bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors'
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      className='bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors'
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-2'>
                      Full Name *
                    </label>
                    <input
                      type='text'
                      id='name'
                      name='name'
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                    {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-2'>
                      Email Address *
                    </label>
                    <input
                      type='email'
                      id='email'
                      name='email'
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                    {errors.email && <p className='mt-1 text-sm text-red-600'>{errors.email}</p>}
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-2'>
                      Phone Number *
                    </label>
                    <input
                      type='tel'
                      id='phone'
                      name='phone'
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                    {errors.phone && <p className='mt-1 text-sm text-red-600'>{errors.phone}</p>}
                  </div>

                  <div>
                    <label htmlFor='dateOfBirth' className='block text-sm font-medium text-gray-700 mb-2'>
                      Date of Birth *
                    </label>
                    <input
                      type='date'
                      id='dateOfBirth'
                      name='dateOfBirth'
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                    {errors.dateOfBirth && <p className='mt-1 text-sm text-red-600'>{errors.dateOfBirth}</p>}
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <label htmlFor='gender' className='block text-sm font-medium text-gray-700 mb-2'>
                      Gender *
                    </label>
                    <select
                      id='gender'
                      name='gender'
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.gender ? 'border-red-300' : 'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                    >
                      <option value=''>Select gender</option>
                      <option value='Male'>Male</option>
                      <option value='Female'>Female</option>
                      <option value='Other'>Other</option>
                      <option value='Prefer not to say'>Prefer not to say</option>
                    </select>
                    {errors.gender && <p className='mt-1 text-sm text-red-600'>{errors.gender}</p>}
                  </div>

                  <div>
                    <label htmlFor='address' className='block text-sm font-medium text-gray-700 mb-2'>
                      Address
                    </label>
                    <input
                      type='text'
                      id='address'
                      name='address'
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        'border-gray-300'
                      } ${!isEditing ? 'bg-gray-50' : ''}`}
                    />
                  </div>
                </div>

                <div className='border-t pt-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4'>Emergency Contact</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label htmlFor='emergencyContact' className='block text-sm font-medium text-gray-700 mb-2'>
                        Emergency Contact Name
                      </label>
                      <input
                        type='text'
                        id='emergencyContact'
                        name='emergencyContact'
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          'border-gray-300'
                        } ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>

                    <div>
                      <label htmlFor='emergencyPhone' className='block text-sm font-medium text-gray-700 mb-2'>
                        Emergency Contact Phone
                      </label>
                      <input
                        type='tel'
                        id='emergencyPhone'
                        name='emergencyPhone'
                        value={formData.emergencyPhone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          'border-gray-300'
                        } ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                <div className='border-t pt-6'>
                  <h3 className='text-lg font-semibold text-gray-800 mb-4'>Medical Information</h3>
                  <div className='space-y-4'>
                    <div>
                      <label htmlFor='medicalHistory' className='block text-sm font-medium text-gray-700 mb-2'>
                        Medical History
                      </label>
                      <textarea
                        id='medicalHistory'
                        name='medicalHistory'
                        value={formData.medicalHistory}
                        onChange={handleChange}
                        disabled={!isEditing}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          'border-gray-300'
                        } ${!isEditing ? 'bg-gray-50' : ''}`}
                        placeholder='Describe any relevant medical history'
                      />
                    </div>

                    <div>
                      <label htmlFor='currentMedications' className='block text-sm font-medium text-gray-700 mb-2'>
                        Current Medications
                      </label>
                      <textarea
                        id='currentMedications'
                        name='currentMedications'
                        value={formData.currentMedications}
                        onChange={handleChange}
                        disabled={!isEditing}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                          'border-gray-300'
                        } ${!isEditing ? 'bg-gray-50' : ''}`}
                        placeholder='List any current medications'
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MyProfile