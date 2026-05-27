import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'

const About = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: '🏥',
      title: 'Qualified Doctors',
      description: 'Access to verified and experienced medical professionals across various specialities'
    },
    {
      icon: '⏰',
      title: '24/7 Availability',
      description: 'Book appointments and get medical consultations anytime, anywhere'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your medical information is protected with industry-standard security measures'
    },
    {
      icon: '💻',
      title: 'Easy Booking',
      description: 'Simple and intuitive appointment booking system with real-time availability'
    },
    {
      icon: '📱',
      title: 'Mobile Friendly',
      description: 'Access our platform from any device with our responsive design'
    },
    {
      icon: '💬',
      title: 'Instant Support',
      description: 'Get help when you need it with our dedicated customer support team'
    }
  ]

  const stats = [
    { number: '500+', label: 'Qualified Doctors' },
    { number: '10,000+', label: 'Happy Patients' },
    { number: '50,000+', label: 'Successful Consultations' },
    { number: '99%', label: 'Patient Satisfaction' }
  ]

  const team = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Medical Officer',
      image: assets.profile_pic,
      description: 'Leading our medical team with over 15 years of experience in healthcare management.'
    },
    {
      name: 'Michael Chen',
      role: 'Technology Director',
      image: assets.profile_pic,
      description: 'Ensuring our platform delivers the best user experience with cutting-edge technology.'
    },
    {
      name: 'Dr. Emily Rodriguez',
      role: 'Patient Care Director',
      image: assets.profile_pic,
      description: 'Dedicated to improving patient outcomes and healthcare accessibility.'
    }
  ]

  return (
    <div>
      {/* Hero Section */}
      <div className='py-16 bg-gradient-to-r from-primary/10 to-blue-100'>
        <div className='max-w-4xl mx-auto text-center px-4'>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-800 mb-6'>
            About Our Telemedical Platform
          </h1>
          <p className='text-lg text-gray-600 mb-8 leading-relaxed'>
            We're revolutionizing healthcare by connecting patients with qualified doctors through 
            our innovative telemedicine platform. Our mission is to make quality healthcare 
            accessible, convenient, and affordable for everyone.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <button 
              onClick={() => navigate('/doctors')}
              className='bg-primary text-white px-8 py-3 rounded-full font-medium hover:bg-primary/90 transition-colors'
            >
              Find Doctors
            </button>
            <button 
              onClick={() => navigate('/contact')}
              className='border-2 border-primary text-primary px-8 py-3 rounded-full font-medium hover:bg-primary hover:text-white transition-colors'
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className='py-16'>
        <div className='max-w-6xl mx-auto px-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'>
            <div>
              <h2 className='text-3xl font-bold text-gray-800 mb-6'>Our Mission</h2>
              <p className='text-lg text-gray-600 mb-6 leading-relaxed'>
                To democratize healthcare by providing easy access to qualified medical professionals 
                through technology. We believe that quality healthcare should be available to everyone, 
                regardless of location or circumstances.
              </p>
              <h3 className='text-2xl font-bold text-gray-800 mb-4'>Our Vision</h3>
              <p className='text-lg text-gray-600 leading-relaxed'>
                To become the leading telemedicine platform that bridges the gap between patients 
                and healthcare providers, making healthcare more efficient, accessible, and patient-centered.
              </p>
            </div>
            <div className='flex justify-center'>
              <img src={assets.about_image} alt="About Us" className='max-w-full h-auto rounded-lg shadow-lg' />
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className='py-16 bg-gray-50'>
        <div className='max-w-6xl mx-auto px-4'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-800 mb-4'>Why Choose Us?</h2>
            <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
              We provide comprehensive telemedicine solutions designed to meet your healthcare needs
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {features.map((feature, index) => (
              <div key={index} className='bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow'>
                <div className='text-4xl mb-4'>{feature.icon}</div>
                <h3 className='text-xl font-semibold text-gray-800 mb-3'>{feature.title}</h3>
                <p className='text-gray-600'>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='py-16'>
        <div className='max-w-6xl mx-auto px-4'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-800 mb-4'>Our Impact</h2>
            <p className='text-lg text-gray-600'>
              Numbers that reflect our commitment to healthcare excellence
            </p>
          </div>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
            {stats.map((stat, index) => (
              <div key={index} className='text-center'>
                <div className='text-4xl font-bold text-primary mb-2'>{stat.number}</div>
                <div className='text-gray-600'>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div className='py-16 bg-gray-50'>
        <div className='max-w-6xl mx-auto px-4'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-bold text-gray-800 mb-4'>Meet Our Team</h2>
            <p className='text-lg text-gray-600'>
              The dedicated professionals behind our platform
            </p>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {team.map((member, index) => (
              <div key={index} className='bg-white p-6 rounded-xl shadow-md text-center'>
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className='w-24 h-24 rounded-full object-cover mx-auto mb-4'
                />
                <h3 className='text-xl font-semibold text-gray-800 mb-2'>{member.name}</h3>
                <p className='text-primary font-medium mb-3'>{member.role}</p>
                <p className='text-gray-600 text-sm'>{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Values */}
      <div className='py-16'>
        <div className='max-w-4xl mx-auto px-4 text-center'>
          <h2 className='text-3xl font-bold text-gray-800 mb-8'>Our Core Values</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='p-6'>
              <h3 className='text-xl font-semibold text-gray-800 mb-3'>Patient-Centered Care</h3>
              <p className='text-gray-600'>
                Every decision we make is guided by what's best for our patients. 
                We prioritize their health, comfort, and convenience above all else.
              </p>
            </div>
            <div className='p-6'>
              <h3 className='text-xl font-semibold text-gray-800 mb-3'>Innovation & Technology</h3>
              <p className='text-gray-600'>
                We leverage cutting-edge technology to improve healthcare delivery 
                and make medical services more accessible and efficient.
              </p>
            </div>
            <div className='p-6'>
              <h3 className='text-xl font-semibold text-gray-800 mb-3'>Trust & Transparency</h3>
              <p className='text-gray-600'>
                We maintain the highest standards of transparency and build trust 
                through honest communication and reliable service delivery.
              </p>
            </div>
            <div className='p-6'>
              <h3 className='text-xl font-semibold text-gray-800 mb-3'>Accessibility</h3>
              <p className='text-gray-600'>
                We believe quality healthcare should be accessible to everyone, 
                regardless of their location, background, or circumstances.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className='py-16 bg-primary text-white'>
        <div className='max-w-4xl mx-auto text-center px-4'>
          <h2 className='text-3xl font-bold mb-4'>Ready to Get Started?</h2>
          <p className='text-lg mb-8 opacity-90'>
            Join thousands of patients who trust us with their healthcare needs
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <button 
              onClick={() => navigate('/doctors')}
              className='bg-white text-primary px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors'
            >
              Book Your First Appointment
            </button>
            <button 
              onClick={() => navigate('/contact')}
              className='border-2 border-white text-white px-8 py-3 rounded-full font-medium hover:bg-white hover:text-primary transition-colors'
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default About