import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { useDetectionCache } from "../contexts/DetectionCacheContext";
import { detectionHelpers, supabase } from "../lib/supabase";
import JSZip from "jszip";

interface SessionWithImages {
  id: string;
  session_id: string;
  started_at: string;
  ended_at: string;
  duration_seconds: number;
  total_screenshots: number;
  direction_summary: Record<string, number>;
  custom_name?: string;
  images?: Array<{
    id: string;
    image_url: string;
    direction: string;
    confidence: number;
    captured_at: string;
  }>;
}

export default function History() {
  const { user } = useAuth();
  const cache = useDetectionCache();
  const [sessions, setSessions] = useState<SessionWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<SessionWithImages | null>(null);
  const [selectedImage, setSelectedImage] = useState<{url: string; direction: string; captured_at: string} | null>(null);
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [notification, setNotification] = useState<{message: string; type: 'success' | 'error'} | null>(null);

  // Fetch all sessions - menggunakan cache
  useEffect(() => {
    if (!user) {
      console.log("⚠️ No user logged in");
      setLoading(false);
      return;
    }

    console.log(`📋 History component mounted. User: ${user.email}`);

    // Jika cache sudah ada, gunakan cache
    if (cache.historyCache !== null) {
      console.log("✅ Using cached history data");
      setSessions(cache.historyCache);
      setLoading(false);
      setError(cache.historyError);
      return;
    }

    const fetchSessions = async () => {
      try {
        cache.setHistoryLoading(true);
        cache.setHistoryError("");
        setLoading(true);
        setError("");
        console.log("🔄 Fetching detection history...");
        const data = await detectionHelpers.getUserDetectionHistory(user.id, 50);
        console.log(`✅ Loaded ${data?.length || 0} sessions with images`);
        
        let totalImages = 0;
        data?.forEach((session, index) => {
          const imgCount = session.images?.length || 0;
          totalImages += imgCount;
          console.log(`  📌 Session ${index + 1}: ${imgCount} images (DB says: ${session.total_screenshots})`);
        });
        
        console.log(`\n📊 SUMMARY: ${data?.length} sessions, ${totalImages} total images fetched`);
        
        // Simpan ke cache
        cache.setHistoryCache(data || []);
        setSessions(data || []);
      } catch (err: any) {
        console.error("❌ Failed to fetch sessions:", err);
        const errorMsg = err.message || "Failed to load history";
        cache.setHistoryError(errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
        cache.setHistoryLoading(false);
      }
    };

    fetchSessions();
  }, [user, cache]);

  // Fetch detailed session with images - menggunakan cache
  const viewSessionDetail = async (session: SessionWithImages) => {
    try {
      setError("");
      console.log("📂 Opening session detail view for:", session.session_id);
      
      // Cek cache terlebih dahulu
      const cachedDetail = cache.getSessionDetail(session.session_id);
      if (cachedDetail) {
        console.log("✅ Using cached session detail");
        setSelectedSession(cachedDetail);
        return;
      }
      
      const { session: sessionData, images } = await detectionHelpers.getDetectionSessionWithImages(
        session.session_id,
        user!.id
      );
      console.log(`✅ Session detail loaded with ${images?.length || 0} images`);
      const sessionWithImages = { ...sessionData, images };
      
      // Simpan ke cache
      cache.setSessionDetail(session.session_id, sessionWithImages);
      setSelectedSession(sessionWithImages);
    } catch (err: any) {
      console.error("❌ Failed to fetch session detail:", err);
      setError(err.message || "Failed to load session detail");
    }
  };

  // Format duration dengan satuan Indonesia
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    
    if (hours > 0) {
      return `${hours} jam ${minutes} menit ${secs} detik`;
    } else if (minutes > 0) {
      return `${minutes} menit ${secs} detik`;
    } else {
      return `${secs} detik`;
    }
  };

  // Group sessions by time period
  const groupSessionsByPeriod = (sessionsList: SessionWithImages[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const hari_ini: SessionWithImages[] = [];
    const tiga_hari: SessionWithImages[] = [];
    const satu_minggu: SessionWithImages[] = [];
    const satu_bulan: SessionWithImages[] = [];

    sessionsList.forEach((session) => {
      const sessionDate = new Date(session.started_at);
      const sessionDateOnly = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

      if (sessionDateOnly.getTime() >= today.getTime()) {
        hari_ini.push(session);
      } else if (sessionDateOnly.getTime() >= threeDaysAgo.getTime()) {
        tiga_hari.push(session);
      } else if (sessionDateOnly.getTime() >= weekAgo.getTime()) {
        satu_minggu.push(session);
      } else if (sessionDateOnly.getTime() >= monthAgo.getTime()) {
        satu_bulan.push(session);
      }
    });

    return { hari_ini, tiga_hari, satu_minggu, satu_bulan };
  };

  // Render session card
  const renderSessionCard = (session: SessionWithImages) => {
    const firstImage = session.images && session.images.length > 0 ? session.images[0] : null;
    const firstImageUrl = firstImage ? getImageUrl(firstImage.image_url) : "";

    console.log("🔍 Rendering session card:", {
      sessionId: session.id,
      hasImages: !!session.images,
      imageCount: session.images?.length || 0,
      firstImage: firstImage,
      firstImageUrl: firstImageUrl
    });

    return (
      <div
        key={session.id}
        className="bg-white rounded-lg shadow-lg px-6 pt-6 pb-0 hover:shadow-xl transition cursor-pointer"
        onClick={() => viewSessionDetail(session)}
      >
        {/* Top: Actions */}
        <div className="flex gap-0 mb-4 -mx-6 -mt-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setRenameSessionId(session.id);
              setRenameValue(session.custom_name || `Session ${new Date(session.started_at).toLocaleDateString("id-ID")}`);
            }}
            className="flex-1 px-2 py-4 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-semibold transition rounded-tl-lg flex items-center justify-center gap-2"
            title="Ganti Nama Sesi"
          >
            <img src="/images/edit.png" alt="Edit" className="w-4 h-4" style={{ filter: "brightness(0) saturate(100%) invert(48%) sepia(66%) saturate(550%) hue-rotate(168deg)" }} />
            Edit Nama
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              downloadSessionBatch(session);
            }}
            title="Download semua screenshot"
            className="flex-1 px-2 py-4 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <img src="/images/download.png" alt="Download" className="w-4 h-4" style={{ filter: "brightness(0) saturate(100%) invert(47%) sepia(58%) saturate(1000%) hue-rotate(88deg)" }} />
            Download
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Hapus sesi "${session.custom_name || session.session_id.substring(0, 8)}"?`)) {
                deleteSession(session);
              }
            }}
            title="Hapus sesi"
            className="flex-1 px-2 py-4 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold transition rounded-tr-lg flex items-center justify-center gap-2"
          >
            <img src="/images/trash.png" alt="Hapus" className="w-4 h-4" style={{ filter: "brightness(0) saturate(100%) invert(28%) sepia(74%) saturate(1215%) hue-rotate(354deg)" }} />
            Hapus
          </button>
        </div>

        {/* Middle: Image + Name + Stats in one flex row */}
        <div className="flex gap-4 mb-4 items-start">
          {/* Left: Preview Image */}
          <div className="flex-shrink-0 w-80 h-50 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center relative group">
            {firstImageUrl ? (
              <>
                <img
                  src={firstImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("❌ Image failed to load:", firstImageUrl);
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {/* Show URL on hover for debugging */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/80 text-white text-xs p-1 overflow-hidden break-words flex items-center transition duration-200">
                  <span className="text-center w-full">{firstImage?.image_url.substring(0, 15)}...</span>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-center">
                <div className="text-2xl">📷</div>
                <div className="text-xs">No image</div>
              </div>
            )}
          </div>

          {/* Center: Name + Button + Stats */}
          <div className="flex-1 flex flex-col justify-between w-full">
            <div className="flex justify-center w-full">
              <div className="flex items-center gap-2 pt-20">
                <p className="text-lg font-semibold text-gray-800 hover:text-blue-600">
                  {session.custom_name || `Session ${new Date(session.started_at).toLocaleDateString("id-ID")}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats: Screenshot, Durasi, Arah */}
        <div className="pt-3 mb-3">
          <div className="flex gap-10 items-center justify-between">
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-purple-600">{session.total_screenshots}</p>
              <p className="text-xs text-gray-600">Screenshot</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-blue-600">{formatDuration(session.duration_seconds || 0)}</p>
              <p className="text-xs text-gray-600">Durasi</p>
            </div>
            <div className="flex-1 flex gap-2 justify-center">
              <span className="inline-block px-8 py-4 bg-red-100 text-red-800 text-xs rounded font-semibold">
                KIRI: {session.direction_summary?.KIRI || 0}
              </span>
              <span className="inline-block px-5 py-4 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                KANAN: {session.direction_summary?.KANAN || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom: Tanggal + Session ID */}
        <div className="flex justify-between items-center pt-3 pb-3 -mx-6 px-6" style={{ borderTop: "1px solid #4DA1B2" }}>
          <p className="text-sm text-gray-600 break-all">Session ID: {session.session_id}</p>
          <p className="text-sm text-gray-800 text-right">
            {new Date(session.started_at).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} • {new Date(session.started_at).toLocaleTimeString("id-ID")}
          </p>
        </div>
      </div>
    );
  };

  // Get direction badge color
  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case "KIRI":
        return "bg-red-100 text-red-800";
      case "KANAN":
        return "bg-blue-100 text-blue-800";
      case "DEPAN":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get public image URL dari Supabase storage
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "";
    try {
      const { data } = supabase.storage
        .from("eye_exam_screenshots")
        .getPublicUrl(imagePath);
      const url = data?.publicUrl || "";
      console.log("📷 Image URL generated:", { url, imagePath });
      return url;
    } catch (error) {
      console.error("❌ Error generating image URL:", error, imagePath);
      return "";
    }
  };

  // Download single image
  const downloadSingleImage = async (image: any, session: SessionWithImages) => {
    try {
      const url = getImageUrl(image.image_url);
      if (!url) {
        setNotification({message: "Gagal mendapatkan URL gambar", type: "error"});
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      // Fetch image as blob and download
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${session.custom_name || session.session_id}_${image.direction}_${new Date(image.captured_at).getTime()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      console.log("✅ Image downloaded:", image.image_url);
      setNotification({message: "Gambar berhasil diunduh", type: "success"});
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("❌ Error downloading image:", error);
      setNotification({message: "Gagal download gambar", type: "error"});
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Download batch (all screenshots in session)
  const downloadSessionBatch = async (session: SessionWithImages) => {
    try {
      if (!session.images || session.images.length === 0) {
        setNotification({message: "Tidak ada gambar untuk didownload", type: "error"});
        setTimeout(() => setNotification(null), 3000);
        return;
      }
      
      console.log(`📦 Starting batch download for ${session.images.length} images...`);
      
      const zip = new JSZip();
      const sessionFolder = zip.folder(session.custom_name || session.session_id.substring(0, 8));
      
      for (const image of session.images) {
        const url = getImageUrl(image.image_url);
        if (!url) {
          console.warn("⚠️ Skipped image with no URL:", image.id);
          continue;
        }
        
        // Fetch image as blob
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Add to ZIP
        const fileName = `${image.direction}_${new Date(image.captured_at).getTime()}.jpg`;
        sessionFolder?.file(fileName, blob);
        
        // Small delay between fetches
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Generate ZIP and download
      const zipBlob = await zip.generateAsync({type: "blob"});
      const downloadUrl = window.URL.createObjectURL(zipBlob);
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${session.custom_name || session.session_id.substring(0, 8)}_screenshots.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log("✅ Batch download completed");
      setNotification({message: `${session.images.length} gambar berhasil diunduh sebagai ZIP!`, type: "success"});
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("❌ Error during batch download:", error);
      setNotification({message: "Gagal download batch", type: "error"});
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Delete single image
  const deleteImage = async (image: any, session: SessionWithImages) => {
    try {
      console.log("🗑️ Deleting image:", image.id);
      
      // Delete from storage
      await supabase.storage
        .from("eye_exam_screenshots")
        .remove([image.image_url]);
      
      // Delete from database
      await supabase
        .from("detection_images")
        .delete()
        .eq("id", image.id);
      
      // Refresh session detail
      if (selectedSession) {
        const updatedSession = {
          ...selectedSession,
          images: selectedSession.images?.filter(img => img.id !== image.id) || []
        };
        setSelectedSession(updatedSession);
      }
      
      console.log("✅ Image deleted successfully");
      setNotification({message: "Gambar berhasil dihapus", type: "success"});
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("❌ Error deleting image:", error);
      setNotification({message: "Gagal menghapus gambar", type: "error"});
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Delete session
  const deleteSession = async (session: SessionWithImages) => {
    try {
      console.log("🗑️ Deleting session:", session.id);
      
      await detectionHelpers.deleteDetectionSession(session.session_id, user!.id);
      
      // Remove from sessions list
      setSessions(sessions.filter(s => s.id !== session.id));
      setSelectedSession(null);
      
      // Invalidate cache agar data segar di-fetch next time
      cache.invalidateCache();
      
      console.log("✅ Session deleted successfully");
      setNotification({message: "Sesi berhasil dihapus", type: "success"});
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("❌ Error deleting session:", error);
      setNotification({message: "Gagal menghapus sesi", type: "error"});
      setTimeout(() => setNotification(null), 3000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="pt-24 max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">Silakan login terlebih dahulu untuk melihat history</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg text-white font-semibold z-50 animate-fadeIn ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="pt-24">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif", color: "#374151" }}>
              <span style={{ color: "#4DA1B2" }}>Riwayat</span> Deteksi
            </h1>
            <p className="text-lg text-gray-600" style={{ fontFamily: "Poppins, sans-serif" }}>
              Lihat semua sesi deteksi Anda
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-r-lg mb-6 shadow-sm">
              <div className="flex items-start gap-4">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold">Error memuat riwayat</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block mb-4">
                <div className="h-12 w-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-700 font-semibold text-lg">Loading riwayat deteksi...</p>
              <p className="text-gray-500 text-sm mt-2">Mengambil data dari database</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-16 text-center border border-gray-200">
              <div className="mb-4 flex justify-center">
                <img src="/images/clipboard.png" alt="Clipboard" className="w-20 h-20" />
              </div>
              <p className="text-gray-700 text-xl font-semibold mb-2">Belum ada sesi deteksi</p>
              <p className="text-gray-500 mb-6">Mulai deteksi untuk melihat riwayat di sini</p>
              <a href="/detection" className="inline-flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition">
                Mulai Deteksi
                <img src="/images/Arrow.png" alt="Arrow" className="w-2 h-3" />
              </a>
            </div>
          ) : selectedSession ? (
            // Detail view
            <div className="bg-white rounded-lg shadow-lg p-8">
              <button
                onClick={() => setSelectedSession(null)}
                className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded flex items-center gap-2"
              >
                <img src="/images/Arrow.png" alt="Back" className="w-2 h-3" style={{ transform: "scaleX(-1)", filter: "brightness(0) saturate(100%) invert(20%) sepia(3%) saturate(415%) hue-rotate(342deg)" }} />
                Kembali ke List
              </button>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded flex flex-col justify-between h-full">
                  <p className="text-xs text-gray-600">Waktu Mulai</p>
                  <p className="text-sm font-semibold text-gray-800">{new Date(selectedSession.started_at).toLocaleString("id-ID")}</p>
                </div>
                <div className="bg-green-50 p-4 rounded flex flex-col justify-between h-full">
                  <p className="text-xs text-gray-600">Durasi</p>
                  <p className="text-sm font-semibold text-gray-800">{formatDuration(selectedSession.duration_seconds || 0)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded flex flex-col justify-between h-full">
                  <p className="text-xs text-gray-600">Screenshots</p>
                  <p className="text-sm font-semibold text-gray-800">{selectedSession.total_screenshots}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded flex flex-col justify-between h-full">
                  <p className="text-xs text-gray-600 mb-2">Ringkasan Arah</p>
                  <div className="flex gap-2">
                    <span className="inline-block px-3 py-2 bg-red-100 text-red-800 text-xs rounded font-semibold">
                      KIRI: {selectedSession.direction_summary?.KIRI || 0}
                    </span>
                    <span className="inline-block px-3 py-2 bg-blue-100 text-blue-800 text-xs rounded font-semibold">
                      KANAN: {selectedSession.direction_summary?.KANAN || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Screenshots gallery with batch download */}
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Screenshots</h3>
                </div>
                {selectedSession.images && selectedSession.images.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedSession.images.map((image) => (
                      <div
                        key={image.id}
                        className="rounded-lg shadow hover:shadow-lg transition flex flex-col overflow-hidden"
                      >
                        <div 
                          className="bg-gray-200 h-40 overflow-hidden relative group cursor-pointer flex-shrink-0" 
                          onClick={() => setSelectedImage({
                            url: getImageUrl(image.image_url),
                            direction: image.direction,
                            captured_at: image.captured_at
                          })}
                        >
                          <img
                            src={getImageUrl(image.image_url)}
                            alt={`Screenshot ${image.direction}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23e5e7eb' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3E📷%3C/text%3E%3C/svg%3E";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition text-sm font-semibold">Klik untuk melihat</span>
                          </div>
                        </div>
                        <div className="p-3 bg-white flex-1 flex flex-col justify-between">
                          <div>
                            <p className="text-xs text-gray-600">
                              {new Date(image.captured_at).toLocaleTimeString("id-ID")}
                            </p>
                            <span className={`inline-block mt-2 px-3 py-1 rounded text-xs font-semibold ${getDirectionColor(image.direction)}`}>
                              {image.direction}
                            </span>
                            <p className="text-xs text-gray-600 mt-2">Confidence: {(image.confidence * 100).toFixed(1)}%</p>
                          </div>
                        </div>
                        {/* Download and Delete Buttons */}
                        <div className="flex gap-0 divide-x-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadSingleImage(image, selectedSession);
                            }}
                            className="flex-1 px-2 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-xs font-semibold transition flex items-center justify-center gap-1 border-0"
                            title="Download gambar"
                          >
                            <img src="/images/download.png" alt="Download" className="w-3 h-3" style={{ filter: "brightness(0) saturate(100%) invert(47%) sepia(58%) saturate(1000%) hue-rotate(88deg)" }} />
                            Download
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Hapus gambar ini?')) {
                                deleteImage(image, selectedSession);
                              }
                            }}
                            className="flex-1 px-2 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold transition flex items-center justify-center gap-1 border-0"
                            title="Hapus gambar"
                          >
                            <img src="/images/trash.png" alt="Hapus" className="w-3 h-3" style={{ filter: "brightness(0) saturate(100%) invert(28%) sepia(74%) saturate(1215%) hue-rotate(354deg)" }} />
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Tidak ada screenshot</p>
                )}
              </div>
            </div>
          ) : (
            // List view with grouping
            <div className="space-y-8">
              {(() => {
                const grouped = groupSessionsByPeriod(sessions);
                return (
                  <>
                    {/* Hari Ini */}
                    {grouped.hari_ini.length > 0 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800" style={{ fontFamily: "Poppins, sans-serif" }}>Hari Ini</h2>
                        <div className="space-y-3">
                          {grouped.hari_ini.map((session) => renderSessionCard(session))}
                        </div>
                      </div>
                    )}

                    {/* 3 Hari */}
                    {grouped.tiga_hari.length > 0 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800" style={{ fontFamily: "Poppins, sans-serif" }}>3 Hari Terakhir</h2>
                        <div className="space-y-3">
                          {grouped.tiga_hari.map((session) => renderSessionCard(session))}
                        </div>
                      </div>
                    )}

                    {/* 1 Minggu */}
                    {grouped.satu_minggu.length > 0 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800" style={{ fontFamily: "Poppins, sans-serif" }}>1 Minggu Terakhir</h2>
                        <div className="space-y-3">
                          {grouped.satu_minggu.map((session) => renderSessionCard(session))}
                        </div>
                      </div>
                    )}

                    {/* 1 Bulan */}
                    {grouped.satu_bulan.length > 0 && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4 text-gray-800" style={{ fontFamily: "Poppins, sans-serif" }}>1 Bulan Terakhir</h2>
                        <div className="space-y-3">
                          {grouped.satu_bulan.map((session) => renderSessionCard(session))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Close button */}
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-900 text-white rounded-full w-10 h-10 flex items-center justify-center z-10 transition hover:scale-110"
                title="Tutup"
              >
                ✕
              </button>

              {/* Image */}
              <img
                src={selectedImage.url}
                alt={selectedImage.direction}
                className="w-full h-auto"
              />

              {/* Info */}
              <div className="p-6 bg-gray-50 border-t">
                <div className="flex justify-between items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Waktu Capture</p>
                    <p className="font-semibold text-gray-800 text-lg mt-1">
                      {new Date(selectedImage.captured_at).toLocaleString("id-ID")}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded font-semibold ${getDirectionColor(selectedImage.direction)}`}>
                    {selectedImage.direction}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameSessionId && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => !renameSaving && setRenameSessionId(null)}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl animate-slideInUp"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Ganti Nama Sesi</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              disabled={renameSaving}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 disabled:bg-gray-100"
              placeholder="Masukkan nama baru"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRenameSessionId(null)}
                disabled={renameSaving}
                className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-semibold transition disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  // Save rename to database
                  if (!renameValue.trim()) {
                    setError("Nama tidak boleh kosong");
                    return;
                  }

                  // Find the session being renamed
                  const sessionToRename = sessions.find(s => s.id === renameSessionId);
                  if (!sessionToRename) return;

                  setRenameSaving(true);
                  (async () => {
                    try {
                      console.log("💾 Saving session name:", renameValue);
                      await detectionHelpers.updateSessionName(
                        sessionToRename.session_id,
                        user!.id,
                        renameValue
                      );
                      
                      // Update sessions list with new name
                      const updatedSessions = sessions.map(s =>
                        s.id === renameSessionId ? { ...s, custom_name: renameValue } : s
                      );
                      setSessions(updatedSessions);
                      
                      // Invalidate cache agar data segar di-fetch next time
                      cache.invalidateCache();
                      
                      // Close modal
                      setRenameSessionId(null);
                      setRenameValue("");
                      console.log("✅ Session name saved!");
                    } catch (err: any) {
                      console.error("❌ Failed to save session name:", err);
                      setError(err.message || "Failed to save name");
                    } finally {
                      setRenameSaving(false);
                    }
                  })();
                }}
                disabled={renameSaving || !renameValue.trim()}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {renameSaving ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white border-r-transparent rounded-full animate-spin"></span>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}