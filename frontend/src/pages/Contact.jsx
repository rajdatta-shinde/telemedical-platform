import React, { useState } from 'react'
import { assets } from '../assets/assets'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (validateForm()) {
      setIsSubmitting(true)
      
      // Simulate API call
      setTimeout(() => {
        console.log('Contact form submitted:', formData)
        setIsSubmitting(false)
        alert('Thank you for your message! We will get back to you within 24 hours.')
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        })
      }, 2000)
    }
  }

  const contactInfo = [
    {
      icon: '📧',
      title: 'Email Us',
      details: ['support@telemedical.com', 'info@telemedical.com'],
      description: 'Send us an email and we\'ll respond within 24 hours'
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: ['+1 (555) 123-4567', '+1 (555) 987-6543'],
      description: 'Mon-Fri from 8am to 6pm EST'
    },
    {
      icon: '📍',
      title: 'Visit Us',
      details: ['123 Healthcare Ave', 'Medical District, NY 10001'],
      description: 'Come visit our headquarters'
    },
    {
      icon: '💬',
      title: 'Live Chat',
      details: ['Available 24/7', 'Instant support'],
      description: 'Chat with our support team anytime'
    }
  ]

  const faqs = [
    {
      question: 'How do I book an appointment?',
      answer: 'You can book an appointment by browsing our doctors, selecting a speciality, and choosing your preferred date and time. The process is simple and takes just a few minutes.'
    },
    {
      question: 'Are your doctors verified?',
      answer: 'Yes, all our doctors are verified and licensed medical professionals. We thoroughly vet each doctor before they join our platform to ensure quality care.'
    },
    {
      question: 'What if I need to cancel my appointment?',
      answer: 'You can cancel your appointment up to 24 hours before your scheduled time through your account dashboard or by contacting our support team.'
    },
    {
      question: 'Is my medical information secure?',
      answer: 'Absolutely. We use industry-standard encryption and security measures to protect your personal and medical information. Your privacy is our top priority.'
    },
    {
      question: 'Do you accept insurance?',
      answer: 'We accept most major insurance plans. You can check your coverage during the booking process or contact our support team for assistance.'
    },
    {
      question: 'Can I get a prescription through telemedicine?',
      answer: 'Yes, our doctors can prescribe medications when appropriate. Prescriptions are sent directly to your preferred pharmacy for pickup.'
    }
  ]

  return (
    <div>
      {/* Hero Section */}
      <div className='py-16 bg-gradient-to-r from-primary/10 to-blue-100'>
        <div className='max-w-4xl mx-auto text-center px-4'>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-800 mb-6'>
            Contact Us
          </h1>
          <p className='text-lg text-gray-600 mb-8 leading-relaxed'>
            Have questions or need help? We're here to assist you. Reach out to us through 
            any of the channels below, and we'll get back to you as soon as possible.
          </p>
        </div>
      </div>

      {/* Contact Information */}
      <div className='py-16'>
        <div className='max-w-6xl mx-auto px-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16'>
            {contactInfo.map((info, index) => (
              <div key={index} className='bg-white p-6 rounded-xl shadow-md text-center hover:shadow-lg transition-shadow'>
                <div className='text-4xl mb-4'>{info.icon}</div>
                <h3 className='text-xl font-semibold text-gray-800 mb-3'>{info.title}</h3>
                <div className='space-y-1 mb-3'>
                  {info.details.map((detail, idx) => (
                    <p key={idx} className='text-gray-600 font-medium'>{detail}</p>
                  ))}
                </div>
                <p className='text-sm text-gray-500'>{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Form & Image */}
      <div className='py-16 bg-gray-50'>
        <div className='max-w-6xl mx-auto px-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-start'>
            {/* Contact Form */}
            <div className='bg-white p-8 rounded-xl shadow-md'>
              <h2 className='text-2xl font-bold text-gray-800 mb-6'>Send us a Message</h2>
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
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder='Enter your full name'
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
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder='Enter your email'
                    />
                    {errors.email && <p className='mt-1 text-sm text-red-600'>{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-2'>
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    id='phone'
                    name='phone'
                    value={formData.phone}
                    onChange={handleChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
                    placeholder='Enter your phone number'
                  />
                </div>

                <div>
                  <label htmlFor='subject' className='block text-sm font-medium text-gray-700 mb-2'>
                    Subject *
                  </label>
                  <select
                    id='subject'
                    name='subject'
                    value={formData.subject}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.subject ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value=''>Select a subject</option>
                    <option value='general'>General Inquiry</option>
                    <option value='technical'>Technical Support</option>
                    <option value='billing'>Billing Question</option>
                    <option value='appointment'>Appointment Issue</option>
                    <option value='feedback'>Feedback</option>
                    <option value='other'>Other</option>
                  </select>
                  {errors.subject && <p className='mt-1 text-sm text-red-600'>{errors.subject}</p>}
                </div>

                <div>
                  <label htmlFor='message' className='block text-sm font-medium text-gray-700 mb-2'>
                    Message *
                  </label>
                  <textarea
                    id='message'
                    name='message'
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${
                      errors.message ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder='Tell us how we can help you...'
                  />
                  {errors.message && <p className='mt-1 text-sm text-red-600'>{errors.message}</p>}
                </div>

                <button
                  type='submit'
                  disabled={isSubmitting}
                  className='w-full bg-primary text-white py-3 px-6 rounded-md font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                >
                  {isSubmitting ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Contact Image */}
            <div className='flex justify-center'>
              <img src={assets.contact_image} alt="Contact Us" className='max-w-full h-auto rounded-lg shadow-lg' />
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className='py-16'>
        <div className='max-w-4xl mx-auto px-4'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-800 mb-4'>Frequently Asked Questions</h2>
            <p className='text-lg text-gray-600'>
              Find answers to common questions about our telemedicine platform
            </p>
          </div>
          <div className='space-y-6'>
            {faqs.map((faq, index) => (
              <div key={index} className='bg-white p-6 rounded-xl shadow-md border border-gray-100'>
                <h3 className='text-lg font-semibold text-gray-800 mb-3'>{faq.question}</h3>
                <p className='text-gray-600'>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className='py-16 bg-gray-50'>
        <div className='max-w-6xl mx-auto px-4'>
          <div className='text-center mb-8'>
            <h2 className='text-3xl font-bold text-gray-800 mb-4'>Find Us</h2>
            <p className='text-lg text-gray-600'>
              Visit our headquarters or explore our service areas
            </p>
          </div>
          <div className='bg-white p-8 rounded-xl shadow-md'>
            <div className='aspect-video bg-gray-200 rounded-lg flex items-center justify-center'>
              <div className='text-center text-gray-500'>
                <div className='text-4xl mb-2'>🗺️</div>
                <p className='text-lg font-medium'>Interactive Map</p>
                <p className='text-sm'>123 Healthcare Ave, Medical District, NY 10001</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact