import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import AdminSidebar from '../components/AdminSidebar';
import api from '../utils/axios';
import { assets, doctors as seedDoctors } from '../assets/assets';
import { isUnavailableNow } from '../utils/availability';

// Normalise the static seed doctors (patients browse these) to the same
// shape the admin cards expect from the backend.
const normalizedSeedDoctors = seedDoctors.map((d) => ({
  id: d._id,
  name: d.name,
  speciality: d.speciality,
  image: d.image,
  source: 'seed',
}));

const DoctorsList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      const adminDoctors = res.data || [];
      // Show every doctor a patient can see: admin-added (backend) + seed list.
      // De-dupe by name + speciality so a backend copy hides its seed twin.
      const seen = new Set(
        adminDoctors.map((d) => `${d.name}|${d.speciality}`.toLowerCase())
      );
      const merged = [
        ...adminDoctors,
        ...normalizedSeedDoctors.filter(
          (d) => !seen.has(`${d.name}|${d.speciality}`.toLowerCase())
        ),
      ];
      setDoctors(merged);
    } catch (error) {
      console.error('Failed to load doctors:', error);
      toast.error('Failed to load doctors');
      // Backend unreachable — still show the doctors patients can browse.
      setDoctors(normalizedSeedDoctors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 ml-0 lg:ml-64">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">All Doctors</h1>

        {loading ? (
          <p className="text-sm text-gray-500">Loading doctors…</p>
        ) : doctors.length === 0 ? (
          <p className="text-sm text-gray-500">No doctors added yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="border border-indigo-100 rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow"
              >
                <div className="bg-indigo-50 flex items-center justify-center h-44">
                  <img
                    src={doc.image || assets.upload_area}
                    alt={doc.name}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="p-4">
                  <p className="font-semibold text-gray-800 truncate">{doc.name}</p>
                  {isUnavailableNow(doc.unavailability) ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      Unavailable
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Available
                    </span>
                  )}
                  <p className="text-sm text-gray-500 truncate">{doc.speciality}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorsList;
