import React, { useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const Login = () => {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const { login, user } = useAuth()
  const [role, setRole] = useState('patient')
  // Prefill the email if it was remembered from a previous session
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('auth:rememberedEmail'))
  const [formData, setFormData] = useState({
    name: '',
    email: localStorage.getItem('auth:rememberedEmail') || '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotState, setForgotState] = useState('idle') // idle | loading | sent | error
  const [resetLink, setResetLink] = useState('')

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotState('loading')
    try {
      const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000' })
      const res = await api.post('/auth/forgot-password', { email: forgotEmail })
      if (res.data.resetToken) {
        setResetLink(`/reset-password/${res.data.resetToken}`)
      }
      setForgotState('sent')
    } catch {
      setForgotState('error')
    }
  }

  const closeForgot = () => {
    setShowForgot(false)
    setForgotEmail('')
    setForgotState('idle')
    setResetLink('')
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

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Name is required'
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000' })
      if (isLogin) {
        const res = await api.post('/auth/login', {
          email: formData.email,
          password: formData.password,
          role,
        })
        const { token, user } = res.data || {}
        if (!token || !user) throw new Error('Invalid login response')
        // Remember the email for next time (never the password)
        if (rememberMe) {
          localStorage.setItem('auth:rememberedEmail', formData.email)
        } else {
          localStorage.removeItem('auth:rememberedEmail')
        }
        // update app auth with token and user info
        login({ token, user })
        if (user.role === 'admin') navigate('/admin')
        else if (user.role === 'doctor') navigate('/doctor')
        else navigate('/')
      } else {
        // self-registration always creates a patient account
        const res = await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        })
        const { token, user } = res.data || {}
        if (!token || !user) throw new Error('Invalid register response')
        // update app auth with token and user info
        login({ token, user })
        if (user.role === 'admin') navigate('/admin')
        else if (user.role === 'doctor') navigate('/doctor')
        else navigate('/')
      }
    } catch (err) {
      alert(err?.response?.data?.error || err.message || 'Authentication failed')
    }
  }

  // already signed in — don't show the form again, send to the right dashboard
  if (user) {
    if (user.role === 'admin') return <Navigate to='/admin' replace />
    if (user.role === 'doctor') return <Navigate to='/doctor' replace />
    return <Navigate to='/' replace />
  }

  return (
    <>
    {/* Forgot Password Modal */}
    {showForgot && (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4'>
        <div className='bg-white rounded-xl shadow-xl p-8 w-full max-w-md'>
          <h2 className='text-xl font-bold text-gray-800 mb-2'>Reset your password</h2>
          {forgotState === 'sent' ? (
            <div className='space-y-4'>
              <p className='text-sm text-gray-600'>
                Reset link generated. Click below to set your new password.
              </p>
              <button
                onClick={() => { closeForgot(); navigate(resetLink) }}
                className='w-full bg-primary text-white py-2 px-4 rounded-md font-medium hover:bg-primary/90'
              >
                Go to Reset Password
              </button>
              <button onClick={closeForgot} className='w-full text-sm text-gray-500 hover:text-gray-700'>
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotSubmit} className='space-y-4'>
              <p className='text-sm text-gray-600'>
                Enter your registered email and we'll generate a password reset link.
              </p>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Email address</label>
                <input
                  type='email'
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  required
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                  placeholder='Enter your email'
                />
              </div>
              {forgotState === 'error' && (
                <p className='text-sm text-red-600'>Something went wrong. Please try again.</p>
              )}
              <div className='flex gap-3'>
                <button
                  type='submit'
                  disabled={forgotState === 'loading'}
                  className='flex-1 bg-primary text-white py-2 px-4 rounded-md font-medium hover:bg-primary/90 disabled:opacity-50'
                >
                  {forgotState === 'loading' ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button
                  type='button'
                  onClick={closeForgot}
                  className='flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-300'
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    )}

    <div className='min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8 bg-white border border-gray-200 rounded-2xl shadow-lg p-8 sm:p-10'>
        <div className='text-center'>
          <img className='mx-auto h-20 w-auto' src={assets.logo} alt="Logo" />
          <h2 className='mt-6 text-3xl font-bold text-gray-900'>
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className='mt-2 text-sm text-gray-600'>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className='font-medium text-primary hover:text-primary/80'
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          <div className='space-y-4'>
            {isLogin && (
              <div>
                <label htmlFor='role' className='block text-sm font-medium text-gray-700'>
                  Sign in as
                </label>
                <select
                  id='role'
                  name='role'
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm'
                >
                  <option value='patient'>Patient</option>
                  <option value='doctor'>Doctor</option>
                  <option value='admin'>Admin</option>
                </select>
              </div>
            )}
            {!isLogin && (
              <div>
                <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                  Full Name
                </label>
                <input
                  id='name'
                  name='name'
                  type='text'
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                  placeholder='Enter your full name'
                />
                {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name}</p>}
              </div>
            )}

            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700'>
                Email address
              </label>
              <input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                placeholder='Enter your email'
              />
              {errors.email && <p className='mt-1 text-sm text-red-600'>{errors.email}</p>}
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                Password
              </label>
              <div className='relative'>
                <input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 appearance-none relative block w-full px-3 py-2 pr-16 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                  placeholder='Enter your password'
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

            {!isLogin && (
              <div>
                <label htmlFor='confirmPassword' className='block text-sm font-medium text-gray-700'>
                  Confirm Password
                </label>
                <div className='relative'>
                  <input
                    id='confirmPassword'
                    name='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`mt-1 appearance-none relative block w-full px-3 py-2 pr-16 border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                    placeholder='Confirm your password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute inset-y-0 right-0 top-1 z-20 flex items-center pr-3 text-sm font-medium text-primary hover:text-primary/80'
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errors.confirmPassword && <p className='mt-1 text-sm text-red-600'>{errors.confirmPassword}</p>}
              </div>
            )}
          </div>

          {isLogin && (
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <input
                  id='remember-me'
                  name='remember-me'
                  type='checkbox'
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className='h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded'
                />
                <label htmlFor='remember-me' className='ml-2 block text-sm text-gray-900'>
                  Remember me
                </label>
              </div>
              <div className='text-sm'>
                <button
                  type='button'
                  onClick={() => setShowForgot(true)}
                  className='font-medium text-primary hover:text-primary/80'
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          )}

          <div>
            <button
              type='submit'
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
            >
              {isLogin ? 'Sign in' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  )
}

export default Login