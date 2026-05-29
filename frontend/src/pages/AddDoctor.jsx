import React, { useState } from 'react';
import { toast } from 'react-toastify';
import AdminSidebar from '../components/AdminSidebar';
import api from '../utils/axios';
import { uploadImage } from '../utils/uploadImage';

const SPECIALITIES = [
  'General physician',
  'Gynecologist',
  'Dermatologist',
  'Pediatricians',
  'Neurologist',
  'Gastroenterologist',
];

const EXPERIENCE_OPTIONS = Array.from({ length: 10 }, (_, i) => `${i + 1} Year${i ? 's' : ''}`);

const emptyForm = {
  name: '',
  email: '',
  password: '',
  speciality: 'General physician',
  education: '',
  experience: '1 Year',
  address1: '',
  address2: '',
  fees: '',
  about: '',
};

// Generate a strong random password the admin can hand to the doctor.
const generatePassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;
  // guarantee at least one of each category
  const pick = (set) => set[Math.floor(Math.random() * set.length)];
  let chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  for (let i = chars.length; i < 12; i++) chars.push(pick(all));
  // shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
};

const AddDoctor = () => {
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState('');        // Cloudinary URL sent to backend
  const [preview, setPreview] = useState('');    // preview URL (local blob until upload finishes)
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState(null); // saved credentials shown after success

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    // Show the local file immediately so the admin sees feedback while the
    // upload runs in the background.
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setImage(url);
      setPreview(url);
      URL.revokeObjectURL(localPreview);
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error(error.response?.data?.message || 'Image upload failed');
      setImage('');
      setPreview('');
      URL.revokeObjectURL(localPreview);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleGeneratePassword = () => {
    const pwd = generatePassword();
    setForm((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
    toast.info('Password generated — share it with the doctor');
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    const text = `Telemedical Platform — Doctor Login\nEmail: ${credentials.email}\nPassword: ${credentials.password}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Credentials copied to clipboard');
    } catch {
      toast.error('Could not copy — please copy manually');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.speciality) {
      toast.error('Please fill in name, email, password and speciality');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (uploadingImage) {
      toast.info('Please wait for the image upload to finish');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/doctors', { ...form, fees: Number(form.fees) || 0, image });
      toast.success('Doctor added successfully');
      // keep the credentials visible so the admin can pass them on
      setCredentials({ email: form.email, password: form.password });
      setForm(emptyForm);
      setImage('');
      setPreview('');
      setShowPassword(false);
    } catch (error) {
      console.error('Failed to add doctor:', error);
      toast.error(error.response?.data?.error || 'Failed to add doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';
  const labelClass = 'block text-sm text-gray-600 mb-1';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 ml-0 lg:ml-64">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center sm:text-left">Add Doctor</h1>

        {/* Credentials of the most recently added doctor */}
        {credentials && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6 max-w-4xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-green-800 mb-2">
                  Doctor account created — share these login credentials
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Email:</span>{' '}
                  <span className="font-mono">{credentials.email}</span>
                </p>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">Password:</span>{' '}
                  <span className="font-mono">{credentials.password}</span>
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 transition-colors"
                >
                  Copy
                </button>
                <button
                  type="button"
                  onClick={() => setCredentials(null)}
                  className="text-gray-500 px-4 py-1.5 rounded text-sm hover:bg-gray-100 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-8 max-w-4xl">
          {/* Upload picture */}
          <div className="flex items-center gap-4 mb-8">
            <label htmlFor="doc-img" className="cursor-pointer">
              {preview ? (
                <img src={preview} alt="Doctor" className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-9 h-9 text-gray-400" fill="currentColor">
                    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0-8a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm9 17v-2a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v2h2v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2h2z"/>
                  </svg>
                </div>
              )}
            </label>
            <input id="doc-img" type="file" accept="image/*" onChange={handleImage} className="hidden" />
            <p className="text-sm text-gray-500">
              {uploadingImage ? 'Uploading…' : (<>Upload doctor<br />picture</>)}
            </p>
          </div>

          {/* Login credentials section */}
          <div className="border border-gray-200 rounded-lg p-5 mb-8 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Login Credentials</h2>
            <p className="text-xs text-gray-500 mb-4">
              The doctor uses this email and password to sign in to their dashboard.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
              <div>
                <label className={labelClass}>Login Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="doctor@example.com"
                  autoComplete="off"
                  className={inputClass}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-gray-600">Password</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-xs text-primary hover:underline"
                  >
                    Generate password
                  </button>
                </div>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Set a password"
                    autoComplete="new-password"
                    className={`${inputClass} pr-16`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">At least 6 characters.</p>
              </div>
            </div>
          </div>

          {/* Two-column fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            {/* Left column */}
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Doctor name</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Name" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Experience</label>
                <select name="experience" value={form.experience} onChange={handleChange} className={inputClass}>
                  {EXPERIENCE_OPTIONS.map((exp) => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fees</label>
                <input name="fees" type="number" min="0" value={form.fees} onChange={handleChange} placeholder="Your fees" className={inputClass} />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Speciality</label>
                <select name="speciality" value={form.speciality} onChange={handleChange} className={inputClass}>
                  {SPECIALITIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Education</label>
                <input name="education" value={form.education} onChange={handleChange} placeholder="Education" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input name="address1" value={form.address1} onChange={handleChange} placeholder="Address 1" className={`${inputClass} mb-3`} />
                <input name="address2" value={form.address2} onChange={handleChange} placeholder="Address 2" className={inputClass} />
              </div>
            </div>
          </div>

          {/* About me */}
          <div className="mt-5">
            <label className={labelClass}>About me</label>
            <textarea name="about" value={form.about} onChange={handleChange} rows={4} placeholder="write about yourself" className={inputClass} />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 bg-primary text-white px-8 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Adding…' : 'Add doctor'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddDoctor;
