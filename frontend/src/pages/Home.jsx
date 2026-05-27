import React, { useState, useEffect } from 'react'
import { assets, specialityData } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { fetchDoctors } from '../utils/doctors'

const Home = () => {
  const navigate = useNavigate()
  const [doctors, setDoctors] = useState([])

  useEffect(() => {
    fetchDoctors().then(setDoctors)
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <div className='flex flex-col md:flex-row items-center justify-between gap-8 py-12'>
        <div className='flex-1'>
          <h1 className='text-4xl md:text-6xl font-bold text-gray-800 leading-tight'>
            Your Health, Our 
            <span className='text-primary'> Priority</span>
          </h1>
          <p className='text-lg text-gray-600 mt-6 leading-relaxed'>
            Connect with qualified doctors instantly through our telemedical platform. 
            Book appointments, get consultations, and manage your health from the comfort of your home.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 mt-8'>
            <button 
              onClick={() => navigate('/doctors')}
              className='bg-primary text-white px-8 py-4 rounded-full font-medium hover:bg-primary/90 transition-colors'
            >
              Find Doctors
            </button>
            <button 
              onClick={() => navigate('/about')}
              className='border-2 border-primary text-primary px-8 py-4 rounded-full font-medium hover:bg-primary hover:text-white transition-colors'
            >
              Learn More
            </button>
          </div>
        </div>
        <div className='flex-1 flex justify-center'>
          <img src={assets.header_img} alt="Telemedicine" className='max-w-full h-auto' />
        </div>
      </div>

      {/* Specialities Section */}
      <div className='py-16'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-800 mb-4'>
            Medical Specialities
          </h2>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Choose from our wide range of medical specialities to find the right doctor for your needs
          </p>
        </div>
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6'>
          {specialityData.map((speciality, index) => (
            <div 
              key={index}
              onClick={() => navigate(`/doctors/${speciality.speciality.toLowerCase().replace(' ', '-')}`)}
              className='bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-gray-100'
            >
              <img src={speciality.image} alt={speciality.speciality} className='w-16 h-16 mx-auto mb-4' />
              <h3 className='text-sm font-medium text-gray-800 text-center'>
                {speciality.speciality}
              </h3>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Doctors Section */}
      <div className='py-16 bg-gray-50 rounded-2xl'>
        <div className='text-center mb-12'>
          <h2 className='text-3xl md:text-4xl font-bold text-gray-800 mb-4'>
            Featured Doctors
          </h2>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Meet our top-rated doctors who are ready to provide you with the best medical care
          </p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {doctors.slice(0, 6).map((doctor) => (
            <div key={doctor._id} className='bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow'>
              <div className='flex items-center gap-4 mb-4'>
                <img src={doctor.image} alt={doctor.name} className='w-16 h-16 rounded-full object-cover' />
                <div>
                  <h3 className='font-semibold text-gray-800'>{doctor.name}</h3>
                  <p className='text-sm text-gray-600'>{doctor.speciality}</p>
                  <p className='text-sm text-gray-500'>{doctor.degree} • {doctor.experience}</p>
                </div>
              </div>
              <p className='text-sm text-gray-600 mb-4 line-clamp-3'>{doctor.about}</p>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-500'>Consultation Fee</p>
                  <p className='font-semibold text-primary'>${doctor.fees}</p>
                </div>
                <button 
                  onClick={() => navigate(`/appointment/${doctor._id}`)}
                  className='bg-primary text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors'
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className='text-center mt-8'>
          <button 
            onClick={() => navigate('/doctors')}
            className='bg-white text-primary border-2 border-primary px-8 py-3 rounded-full font-medium hover:bg-primary hover:text-white transition-colors'
          >
            View All Doctors
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className='py-16'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
          <div>
            <h3 className='text-3xl font-bold text-primary mb-2'>500+</h3>
            <p className='text-gray-600'>Qualified Doctors</p>
          </div>
          <div>
            <h3 className='text-3xl font-bold text-primary mb-2'>10K+</h3>
            <p className='text-gray-600'>Happy Patients</p>
          </div>
          <div>
            <h3 className='text-3xl font-bold text-primary mb-2'>24/7</h3>
            <p className='text-gray-600'>Available Support</p>
          </div>
          <div>
            <h3 className='text-3xl font-bold text-primary mb-2'>6+</h3>
            <p className='text-gray-600'>Medical Specialities</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home