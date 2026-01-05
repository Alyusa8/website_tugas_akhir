import type { MetaFunction } from "react-router";
import { NavLink, useParams } from "react-router";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Screenshot {
  id: string;
  session_id: string;
  image_url: string;
  direction: string;
  captured_at: string;
}

interface SessionDetail {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  preview_image: string | null;
  status: string;
  screenshots: Screenshot[];
}

export const meta: MetaFunction = () => {
  return [
    { title: "Detail Record - Eye Exam" },
    { name: "description", content: "Detail rekaman deteksi YOLO" },
  ];
};

export default function HistoryDetail() {
  const { id } = useParams();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDirection, setFilterDirection] = useState<string | null>(null);

  useEffect(() => {
    loadSessionDetail();
  }, [id]);

  const loadSessionDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Sesi tidak valid. Silakan login kembali.');
        return;
      }

      const response = await fetch(`${API_URL}/api/detection/history/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Gagal memuat detail sesi');
      }

      const data = await response.json();
      setSession(data.session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = (start: string, end: string | null) => {
    if (!end) return 'Sedang berlangsung';
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = Math.floor((endDate.getTime() - startDate.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDownload = async (imageUrl: string, direction: string, capturedAt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${direction}_${new Date(capturedAt).getTime()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Gagal mengunduh gambar:', err);
      alert('Gagal mengunduh gambar');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi ini?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/detection/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Gagal menghapus sesi');

      alert('Sesi berhasil dihapus');
      window.location.href = '/history';
    } catch (err) {
      console.error('Error:', err);
      alert('Gagal menghapus sesi');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="pt-32 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#28A745]"></div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="pt-32 max-w-4xl mx-auto px-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error || 'Sesi tidak ditemukan'}</p>
          </div>
          <div className="text-center mt-6">
            <NavLink to="/history" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              ← Kembali ke History
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navbar />

      {/* Content */}
      <div className="pt-32 min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{color: '#374151'}}>
              Session {formatDate(session.started_at)}
            </h1>
            <p className="text-gray-600">
              Durasi: {getDuration(session.started_at, session.ended_at)} • {session.screenshots.length} screenshots
            </p>
          </div>

          {/* Screenshots Header with Filters */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setFilterDirection(filterDirection === 'left' ? null : 'left')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterDirection === 'left'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              ← Kiri
            </button>
            <h2 className="text-2xl font-semibold" style={{color: '#374151'}}>
              Screenshots
            </h2>
            <button
              onClick={() => setFilterDirection(filterDirection === 'right' ? null : 'right')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterDirection === 'right'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Kanan →
            </button>
          </div>

          {/* Screenshots Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {session.screenshots.filter(screenshot => 
              filterDirection ? screenshot.direction.toLowerCase() === filterDirection.toLowerCase() : true
            ).map((screenshot) => (
              <div key={screenshot.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative aspect-video bg-slate-200">
                  <img
                    src={screenshot.image_url}
                    alt={`Screenshot ${screenshot.direction}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/placeholder.jpg';
                    }}
                  />
                  <div className="absolute top-2 right-2 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
                    {screenshot.direction}
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    {formatDate(screenshot.captured_at)}
                  </p>
                  <button
                    onClick={() => handleDownload(screenshot.image_url, screenshot.direction, screenshot.captured_at)}
                    className="w-full px-4 py-2 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    style={{backgroundColor: '#28A745'}}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#218838'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#28A745'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* No screenshots message */}
          {session.screenshots.filter(screenshot => 
            filterDirection ? screenshot.direction.toLowerCase() === filterDirection.toLowerCase() : true
          ).length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {filterDirection ? `Tidak ada screenshot dari arah ${filterDirection === 'left' ? 'kiri' : 'kanan'}` : 'Tidak ada screenshot'}
              </p>
            </div>
          )}

          {/* Session Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{color: '#374151'}}>
              Aksi Sesi
            </h2>
            <div className="flex gap-4">
              <button
                onClick={handleDelete}
                className="px-6 py-3 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                style={{backgroundColor: '#DC3545'}}
                onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#C82333'}
                onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#DC3545'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Hapus Sesi
              </button>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <NavLink to="/history" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Kembali ke History
            </NavLink>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}