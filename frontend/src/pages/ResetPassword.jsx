import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import axios from 'axios'

const ResetPassword = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!form.password || form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setIsLoading(true)
    try {
      const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000' })
      await api.post('/auth/reset-password', { token, password: form.password })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setErrors({ general: err?.response?.data?.error || 'Reset failed. The link may have expired.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center py-12 px-4'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <img className='mx-auto h-20 w-auto' src={assets.logo} alt="Logo" />
          <h2 className='mt-6 text-3xl font-bold text-gray-900'>Set new password</h2>
          <p className='mt-2 text-sm text-gray-600'>Enter your new password below.</p>
        </div>

        {success ? (
          <div className='bg-green-50 border border-green-200 rounded-lg p-6 text-center'>
            <p className='text-green-700 font-medium'>Password reset successfully!</p>
            <p className='text-sm text-green-600 mt-1'>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
            <div className='space-y-4'>
              <div>
                <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                  New Password
                </label>
                <div className='relative'>
                  <input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    className={`mt-1 w-full px-3 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder='Enter new password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 top-1 z-20 flex items-center pr-3 text-sm font-medium text-primary hover:text-primary/80'
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.password && <p className='mt-1 text-sm text-red-600'>{errors.password}</p>}
              </div>

              <div>
                <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700'>
                  Confirm New Password
                </label>
                <div className='relative'>
                  <input
                    id='confirmPassword'
                    name='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={`mt-1 w-full px-3 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder='Confirm new password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute inset-y-0 right-0 top-1 z-20 flex items-center pr-3 text-sm font-medium text-primary hover:text-primary/80'
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className='mt-1 text-sm text-red-600'>{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {errors.general && (
              <p className='text-sm text-red-600 text-center'>{errors.general}</p>
            )}

            <button
              type='submit'
              disabled={isLoading}
              className='w-full py-2 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>

            <p className='text-center text-sm text-gray-600'>
              <button
                type='button'
                onClick={() => navigate('/login')}
                className='text-primary hover:text-primary/80 font-medium'
              >
                Back to Sign In
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
