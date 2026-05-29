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
                ? <div className='hidden md:flex item-center gap-2 cursor-pointer group relative'>
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

            {/* Hamburger - mobile only */}
            <img
                onClick={()=>setShowMenu(true)}
                className='w-6 cursor-pointer md:hidden'
                src={assets.menu_icon}
                alt='Open menu'
            />
        </div>

        {/* ---- Mobile slide-in menu ---- */}
        {/* Backdrop */}
        <div
            onClick={()=>setShowMenu(false)}
            className={`fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity duration-300 ${showMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />
        {/* Panel */}
        <div
            className={`fixed top-0 right-0 z-50 h-full w-72 max-w-[80%] bg-white shadow-xl md:hidden transition-transform duration-300 ${showMenu ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className='flex items-center justify-between px-5 py-4 border-b border-gray-200'>
                <img className='h-9' src={assets.logo} alt='TeleMed Logo' />
                <img onClick={()=>setShowMenu(false)} className='w-5 cursor-pointer' src={assets.cross_icon} alt='Close menu' />
            </div>

            <ul className='flex flex-col gap-1 px-4 py-4 text-base font-medium text-gray-700'>
                <NavLink onClick={()=>setShowMenu(false)} to='/' className={({isActive})=>`px-3 py-2.5 rounded-md ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}>HOME</NavLink>
                <NavLink onClick={()=>setShowMenu(false)} to='/doctors' className={({isActive})=>`px-3 py-2.5 rounded-md ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}>ALL DOCTORS</NavLink>
                <NavLink onClick={()=>setShowMenu(false)} to='/about' className={({isActive})=>`px-3 py-2.5 rounded-md ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}>ABOUT</NavLink>
                <NavLink onClick={()=>setShowMenu(false)} to='/contact' className={({isActive})=>`px-3 py-2.5 rounded-md ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50'}`}>CONTACT</NavLink>
            </ul>

            <div className='px-4 mt-2 border-t border-gray-200 pt-4'>
                {isAuthenticated ? (
                    <div className='flex flex-col gap-1 text-base font-medium text-gray-700'>
                        <p onClick={()=>{ setShowMenu(false); navigate('/my-profile') }} className='px-3 py-2.5 rounded-md hover:bg-gray-50 cursor-pointer'>My Profile</p>
                        <p onClick={()=>{ setShowMenu(false); navigate('/my-appointments') }} className='px-3 py-2.5 rounded-md hover:bg-gray-50 cursor-pointer'>My Appointments</p>
                        <p onClick={()=>{ setShowMenu(false); handleLogout() }} className='px-3 py-2.5 rounded-md text-red-500 hover:bg-red-50 cursor-pointer'>Logout</p>
                    </div>
                ) : (
                    <button
                        onClick={()=>{ setShowMenu(false); navigate('/login') }}
                        className='w-full bg-primary text-white py-3 rounded-full font-light'
                    >
                        Create account
                    </button>
                )}
            </div>
        </div>
    </div>
  )
}

export default NavBar