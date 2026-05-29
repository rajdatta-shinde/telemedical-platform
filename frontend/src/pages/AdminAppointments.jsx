import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AdminSidebar from '../components/AdminSidebar';
import api from '../utils/axios';
import { assets, doctors } from '../assets/assets';

// Resolve a doctor's avatar from the static doctors list by id
const doctorImageById = (id) => doctors.find((d) => d._id === id)?.image || '';

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d)) return '—';
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day} ${month}, ${time}`;
};

const AdminAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAppointments = async () => {
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data || []);
    } catch (error) {
      console.error('Failed to load appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const updateStatus = async (id, status) => {
    if (status === 'cancelled' && !window.confirm('Cancel this appointment?')) return;
    try {
      const res = await api.patch(`/appointments/${id}`, { status });
      const updated = res.data || {};
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated, status } : a)));
      if (updated.refundIssued) {
        toast.success('Appointment cancelled — patient will be refunded within 5–7 working days');
      } else {
        toast.success(`Appointment ${status}`);
      }
    } catch (error) {
      console.error('Failed to update appointment:', error);
      toast.error('Failed to update appointment');
    }
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 ml-0 lg:ml-64">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">All Appointments</h1>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Header row */}
          <div className="hidden sm:grid grid-cols-[0.4fr_2fr_1.3fr_0.6fr_1.8fr_1.8fr_0.7fr_1fr_1.4fr] gap-2 px-6 py-4 border-b border-gray-200 text-sm font-medium text-gray-600">
            <span>#</span>
            <span className="text-center">Patient</span>
            <span>Department</span>
            <span>Age</span>
            <span>Date &amp; Time</span>
            <span className="text-center">Doctor</span>
            <span>Fees</span>
            <span>Status</span>
            <span className="text-center">Action</span>
          </div>

          {loading ? (
            <p className="px-6 py-8 text-sm text-gray-500">Loading appointments…</p>
          ) : appointments.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500">No appointments found.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {appointments.map((apt, index) => (
                <div
                  key={apt.id}
                  className="grid grid-cols-2 sm:grid-cols-[0.4fr_2fr_1.3fr_0.6fr_1.8fr_1.8fr_0.7fr_1fr_1.4fr] gap-2 items-center px-6 py-4 text-sm text-gray-700"
                >
                  <span className="text-gray-500">{index + 1}</span>

                  <div className="flex items-center justify-center gap-2 min-w-0">
                    <img
                      src={apt.patientImage || assets.upload_area}
                      alt={apt.patientName}
                      className="w-8 h-8 rounded-full object-cover bg-gray-100"
                    />
                    <span className="truncate">{apt.patientName || '—'}</span>
                  </div>

                  <span className="truncate">{apt.department || '—'}</span>
                  <span>{apt.patientAge || '—'}</span>
                  <span>{formatDateTime(apt.dateTime)}</span>

                  <div className="flex items-center justify-center gap-2 min-w-0">
                    <img
                      src={apt.doctorImage || doctorImageById(apt.doctorId) || assets.upload_area}
                      alt={apt.doctorName}
                      className="w-8 h-8 rounded-full object-cover bg-gray-100"
                    />
                    <span className="truncate">{apt.doctorName || '—'}</span>
                  </div>

                  <span>${apt.fees ?? 0}</span>

                  <span>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${statusBadge(apt.status || 'upcoming')}`}>
                      {apt.status || 'upcoming'}
                    </span>
                  </span>

                  <div className="flex justify-center gap-1">
                    {(apt.status || 'upcoming') === 'upcoming' && (
                      <>
                        <button
                          onClick={() => updateStatus(apt.id, 'completed')}
                          title="Mark completed"
                          className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-500 hover:bg-blue-100 transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => updateStatus(apt.id, 'cancelled')}
                          title="Cancel appointment"
                          className="px-2 py-1 text-xs rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAppointments;
