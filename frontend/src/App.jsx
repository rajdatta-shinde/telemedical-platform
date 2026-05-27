import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import MyAppointments from './pages/MyAppointments'
import Appointment from './pages/Appointment'
import NavBar from './components/NavBar'
import { useAuth } from './context/AuthContext'
import AdminDashboard from './pages/AdminDashboard'
import AdminAppointments from './pages/AdminAppointments'
import AddDoctor from './pages/AddDoctor'
import RemoveDoctor from './pages/RemoveDoctor'
import DoctorsList from './pages/DoctorsList'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorAppointments from './pages/DoctorAppointments'
import DoctorSchedule from './pages/DoctorSchedule'
import DoctorProfile from './pages/DoctorProfile'
import ResetPassword from './pages/ResetPassword'

const RequireAuth = ({ children, allowedRoles }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

const App = () => {
  return (
    <div className='mx-4 sm:mx-[10%]'>
      <NavBar />
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/doctors' element={<Doctors/>} />
        <Route path='/doctors/:speciality' element={<Doctors/>} />
        <Route path='/login' element={<Login/>} />
        <Route path='/about' element={<About/>} />
        <Route path='/contact' element={<Contact/>} />
        <Route path='/my-profile' element={
          <RequireAuth allowedRoles={["patient","doctor","admin"]}>
            <MyProfile/>
          </RequireAuth>
        } />
        <Route path='/my-appointments' element={
          <RequireAuth allowedRoles={["patient","doctor","admin"]}>
            <MyAppointments/>
          </RequireAuth>
        } />
        <Route path='/appointment/:docId' element={<Appointment/>} />
        <Route path='/reset-password/:token' element={<ResetPassword/>} />
        {/* Role specific routes */}
        <Route path='/admin' element={
          <RequireAuth allowedRoles={["admin"]}>
            <AdminDashboard />
          </RequireAuth>
        } />
        <Route path='/admin/appointments' element={
          <RequireAuth allowedRoles={["admin"]}>
            <AdminAppointments />
          </RequireAuth>
        } />
        <Route path='/admin/add-doctor' element={
          <RequireAuth allowedRoles={["admin"]}>
            <AddDoctor />
          </RequireAuth>
        } />
        <Route path='/admin/remove-doctor' element={
          <RequireAuth allowedRoles={["admin"]}>
            <RemoveDoctor />
          </RequireAuth>
        } />
        <Route path='/admin/doctors' element={
          <RequireAuth allowedRoles={["admin"]}>
            <DoctorsList />
          </RequireAuth>
        } />
        <Route path='/doctor' element={
          <RequireAuth allowedRoles={["doctor"]}>
            <DoctorDashboard />
          </RequireAuth>
        } />
        <Route path='/doctor/appointments' element={
          <RequireAuth allowedRoles={["doctor"]}>
            <DoctorAppointments />
          </RequireAuth>
        } />
        <Route path='/doctor/schedule' element={
          <RequireAuth allowedRoles={["doctor"]}>
            <DoctorSchedule />
          </RequireAuth>
        } />
        <Route path='/doctor/profile' element={
          <RequireAuth allowedRoles={["doctor"]}>
            <DoctorProfile />
          </RequireAuth>
        } />
      </Routes>
      
      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  )
}

export default App