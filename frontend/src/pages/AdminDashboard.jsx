import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AdminSidebar from '../components/AdminSidebar';
import api from '../utils/axios';
import { assets, doctors as seedDoctors } from '../assets/assets';

const StatCard = ({ icon, label, value, bgColor = "bg-blue-50" }) => (
  <div className={`${bgColor} p-4 rounded-xl`}>
    <div className="flex items-center gap-3">
      <div className="w-8 h-8">{icon}</div>
      <div>
        <h3 className="text-xl font-semibold">{value}</h3>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </div>
  </div>
);

// Format an ISO date as e.g. "24th July, 2024"
const formatBookingDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return '—';
  const day = d.getDate();
  const suffix = (n) => {
    if (n >= 11 && n <= 13) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  const month = d.toLocaleString('en-US', { month: 'long' });
  return `${day}${suffix(day)} ${month}, ${d.getFullYear()}`;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    doctors: 0,
    appointments: 0,
    patients: 0,
  });
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const [statsRes, latestRes, doctorsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/latest-appointments'),
        api.get('/doctors'),
      ]);
      // The Doctors List page shows admin-added (backend) + seed doctors,
      // de-duped by name + speciality. Count the same way so the dashboard
      // stat matches what the admin actually sees there.
      const adminDoctors = doctorsRes.data || [];
      const seen = new Set(
        adminDoctors.map((d) => `${d.name}|${d.speciality}`.toLowerCase())
      );
      const seedOnly = seedDoctors.filter(
        (d) => !seen.has(`${d.name}|${d.speciality}`.toLowerCase())
      );
      const doctorCount = adminDoctors.length + seedOnly.length;

      setStats({
        doctors: doctorCount,
        appointments: statsRes.data.totalAppointments ?? 0,
        patients: statsRes.data.totalPatients ?? 0,
      });
      setLatest(latestRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCancel = async (id) => {
    try {
      await api.delete(`/appointments/${id}`);
      setLatest((prev) => prev.filter((a) => a.id !== id));
      setStats((prev) => ({ ...prev, appointments: Math.max(0, prev.appointments - 1) }));
      toast.success('Appointment cancelled');
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
      toast.error('Failed to cancel appointment');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 ml-0 lg:ml-64">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={<img src={assets.doctor_icon} alt="Doctors" className="w-full h-full object-contain" />}
              label="Doctors"
              value={loading ? '—' : stats.doctors}
              bgColor="bg-blue-50"
            />
            <StatCard
              icon={<svg viewBox="0 0 24 24" className="w-full h-full text-purple-600" fill="currentColor"><path d="M19 4h-2V3a1 1 0 0 0-2 0v1H9V3a1 1 0 0 0-2 0v1H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM5 6h2v1a1 1 0 0 0 2 0V6h6v1a1 1 0 0 0 2 0V6h2v3H5V6zm0 14v-9h14v9H5z"/></svg>}
              label="Appointments"
              value={loading ? '—' : stats.appointments}
              bgColor="bg-purple-50"
            />
            <StatCard
              icon={<svg viewBox="0 0 24 24" className="w-full h-full text-green-600" fill="currentColor"><path d="M12 12a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-10a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm8.1 13.1A10 10 0 0 0 12 12a10 10 0 0 0-8.1 3.1A9.8 9.8 0 0 0 2 21a1 1 0 1 0 2 0 8 8 0 0 1 16 0 1 1 0 0 0 2 0 9.8 9.8 0 0 0-1.9-5.9z"/></svg>}
              label="Patients"
              value={loading ? '—' : stats.patients}
              bgColor="bg-green-50"
            />
          </div>
        </div>

        {/* Latest Appointment */}
        <div className="bg-white border border-gray-200 rounded-xl max-w-2xl">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-200">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <h2 className="font-semibold text-gray-800">Latest Appointment</h2>
          </div>

          {loading ? (
            <p className="px-6 py-8 text-sm text-gray-500">Loading appointments…</p>
          ) : latest.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500">No appointments yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {latest.map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 px-6 py-3">
                  <img
                    src={apt.doctorImage || assets.upload_area}
                    alt={apt.doctorName}
                    className="w-10 h-10 rounded-full object-cover bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{apt.doctorName}</p>
                    <p className="text-sm text-gray-500">
                      Booking on {formatBookingDate(apt.dateTime)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancel(apt.id)}
                    title="Cancel appointment"
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
