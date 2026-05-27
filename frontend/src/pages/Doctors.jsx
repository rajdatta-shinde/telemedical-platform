import React, { useState, useEffect } from 'react'
import { specialityData, assets } from '../assets/assets'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchDoctors } from '../utils/doctors'
import { isUnavailableNow } from '../utils/availability'

const Doctors = () => {
  const navigate = useNavigate()
  const { speciality } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpeciality, setSelectedSpeciality] = useState(speciality || 'All')
  const [allDoctors, setAllDoctors] = useState([])
  const [filteredDoctors, setFilteredDoctors] = useState([])

  // Load doctors from the backend (admin-added) merged with the seed list
  useEffect(() => {
    fetchDoctors().then(setAllDoctors)
  }, [])

  useEffect(() => {
    let filtered = allDoctors

    // Filter by speciality
    if (selectedSpeciality !== 'All') {
      filtered = filtered.filter(doctor => 
        doctor.speciality.toLowerCase() === selectedSpeciality.toLowerCase()
      )
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.speciality.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredDoctors(filtered)
  }, [searchTerm, selectedSpeciality, allDoctors])

  const handleSpecialityClick = (spec) => {
    setSelectedSpeciality(spec)
    navigate(`/doctors/${spec.toLowerCase().replace(' ', '-')}`)
  }

  return (
    <div className='py-8'>
      {/* Header */}
      <div className='text-center mb-12'>
        <h1 className='text-4xl font-bold text-gray-800 mb-4'>Find Your Doctor</h1>
        <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
          Browse through our qualified doctors and book an appointment that fits your schedule
        </p>
      </div>

      {/* Search and Filter */}
      <div className='mb-8 space-y-4'>
        {/* Search Bar */}
        <div className='max-w-md mx-auto'>
          <div className='relative'>
            <input
              type='text'
              placeholder='Search doctors by name or speciality...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent'
            />
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <svg className='h-5 w-5 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
              </svg>
            </div>
          </div>
        </div>

        {/* Speciality Filter */}
        <div className='flex flex-wrap justify-center gap-3'>
          <button
            onClick={() => {
              setSelectedSpeciality('All')
              navigate('/doctors')
            }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedSpeciality === 'All'
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Specialities
          </button>
          {specialityData.map((spec, index) => (
            <button
              key={index}
              onClick={() => handleSpecialityClick(spec.speciality)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedSpeciality === spec.speciality
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {spec.speciality}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className='mb-6'>
        <p className='text-gray-600'>
          {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
          {selectedSpeciality !== 'All' && ` in ${selectedSpeciality}`}
        </p>
      </div>

      {/* Doctors Grid */}
      {filteredDoctors.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
          {filteredDoctors.map((doctor) => (
            <div key={doctor._id} className='bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100'>
              <div className='flex items-center gap-4 mb-4'>
                <img src={doctor.image} alt={doctor.name} className='w-20 h-20 rounded-full object-cover' />
                <div className='flex-1'>
                  <h3 className='font-semibold text-gray-800 text-lg'>{doctor.name}</h3>
                  {isUnavailableNow(doctor.unavailability) ? (
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-red-500'>
                      <span className='w-1.5 h-1.5 bg-red-500 rounded-full'></span>
                      Unavailable
                    </span>
                  ) : (
                    <span className='inline-flex items-center gap-1.5 text-xs font-medium text-green-600'>
                      <span className='w-1.5 h-1.5 bg-green-500 rounded-full'></span>
                      Available
                    </span>
                  )}
                  <p className='text-sm text-gray-600'>{doctor.speciality}</p>
                  <p className='text-sm text-gray-500'>{doctor.degree} • {doctor.experience}</p>
                  <div className='flex items-center gap-1 mt-1'>
                    <img src={assets.verified_icon} alt="Verified" className='w-4 h-4' />
                    <span className='text-xs text-green-600 font-medium'>Verified</span>
                  </div>
                </div>
              </div>
              
              <p className='text-sm text-gray-600 mb-4 line-clamp-3'>{doctor.about}</p>
              
              <div className='mb-4'>
                <p className='text-xs text-gray-500 mb-1'>Location</p>
                <p className='text-sm text-gray-700'>{doctor.address.line1}</p>
                <p className='text-sm text-gray-700'>{doctor.address.line2}</p>
              </div>
              
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-500'>Consultation Fee</p>
                  <p className='font-semibold text-primary text-lg'>${doctor.fees}</p>
                </div>
                <button 
                  onClick={() => navigate(`/appointment/${doctor._id}`)}
                  className='bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors'
                >
                  Book Appointment
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className='text-center py-12'>
          <div className='text-gray-400 mb-4'>
            <svg className='mx-auto h-12 w-12' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709' />
            </svg>
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>No doctors found</h3>
          <p className='text-gray-600 mb-4'>
            Try adjusting your search criteria or browse all specialities
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedSpeciality('All')
              navigate('/doctors')
            }}
            className='bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors'
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  )
}

export default Doctors