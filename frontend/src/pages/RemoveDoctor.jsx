import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import AdminSidebar from '../components/AdminSidebar';
import api from '../utils/axios';
import { assets } from '../assets/assets';

const RemoveDoctor = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pendingId, setPendingId] = useState(null);

  const loadDoctors = async () => {
    try {
      // admin/all returns BOTH active and deactivated doctors so the admin
      // can see who's currently hidden from the frontend and reactivate them.
      const res = await api.get('/doctors/admin/all');
      setDoctors(res.data || []);
    } catch (error) {
      console.error('Failed to load doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const filteredDoctors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return doctors;
    return doctors.filter((d) => (d.name || '').toLowerCase().includes(q));
  }, [doctors, search]);

  const updateDoctorInState = (updated) => {
    setDoctors((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...updated } : d)));
  };

  const handleDeactivate = async (doctor) => {
    if (doctor.isActive === false) return;
    const confirmed = window.confirm(
      `Deactivate Dr. ${doctor.name}?\n\nThey will be hidden from the patient listing and booking pages. All existing appointments and data are kept in the database and can be restored by reactivating.`
    );
    if (!confirmed) return;
    setPendingId(doctor.id);
    try {
      const res = await api.patch(`/doctors/${doctor.id}/deactivate`);
      updateDoctorInState(res.data);
      toast.success(`${doctor.name} deactivated`);
    } catch (error) {
      console.error('Deactivate failed:', error);
      toast.error(error.response?.data?.error || 'Failed to deactivate doctor');
    } finally {
      setPendingId(null);
    }
  };

  const handleReactivate = async (doctor) => {
    if (doctor.isActive !== false) return;
    setPendingId(doctor.id);
    try {
      const res = await api.patch(`/doctors/${doctor.id}/reactivate`);
      updateDoctorInState(res.data);
      toast.success(`${doctor.name} reactivated`);
    } catch (error) {
      console.error('Reactivate failed:', error);
      toast.error(error.response?.data?.error || 'Failed to reactivate doctor');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 p-8 ml-64">
        <div className="max-w-6xl">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Remove Doctor</h1>
          <p className="text-sm text-gray-500 mb-6">
            Deactivate a doctor to hide them from the patient listing and booking pages.
            Their record and past appointments stay in the database and can be restored anytime.
          </p>

          {/* Search bar */}
          <div className="relative max-w-md mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctors by name…"
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading doctors…</p>
          ) : doctors.length === 0 ? (
            <p className="text-sm text-gray-500">
              No doctors found in the database. Add a doctor first from the Add Doctor page.
            </p>
          ) : filteredDoctors.length === 0 ? (
            <p className="text-sm text-gray-500">No doctors match "{search}".</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDoctors.map((doc) => {
                const inactive = doc.isActive === false;
                const isBusy = pendingId === doc.id;
                return (
                  <div
                    key={doc.id}
                    className={`border rounded-xl overflow-hidden bg-white flex flex-col transition-shadow hover:shadow-md ${
                      inactive ? 'border-red-200' : 'border-indigo-100'
                    }`}
                  >
                    <div className={`relative flex items-center justify-center h-44 ${inactive ? 'bg-red-50' : 'bg-indigo-50'}`}>
                      <img
                        src={doc.image || assets.upload_area}
                        alt={doc.name}
                        className={`h-full w-full object-contain ${inactive ? 'grayscale opacity-70' : ''}`}
                      />
                      <span
                        className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                          inactive
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-green-100 text-green-700 border border-green-200'
                        }`}
                      >
                        {inactive ? 'Deactivated' : 'Active'}
                      </span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <p className="font-semibold text-gray-800 truncate">{doc.name}</p>
                      <p className="text-sm text-gray-500 truncate">{doc.speciality}</p>
                      {doc.email && (
                        <p className="text-xs text-gray-400 truncate mt-1">{doc.email}</p>
                      )}

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleDeactivate(doc)}
                          disabled={inactive || isBusy}
                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isBusy && !inactive ? 'Working…' : 'Deactivate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReactivate(doc)}
                          disabled={!inactive || isBusy}
                          className="flex-1 px-3 py-2 text-sm rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isBusy && inactive ? 'Working…' : 'Reactivate'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemoveDoctor;
