import { useState, useEffect } from "react";
import { useParams, NavLink } from "react-router";
import Navbar from "../components/Navbar";
import { supabase } from "../lib/supabase";

export function meta({ params }: { params: { id: string } }) {
  return [
    { title: "Artikel - Eye Exam" },
    { name: "description", content: "Baca artikel pendidikan terkini" },
  ];
}

interface Artikel {
  id_artikel?: string;
  id?: string;
  judul_artikel?: string;
  judul?: string;
  deskripsi_artikel?: string;
  deskripsi?: string;
  konten?: string;
  gambar_url?: string;
  url_gambar?: string;
  url?: string;
  tanggal?: string;
  tanggal_terbit?: string;
  tempat?: string;
  kategori_artikel?: string;
  kategori_arti?: string;
  kategori?: string;
  penerbit?: string;
  created_at?: string;
  updated_at?: string;
}

const getTagColor = (category: string, categoriesData: any[] = []) => {
  // Find category in database
  const categoryData = categoriesData.find(cat => 
    cat.nama_kategori === category || cat.nama === category
  );
  
  // If found in database, use the color from database
  if (categoryData && categoryData.warna) {
    return categoryData.warna;
  }
  
  // Fallback to default colors
  switch (category) {
    case 'Pendidikan':
      return 'bg-blue-100 text-blue-800';
    case 'Teknologi':
      return 'bg-green-100 text-green-800';
    case 'Prestasi':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ArtikelDetail() {
  const { id } = useParams();
  const [artikel, setArtikel] = useState<Artikel | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    loadArtikel();
  }, [id]);

  const loadCategories = async () => {
    try {
      console.log("Loading categories from kategori_artikel...");
      const { data, error: supabaseError } = await supabase
        .from("kategori_artikel")
        .select("*");

      if (supabaseError) {
        console.error("Error loading categories:", supabaseError);
        return;
      }

      console.log("Categories loaded:", data);
      setCategories(data || []);
    } catch (err) {
      console.error("Error in loadCategories:", err);
    }
  };

  const loadArtikel = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Loading artikel with ID:", id);

      // Try to fetch with id_artikel first, then fallback to id
      let query = supabase
        .from("artikel")
        .select("*");

      const { data, error: supabaseError } = await query.limit(1);

      console.log("All articles fetched:", data);

      if (supabaseError) {
        console.error("Error fetching:", supabaseError);
        setError("Gagal memuat artikel");
        return;
      }

      // Find article by id_artikel or id
      const foundArtikel = data?.find((art: any) => 
        String(art.id_artikel) === String(id) || String(art.id) === String(id)
      );

      console.log("Found artikel:", foundArtikel);

      if (foundArtikel) {
        setArtikel(foundArtikel);
      } else {
        // If not found, try fetching single by id_artikel
        const { data: singleData, error: singleError } = await supabase
          .from("artikel")
          .select("*")
          .eq("id_artikel", id)
          .single();

        if (singleError) {
          console.error("Single fetch error:", singleError);
          setError("Artikel tidak ditemukan");
          return;
        }

        if (singleData) {
          setArtikel(singleData);
        }
      }
    } catch (err) {
      console.error("Error loading artikel:", err);
      setError("Terjadi kesalahan saat memuat artikel");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Memuat artikel...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !artikel) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">{error || "Artikel tidak ditemukan"}</p>
            <NavLink to="/articles" className="text-blue-600 hover:text-blue-800">
              Kembali ke daftar artikel
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  const judul = artikel.judul_artikel || artikel.judul;
  const deskripsi = artikel.deskripsi_artikel || artikel.deskripsi;
  const konten = artikel.konten || deskripsi;
  const gambar = artikel.url_gambar || artikel.url || artikel.gambar_url;
  const kategori = artikel.kategori_artikel || artikel.kategori_arti || artikel.kategori || 'Pendidikan';
  const tanggal = artikel.tanggal_terbit || artikel.tanggal;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <NavLink to="/articles" className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2">
            <img 
              src="/images/Arrow.png" 
              alt="Back" 
              className="w-4 h-4"
              style={{filter: 'invert(31%) sepia(99%) saturate(2413%) hue-rotate(201deg) brightness(85%) contrast(120%)', transform: 'scaleX(-1)'}}
            />
            Kembali ke Artikel
          </NavLink>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-poppins">
            {judul}
          </h1>
          
          <div className="flex items-center gap-4 flex-wrap text-sm text-gray-600">
            <span className={`inline-block px-3 py-1 rounded-full font-semibold ${getTagColor(kategori, categories)}`}>
              {kategori}
            </span>
            {tanggal && <span>{tanggal}</span>}
            {artikel.tempat && <span>{artikel.tempat}</span>}
          </div>
        </div>

        {/* Featured Image */}
        {gambar && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img 
              src={gambar}
              alt={judul}
              className="w-full h-96 object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop';
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none pt-8">
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {konten}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <NavLink to="/articles" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
            <img 
              src="/images/Arrow.png" 
              alt="Back" 
              className="w-2 h-3"
              style={{filter: 'invert(31%) sepia(99%) saturate(2413%) hue-rotate(201deg) brightness(85%) contrast(120%)', transform: 'scaleX(-1)'}}
            />
            Kembali ke daftar artikel
          </NavLink>
        </div>
      </article>
    </div>
  );
}
