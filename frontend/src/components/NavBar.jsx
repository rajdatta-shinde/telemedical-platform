import React from 'react'
import {assets} from '../assets/assets'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react';
import api from '../utils/axios'
import { useAuth } from '../context/AuthContext'

const NavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout } = useAuth();
    const [showMenu, setShowMenu] = useState(false);
    const [profileImage, setProfileImage] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        if (!isAuthenticated) {
            setProfileImage('')
            return
        }
        const loadProfileImage = async () => {
            const authToken = sessionStorage.getItem('token')
            if (!authToken) return
            try {
                const res = await api.get('/profile')
                if (res.data?.profileImage) setProfileImage(res.data.profileImage)
            } catch {
                // ignore: fall back to default avatar
            }
        }
        loadProfileImage()

        // Update the avatar live when the profile is saved
        const handleProfileUpdate = (e) => setProfileImage(e.detail?.profileImage || '')
        window.addEventListener('profile:updated', handleProfileUpdate)
        return () => window.removeEventListener('profile:updated', handleProfileUpdate)
    }, [isAuthenticated]);

    // Hide navbar on admin and doctor panel routes (but not the public /doctors page)
    if (location.pathname.startsWith('/admin') ||
        location.pathname === '/doctor' || location.pathname.startsWith('/doctor/')) {
        return null;
    }

  return (
    <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-b-gray-300'>
        {/* Logo - left */}
        <NavLink to='/' className='flex-1'>
            <img className='h-12 cursor-pointer' src={assets.logo} alt="TeleMed Logo"/>
        </NavLink>

        {/* Nav links - center */}
        <ul className='hidden md:flex items-center gap-8 font-medium'>
            <NavLink to='/'>
                {({ isActive }) => (<>
                    <li className='py-1'>HOME</li>
                    <hr className={`border-none outline-none h-0.5 bg-primary w-3/5 m-auto ${isActive ? '' : 'hidden'}`}/>
                </>)}
            </NavLink>
            <NavLink to='/doctors'>
                {({ isActive }) => (<>
                    <li className='py-1'>ALL DOCTORS</li>
                    <hr className={`border-none outline-none h-0.5 bg-primary w-3/5 m-auto ${isActive ? '' : 'hidden'}`}/>
                </>)}
            </NavLink>
            <NavLink to='/about'>
                {({ isActive }) => (<>
                    <li className='py-1'>ABOUT</li>
                    <hr className={`border-none outline-none h-0.5 bg-primary w-3/5 m-auto ${isActive ? '' : 'hidden'}`}/>
                </>)}
            </NavLink>
            <NavLink to='/contact'>
                {({ isActive }) => (<>
                    <li className='py-1'>CONTACT</li>
                    <hr className={`border-none outline-none h-0.5 bg-primary w-3/5 m-auto ${isActive ? '' : 'hidden'}`}/>
                </>)}
            </NavLink>
        </ul>

        {/* Right - profile / button */}
        <div className='flex-1 flex items-center justify-end gap-4'>
            {
                isAuthenticated
                ? <div className='flex item-center gap-2 cursor-pointer group relative'>
                    <img className='w-8 h-8 rounded-full object-cover' src={profileImage || assets.upload_area} alt="" />
                    <img className='w-2.5' src={assets.dropdown_icon} alt="" />
                    <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block' >
                        <div className='min-w-48 bg-stone-100 rounded flex-col gap-4 p-4'>
                            <p onClick={()=>navigate('/my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                            <p onClick={()=>navigate('/my-appointments')} className='hover:text-black cursor-pointer'>MY Appointments</p>
                            <p onClick={handleLogout} className='hover:text-black cursor-pointer'>Logout</p>
                        </div>
                    </div>

                </div>
                :<button onClick={()=>navigate('/login')} className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'>Create account</button>
            }
           
        </div>
    </div>
  )
}

export default NavBar