import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";

export function meta() {
  return [
    { title: "Kabar Dunia Pendidikan - Eye Exam" },
    { name: "description", content: "Kumpulan artikel pendidikan terbaru untuk menambah pengetahuan dan wawasan" },
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

// Function to get tag color based on category
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

// Education figures
const educationFigures = [
  {
    id: 1,
    name: "Mohammad Hatta",
    image: `/images/hatta.png`, 
    quote: "Kurang cerdas dapat diperbaiki dengan belajar. Kurang cakap dapat dihilangkan dengan pengalaman. Namun tidak jujur itu sulit diperbaiki"
  },
  {
    id: 2,
    name: "Michael Josephson", 
    image: `/images/josephson.png`,
    quote: "Kejujuran tidak selalu menguntungkan, tetapi ketidakjujuran selalu merugikan"
  },
  {
    id: 3,
    name: "R.A Kartini",
    image: `/images/kartini.png`,
    quote: "Banyak hal yang bisa menjatuhkanmu. Tapi satu-satunya hal yang benar-benar dapat menjatuhkanmu adalah sikapmu sendiri"
  }
];

// Trending news
const trendingNews = [
  {
    id: 1,
    title: "Perkuat Kolaborasi, Kemendikdasmen Berikan Apresiasi kepada Para Penggerak dan Inovator Pendidikan Nasional",
    excerpt: "Upaya membangun pendidikan yang bermutu tidak hanya bergantung pada kebijakan pemerintah, tetapi juga pada kontribusi nyata dari berbagai pihak yang terlibat langsung",
    date: "Jakarta, 26 Mei 2025"
  },
  {
    id: 2,
    title: "Seminar SEPAKKA 21 Perkuat Pendidikan Karakter dan Kecakapan Abad 21 melalui Forum Ilmiah Nasional", 
    excerpt: "Asosiasi Riset Ilmu Pendidikan Indonesia (ARIPI) sukses menyelenggarakan Seminar Nasional dan Call for Paper SEPAKKA 21 sebagai wadah ilmiah untuk memperkuat pendidikan karakter dan kecakapan abad ke-21. Kegiatan ini diikuti oleh akademisi, peneliti, pendidik, serta praktisi pendidikan dari berbagai perguruan tinggi dan institusi di Indonesia.",
    date: "Semarang, 29 Oktober 2025"
  }
];

export default function Articles() {
  const [articles, setArticles] = useState<Artikel[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    loadArticles();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error: supabaseError } = await supabase
        .from("kategori_artikel")
        .select("*");

      if (supabaseError) {
        // Silently fail - categories optional, use default colors
        return;
      }

      setCategories(data || []);
    } catch (err) {
      // Silently fail - categories optional, use default colors
    }
  };

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from("artikel")
        .select("*");

      if (supabaseError) {
        setError(`Error: ${supabaseError.message} (Check RLS policies)`);
        return;
      }

      if (data && Array.isArray(data)) {
        setArticles(data);
      } else {
        setArticles([]);
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter articles by selected category
  const filteredArticles = selectedFilter 
    ? articles.filter(article => 
        (article.kategori_artikel || article.kategori_arti || article.kategori) === selectedFilter
      )
    : articles;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-100 via-blue-50 to-slate-100 overflow-hidden min-h-screen pt-32">
        <div className="max-w-7xl mx-auto px-6 mb-12 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{color: '#374151'}}>
              Kabar Dunia <span style={{color: '#4DA1B2'}}>Pendidikan</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Kumpulan artikel pendidikan terbaru untuk menambah pengetahuan dan wawasan
            </p>
          </div>
        </div>

        {/* Featured Images Grid */}
        <div className="bg-slate-700 py-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Large featured image */}
              <div>
                <img 
                  src="/images/kelas.png"
                  alt="Students taking exam"
                  className="w-full h-80 md:h-96 object-cover rounded-lg shadow-lg"
                />
              </div>
              
              {/* Two smaller images */}
              <div className="grid grid-cols-1 gap-6">
                <img 
                  src="/images/ujian2.jpg"
                  alt="Teacher supervising exam"
                  className="w-full h-36 md:h-44 object-cover rounded-lg shadow-lg"
                />
                <img 
                  src="/images/ujian1.jpg"
                  alt="Wide classroom exam view"
                  className="w-full h-36 md:h-44 object-cover rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* News Section */}
        <div className="max-w-7xl mx-auto px-6 mt-16">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main News Column */}
            <div className="lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold" style={{color: '#374151'}}>Berita Pendidikan Terkini</h2>
                
                {/* Filter Tags */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedFilter(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedFilter === null
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setSelectedFilter('Pendidikan')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedFilter === 'Pendidikan'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Pendidikan
                  </button>
                  <button
                    onClick={() => setSelectedFilter('Teknologi')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedFilter === 'Teknologi'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Teknologi
                  </button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                    <p className="text-gray-600">Memuat artikel...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-8">
                  {error}
                </div>
              ) : (
                <div className="space-y-10">
                  {filteredArticles.map((article) => (
                    <NavLink key={article.id_artikel || article.id} to={`/articles/${article.id_artikel || article.id}`}>
                      <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer mb-8">
                        <div className="flex">
                          <img 
                            src={article.url_gambar || article.url || article.gambar_url || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop'}
                            alt={article.judul_artikel || article.judul}
                            className="w-50 h-50 object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=250&fit=crop';
                            }}
                          />
                          <div className="flex-1 pl-6 pr-6 pt-4 pb-4 flex flex-col">
                            <h3 className="text-lg font-bold mb-2 hover:text-blue-600 transition-colors" style={{color: '#374151'}}>
                              {article.judul_artikel || article.judul}
                            </h3>
                            <p className="text-gray-600 text-sm mb-2 overflow-hidden leading-relaxed" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              maxHeight: '4.5em',
                              lineHeight: '1.5em'
                            }}>
                              {article.deskripsi_artikel || article.deskripsi}
                            </p>
                            <div className="flex justify-between items-center mt-auto">
                              <p className="text-xs font-medium" style={{color: '#3B82F6'}}>
                                {article.tanggal_terbit || article.tanggal || 'Tanpa tanggal'}
                              </p>
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getTagColor(article.kategori_artikel || article.kategori_arti || article.kategori || 'Pendidikan', categories)}`}>
                                {article.kategori_artikel || article.kategori_arti || article.kategori || 'Pendidikan'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar News */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold mb-8" style={{color: '#374151'}}>Kabar Trending</h2>
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="space-y-4">
                  {trendingNews.map((news) => (
                    <div key={news.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <h4 className="font-semibold mb-2" style={{color: '#374151'}}>{news.title}</h4>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-3">
                        {news.excerpt}
                      </p>
                      <p className="text-xs font-medium" style={{color: '#3B82F6'}}>
                        {news.date}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Education Figures Section */}
        <div className="max-w-7xl mx-auto px-6 mt-20">
          <div className="bg-slate-700 rounded-2xl p-12">
            
            <div className="flex flex-wrap justify-center gap-8">
              {educationFigures.map((figure) => (
                <div key={figure.id} className="text-center">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col" style={{width: '350px', height: '650px'}}>
                    <div className="flex-shrink-0">
                      <img 
                        src={figure.image}
                        alt={figure.name}
                        className="w-full object-cover"
                        style={{height: '380px'}}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=350&h=380&fit=crop&crop=face`;
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center p-8">
                      <blockquote className="text-gray-700 mb-8 leading-relaxed" style={{fontFamily: 'Open Sans, sans-serif', fontStyle: 'italic', fontSize: '14px'}}>
                        "{figure.quote}"
                      </blockquote>
                      <h4 style={{fontFamily: 'Poppins, sans-serif', fontWeight: '500', fontSize: '20px', color: '#374151'}}>
                        ~ {figure.name} ~
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Large EYE EXAM Text */}
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="pl-0 pt-30 -mb-3.25">
            <h2 
              className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold tracking-wider leading-none mb-0"
              style={{
                fontFamily: 'Poppins, sans-serif',
                background: 'linear-gradient(215deg, #e0f2fe 0%, #f1f5f9 60%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 0 #eff6ff',
                WebkitTextStroke: '4px rgba(55, 65, 81, 0.2)'
              }}
            >
              EYE EXAM
            </h2>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}