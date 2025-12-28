import type { MetaFunction } from "react-router";
import Navbar from "../components/Navbar";
import { useAuth, ProtectedRoute } from "../contexts/AuthContext";
import { useProfile } from "../contexts/ProfileContext";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const meta: MetaFunction = () => {
  return [
    { title: "User Profile - Eye Exam" },
    { name: "description", content: "Manage your user profile and account settings" },
  ];
};

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profileData, updateProfileData, refreshProfile, isLoading } = useProfile();
  const [activeTab, setActiveTab] = useState('info');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [profileImage, setProfileImage] = useState('');
  
  // Password form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Sync form with profile context data
  useEffect(() => {
    if (profileData) {
      setFullName(profileData.full_name || '');
      setEmail(profileData.email || '');
      setPhone(profileData.phone || '');
      setGender(profileData.gender || '');
      setProfileImage(profileData.avatar_url || '/images/userunknown.png');
      
      // Parse birth date
      if (profileData.date_of_birth) {
        const date = new Date(profileData.date_of_birth);
        setBirthDay(date.getDate().toString());
        setBirthMonth((date.getMonth() + 1).toString());
        setBirthYear(date.getFullYear().toString());
      }
    }
  }, [profileData]);
  
  // Update profile function
  const updateProfile = async () => {
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }
    
    console.log('=== UPDATE PROFILE START ===');
    console.log('Form state:', { fullName, phone, gender, birthDay, birthMonth, birthYear });
    
    if (!fullName || !fullName.trim()) {
      alert('Nama lengkap tidak boleh kosong');
      return;
    }
    
    try {
      const birthDate = birthDay && birthMonth && birthYear 
        ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
        : null;
      
      console.log('Updating profile with:', {
        user_id: user.id,
        full_name: fullName,
        phone: phone,
        gender: gender,
        date_of_birth: birthDate,
        avatar_url: profileImage !== '/images/userunknown.png' ? profileImage : null
      });
      
      console.log('BEFORE UPDATE - Current fullName state:', fullName);
      console.log('BEFORE UPDATE - User ID:', user.id);
      
      // Use direct UPDATE query instead of RPC
      const updateData: any = {
        full_name: fullName.trim() // Always update full_name
      };
      if (phone) updateData.phone = phone;
      if (gender) updateData.gender = gender;
      if (birthDate) updateData.date_of_birth = birthDate;
      if (profileImage && profileImage !== '/images/userunknown.png') {
        updateData.avatar_url = profileImage;
      }
      
      console.log('SENDING UPDATE with data:', updateData);
      console.log('UPDATE WHERE id =', user.id);
      
      const { error, data } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
      
      console.log('UPDATE RESPONSE - Error:', error);
      console.log('UPDATE RESPONSE - Data:', data);
      
      if (error) {
        console.error('Update Error Details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Error updating profile: ${error.message}`);
        return;
      }
      
      if (!data) {
        console.error('No data returned from update');
        alert('Update failed - no data returned');
        return;
      }
      
      console.log('UPDATE SUCCESSFUL - New data:', data);
      
      // Force update the profile context with new data
      updateProfileData(data);
      
      // Also refresh from database
      await refreshProfile();
      
      console.log('Profile refreshed, new data should be:', data);
      
      alert('Profile berhasil diupdate!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      setProfileImage(data.publicUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
      // Fallback to local preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProfileImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Change password function
  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Semua field password harus diisi');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      alert('Password baru dan konfirmasi password tidak cocok');
      return;
    }
    
    if (newPassword.length < 8) {
      alert('Password baru harus minimal 8 karakter');
      return;
    }
    
    try {
      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      // Update the updated_at field in user table
      if (user?.id) {
        await supabase
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }
      
      // Refresh profile to get updated timestamp
      await refreshProfile();
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      alert('Password berhasil diubah!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Gagal mengubah password');
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      // User akan di-redirect otomatis oleh AuthContext
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Extract user data dari Supabase user object with proper priority
  const userData = {
    name: (!isLoading && profileData?.full_name) 
      ? profileData.full_name 
      : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'),
    email: profileData?.email || user?.email || '',
    phone: profileData?.phone || '-',
    gender: profileData?.gender || '',
    birth_date: profileData?.date_of_birth,
    created_at: user?.created_at,
    updated_at: profileData?.updated_at,
    email_confirmed: user?.email_confirmed_at !== null
  };
  
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation */}
        <Navbar />

        {/* Profile Section with full height */}
        <section className="relative bg-gradient-to-br from-blue-100 via-blue-50 to-slate-100 overflow-hidden min-h-screen pt-32">
          <div className="fixed inset-0 pt-32" style={{backgroundColor: '#2C3E50'}}>
            <div className="flex h-full">
              {/* Sidebar - Fixed */}
              <div className="w-64 p-6 text-white flex flex-col h-full shadow-lg" style={{backgroundColor: '#2C3E50'}}>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-6 text-center">Profil Akun</h2>
                  
                  <nav className="space-y-2">
                    <button 
                      onClick={() => setActiveTab('info')}
                      className={`block w-full text-left transition-all duration-200 border-l-4 pl-4 py-3 rounded-r-lg group ${
                        activeTab === 'info' 
                          ? 'border-blue-400 text-blue-300 bg-blue-500/10' 
                          : 'border-transparent text-white hover:border-blue-300 hover:text-blue-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">Info Akun</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => setActiveTab('Pengaturan')}
                      className={`block w-full text-left transition-all duration-200 border-l-4 pl-4 py-3 rounded-r-lg group ${
                        activeTab === 'Pengaturan' 
                          ? 'border-blue-400 text-blue-300 bg-blue-500/10' 
                          : 'border-transparent text-white hover:border-blue-300 hover:text-blue-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Pengaturan Akun</span>
                      </div>
                    </button>
                  </nav>
                </div>
                
                {/* Logout Button */}
                <div className="mt-6 pt-6 border-t border-gray-600">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-3 transition-all py-2 px-4 rounded-lg group"
                    style={{
                      transition: 'all 0.2s ease',
                      color: '#ef4444',
                      border: '0.5px solid #ef4444',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      const button = e.currentTarget as HTMLElement;
                      const span = button.querySelector('span') as HTMLElement;
                      const img = button.querySelector('img') as HTMLElement;
                      button.style.color = '#F7FAFC';
                      button.style.backgroundColor = '#ef4444';
                      button.style.border = '0.5px solid #ef4444';
                      if (span) span.style.color = '#F7FAFC';
                      if (img) {
                        img.style.filter = 'brightness(0) invert(1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      const button = e.currentTarget as HTMLElement;
                      const span = button.querySelector('span') as HTMLElement;
                      const img = button.querySelector('img') as HTMLElement;
                      button.style.color = '#ef4444';
                      button.style.backgroundColor = 'transparent';
                      button.style.border = '0.5px solid #ef4444';
                      if (span) span.style.color = '#ef4444';
                      if (img) {
                        img.style.filter = 'none';
                      }
                    }}
                  >
                    <img 
                      src="/images/logout.png" 
                      alt="Logout" 
                      className="w-5 h-5"
                      style={{
                        transition: 'filter 0.2s ease'
                      }}
                    />
                    <span className="font-medium">Log out</span>
                  </button>
                </div>
              </div>

              {/* Main Content - Scrollable */}
              <div className="flex-1 bg-gray-100 p-8 rounded-tl-3xl overflow-y-auto h-full">
                <div className="max-w-4xl mx-auto pb-0">
                  {/* Tab Content */}
                  {activeTab === 'info' && (
                    <div className="bg-white rounded-xl shadow-lg p-20 mt-0">
                      <h2 className="text-2xl font-semibold text-gray-800 mb-8 text-center">Informasi Akun</h2>
                      
                      {/* Profile Image */}
                      <div className="text-center mb-8">
                        <img
                          src={profileImage || '/images/userunknown.png'}
                          alt="Profile"
                          className="w-50 h-50 rounded-full mx-auto mb-20 border-4 border-gray-200 shadow-lg object-cover"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-60">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 pl-10">
                              Nama Lengkap
                            </label>
                            <p className="text-lg text-gray-900 pl-10">{userData.name}</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 pl-10">
                              Akun Terdaftar
                            </label>
                            <p className="text-lg text-gray-900 pl-10">
                              {userData.created_at ? new Date(userData.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              }) : '-'}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 pl-10">
                              Update Terakhir
                            </label>
                            <p className="text-lg text-gray-900 pl-10">
                              {userData.updated_at ? new Date(userData.updated_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long', 
                                year: 'numeric'
                              }) : '-'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 pl-10">
                              Status Email
                            </label>
                            <p className={`text-lg font-medium pl-10 ${userData.email_confirmed ? 'text-green-600' : 'text-yellow-600'}`}>
                              {userData.email_confirmed ? 'Terverifikasi' : 'Belum Terverifikasi'}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Alamat Email
                            </label>
                            <p className="text-lg text-gray-900">{userData.email}</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nomor Telepon
                            </label>
                            <p className="text-lg text-gray-900">
                              {userData.phone}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Tanggal Lahir
                            </label>
                            <p className="text-lg text-gray-900">
                              {userData.birth_date ? new Date(userData.birth_date).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long', 
                                year: 'numeric'
                              }) : '-'}
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Gender
                            </label>
                            <p className="text-lg text-gray-900">
                              {userData.gender === 'male' ? 'Laki-laki' : userData.gender === 'female' ? 'Perempuan' : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'Pengaturan' && (
                    <div className="space-y-8">
                      {/* Profile Information Form */}
                      <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Informasi Profil</h2>
                        
                        <div className="space-y-6">
                          {/* Profile Picture */}
                          <div className="text-center">
                            <label className="block text-sm font-medium text-black mb-4">
                              Gambar Profil
                            </label>
                            <div className="inline-block">
                              <div className="mb-4">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id="profile-upload"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFileUpload(file);
                                    }
                                  }}
                                />
                                <img
                                  src={profileImage || '/images/userunknown.png'}
                                  alt="Profile Preview"
                                  className="w-50 h-50 rounded-full object-cover border-4 border-gray-200 mx-auto"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="profile-upload"
                                  className="cursor-pointer inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  Upload Foto Baru
                                </label>
                                <p className="text-xs text-gray-500 mt-3 text-center">JPG, PNG atau GIF (max. 800x400px)</p>
                              </div>
                            </div>
                          </div>

                          {/* Full Name */}
                          <div>
                            <label className="block text-sm font-medium text-black mb-2">
                              Nama Lengkap
                            </label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                              placeholder="Enter your full name"
                            />
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-sm font-medium text-black mb-2">
                              Alamat Email
                            </label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                              placeholder="Enter your email address"
                              disabled
                            />
                          </div>

                          {/* Phone Number */}
                          <div>
                            <label className="block text-sm font-medium text-black mb-2">
                              Nomor Telepon
                            </label>
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                setPhone(value);
                              }}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                              placeholder="Masukkan nomor telepon"
                              pattern="[0-9]*"
                              inputMode="numeric"
                            />
                          </div>

                          {/* Birth Date */}
                          <div>
                            <label className="block text-sm font-medium text-black mb-2">
                              Tanggal Lahir
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                              {/* Day */}
                              <select 
                                value={birthDay}
                                onChange={(e) => setBirthDay(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black appearance-none bg-white cursor-pointer"
                              >
                                <option value="" className="text-black">Tanggal</option>
                                {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                                  <option key={day} value={day.toString()} className="text-black">{day}</option>
                                ))}
                              </select>
                              
                              {/* Month */}
                              <select 
                                value={birthMonth}
                                onChange={(e) => setBirthMonth(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black appearance-none bg-white cursor-pointer"
                              >
                                <option value="" className="text-black">Bulan</option>
                                <option value="1" className="text-black">Januari</option>
                                <option value="2" className="text-black">Februari</option>
                                <option value="3" className="text-black">Maret</option>
                                <option value="4" className="text-black">April</option>
                                <option value="5" className="text-black">Mei</option>
                                <option value="6" className="text-black">Juni</option>
                                <option value="7" className="text-black">Juli</option>
                                <option value="8" className="text-black">Agustus</option>
                                <option value="9" className="text-black">September</option>
                                <option value="10" className="text-black">Oktober</option>
                                <option value="11" className="text-black">November</option>
                                <option value="12" className="text-black">Desember</option>
                              </select>
                              
                              {/* Year */}
                              <select 
                                value={birthYear}
                                onChange={(e) => setBirthYear(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black appearance-none bg-white cursor-pointer"
                              >
                                <option value="" className="text-black">Tahun</option>
                                {Array.from({length: 100}, (_, i) => new Date().getFullYear() - i).map(year => (
                                  <option key={year} value={year.toString()} className="text-black">{year}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Gender */}
                          <div className="relative">
                            <label className="block text-sm font-medium text-black mb-2">
                              Gender
                            </label>
                            <select 
                              value={gender}
                              onChange={(e) => setGender(e.target.value)}
                              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black appearance-none bg-white cursor-pointer"
                            >
                              <option value="" className="text-gray-400">Pilih Gender</option>
                              <option value="male" className="text-black">Laki-laki</option>
                              <option value="female" className="text-black">Perempuan</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none" style={{ top: '28px' }}>
                              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Update Profile Button */}
                        <div className="mt-8">
                          <button 
                            onClick={updateProfile}
                            className="w-full px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
                          >
                            Perbarui Informasi Profil
                          </button>
                        </div>
                      </div>

                      {/* Change Password Form */}
                      <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Ganti Password</h2>
                        
                        <div className="space-y-6">
                          {/* Current Password */}
                          <div>
                            <label className="block text-sm font-medium text-black mb-2">
                              Password Saat Ini
                            </label>
                            <div className="relative">
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-black"
                                placeholder="Masukkan Password Saat Ini"
                              />
                              <button 
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              >
                                {showCurrentPassword ? (
                                  <img 
                                    src="/images/eyeopenline.png" 
                                    alt="Hide Password" 
                                    className="w-5 h-5"
                                    style={{ filter: 'brightness(0)' }}
                                  />
                                ) : (
                                  <img 
                                    src="/images/eyecloseline.png" 
                                    alt="Show Password" 
                                    className="w-5 h-5"
                                    style={{ filter: 'brightness(0)' }}
                                  />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* New Password */}
                          <div>
                            <label className="block text-sm font-medium text-black mb-2">
                              Password Baru
                            </label>
                            <div className="relative">
                              <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-black"
                                placeholder="Masukkan Password Baru"
                              />
                              <button 
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              >
                                {showNewPassword ? (
                                  <img 
                                    src="/images/eyeopenline.png" 
                                    alt="Hide Password" 
                                    className="w-5 h-5"
                                    style={{ filter: 'brightness(0)' }}
                                  />
                                ) : (
                                  <img 
                                    src="/images/eyecloseline.png" 
                                    alt="Show Password" 
                                    className="w-5 h-5"
                                    style={{ filter: 'brightness(0)' }}
                                  />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Confirm New Password */}
                          <div>
                            <label className="block text-sm font-medium text-black mb-2">
                              Konfirmasi Password Baru
                            </label>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-black"
                                placeholder="konfirmasi password baru"
                              />
                              <button 
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                              >
                                {showConfirmPassword ? (
                                  <img 
                                    src="/images/eyeopenline.png" 
                                    alt="Hide Password" 
                                    className="w-5 h-5"
                                    style={{ filter: 'brightness(0)' }}
                                  />
                                ) : (
                                  <img 
                                    src="/images/eyecloseline.png" 
                                    alt="Show Password" 
                                    className="w-5 h-5"
                                    style={{ filter: 'brightness(0)' }}
                                  />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-xs text-black">
                            Password harus terdiri dari minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, dan karakter khusus.
                          </div>
                        </div>

                        {/* Change Password Button */}
                        <div className="mt-8">
                          <button 
                            onClick={changePassword}
                            className="w-full px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
                          >
                            Ubah Password
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ProtectedRoute>
  );
}