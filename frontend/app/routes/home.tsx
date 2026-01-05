import type { Route } from "./+types/home";
import { NavLink, useSearchParams } from "react-router";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Eye Exam - Ujian Jujur Dimulai dari Sekarang" },
    { name: "description", content: "Platform ujian online dengan teknologi deteksi gerakan canggih untuk memastikan integritas ujian" },
  ];
}

export default function Home() {
  const [searchParams] = useSearchParams();
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setShowVerificationMessage(true);
      // Hide message after 5 seconds
      const timer = setTimeout(() => {
        setShowVerificationMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Listen for auth messages from callback window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'auth_success') {
        setShowVerificationMessage(true);
        // Hide message after 5 seconds
        const timer = setTimeout(() => {
          setShowVerificationMessage(false);
        }, 5000);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navbar />

      {/* Verification Success Message */}
      {showVerificationMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Email berhasil diverifikasi! Selamat datang di Eye Exam.</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-100 via-blue-90 to-slate-100 overflow-hidden h-[920px] pt-50">{/* Ellipse Background */}
        <div 
          className="absolute z-0"
          style={{
            width: '850px',
            height: '550px',
            borderRadius: '50%',
            background: 'linear-gradient(150deg, rgba(96, 165, 250, 0.6) 0%, rgba(247, 250, 252, 0) 70%)',
            boxShadow: '2px 2px 10px 0px rgba(0, 0, 0, 0.15)',
            top: '470px',
            left: '130px',
            transform: 'translateY(-50%)'
          }}
        ></div>
        
        <div className="max-w-[1400px] mx-auto h-full relative z-10">
          <div className="grid lg:grid-cols-2 h-full">
            {/* Left Content */}
            <div className="flex items-start justify-start px-6 pt-8 lg:pt-32 relative z-20">
              <div className="space-y-8 max-w-xl">
                {/* Hero Section */}
                <div className="text-left">
                  <h1 className="text-4xl lg:text-5xl xl:text-6xl font-semibold leading-none mb-4" style={{fontFamily: 'Poppins, sans-serif', color: '#374151', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'}}>
                    Ujian jujur dimulai dari <span style={{color: '#4DA1B2', textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)'}}>sekarang</span>
                  </h1>
                  <p className="text-lg text-slate-600 leading-tight font-semibold mb-6" style={{fontFamily: 'Poppins, sans-serif', textShadow: '1px 1px 3px rgba(0, 0, 0, 0.08)'}}>
                    <span style={{color: '#3B82F4'}}>Didukung teknologi deteksi gerakan cerdas,
                    kami bantu menjaga integritas setiap ujian.</span>
                  </p>
                  <NavLink 
                    to="/detection" 
                    className="inline-flex items-center justify-center px-8 rounded-lg font-normal transition-colors shadow-lg h-[60px] font-poppins text-xl gap-3" 
                    style={{backgroundColor: '#3B82F6', color: '#F7FAFC'}} 
                    onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.target as HTMLElement).style.backgroundColor = '#2563EB'}
                    onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.target as HTMLElement).style.backgroundColor = '#3B82F6'}
                  >
                    Mulai Sekarang
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                    </svg>
                  </NavLink>
                </div>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative h-full z-10 flex items-center justify-center">
              <img 
                src="/images/male1.png"
                alt="Professional person"
                className="h-200 w-150 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Manfaat Kejujuran Section */}
      <section className="h-screen flex items-center bg-gray-50" id="manfaat">
        <div className="max-w-[1400px] mx-auto px-6 w-full">
          <div className="text-center mb-20">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8" style={{color: '#374151'}}>
              <span style={{color: '#4DA1B2'}}>Manfaat</span> Kejujuran
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/images/diskusi.jpg"
                alt="Students studying together"
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop";
                }}
              />
            </div>
            
            <div className="order-1 lg:order-2 space-y-6">
              <p className="font-light text-slate-600" style={{fontSize: '24px', lineHeight: '38px'}}>
                Kejujuran menciptakan hasil yang nyata. 
                Dengan <span className="font-semibold" style={{color: '#4DA1B2'}}>menjunjung integritas saat ujian</span>, 
                setiap nilai mencerminkan kemampuan sesungguhnya.
              </p>
              <p className="font-light text-slate-600" style={{fontSize: '24px', lineHeight: '38px'}}>
                Kami hadir untuk membantu proses 
                belajar berjalan adil, jujur, dan berkualitas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tentang Kami Section */}
      <section className="min-h-screen flex items-center relative overflow-hidden" id="tentang" style={{backgroundColor: '#4A5568'}}>
        {/* Content Container */}
        <div className="relative z-0 max-w-[1400px] mx-auto w-full h-full">
          <div className="grid grid-cols-2 h-full">
            {/* Left Content */}
            <div className="flex items-center px-8 relative z-5">
              <div className="space-y-6">
                <h2 className="text-4xl lg:text-5xl font-bold mb-8" style={{fontFamily: 'Poppins, sans-serif', color: '#F7FAFC'}}>
                  Tentang <span style={{color: '#4DA1B2'}}>Kami</span>
                </h2>
                <p className="text-lg font-light" style={{fontFamily: 'Open Sans, sans-serif', lineHeight: '30px', color: '#F7FAFC'}}>
                  Kami adalah pengembang solusi pengawasan ujian yang memanfaatkan YOLOv5 untuk mendeteksi aktivitas atau perilaku mencurigakan saat ujian secara real-time.
                </p>
                <NavLink to="/about" className="inline-flex items-center justify-center px-8 rounded-lg font-normal transition-colors shadow-lg h-[60px] font-poppins text-xl gap-3" style={{backgroundColor: '#3B82F6', color: '#F7FAFC'}} onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563EB'} onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#3B82F6'}>
                  Baca Selengkapnya 
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </NavLink>
              </div>
            </div>

            {/* Right Images */}
            <div className="grid grid-cols-2 gap-4 p-8 relative z-5">
              <div>
                <img 
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=500&fit=crop"
                  alt="Glass building"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <img 
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=350&fit=crop"
                  alt="Modern building"
                  className="w-full h-80 object-cover rounded-lg"
                />
                <img 
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&h=350&fit=crop"
                  alt="Architecture pattern"
                  className="w-full h-80 object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur Kami Section */}
      <section className="min-h-screen flex items-center bg-white" id="fitur">
        <div className="max-w-[1400px] mx-auto px-6 w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-light mb-8" style={{fontFamily: 'Poppins, sans-serif', color: '#374151'}}>
              Fitur <span style={{color: '#4DA1B2'}}>Kami</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto font-light" style={{fontFamily: 'Open Sans, sans-serif'}}>
              Coba dan jelajahi fitur utama kami untuk membantu anda dalam menciptakan 
              suasana ujian yang nyaman dan menjunjung tinggi integritas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            {/* Deteksi YOLO Card */}
                        {/* Deteksi YOLO Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 hover:shadow-xl transition-shadow flex flex-col">
              <div className="flex space-x-4 flex-1 py-6">
                <div className="flex items-start justify-center flex-shrink-0">
                  <span className="text-9xl font-bold" style={{color: '#4DA1B2', fontFamily: 'Open Sans, sans-serif'}}>1</span>
                </div>
                <div className="flex-1 font-poppins">
                  <h3 className="text-3xl font-bold mb-3" style={{color: '#374151'}}>Deteksi YOLO</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Menggunakan teknologi YOLO (<span className="italic">You Only Look Once</span>) 
                    untuk mendeteksi aktivitas peserta ujian secara <span className="italic">real-time</span> 
                    melalui kamera agar pengawasan ujian menjadi lebih efisien.
                  </p>
                </div>
              </div>
              <div className="text-center pb-6">
                <NavLink 
                  to="/detection"
                  className="inline-flex items-center justify-center text-white px-4 rounded-lg font-normal transition-colors h-[50px] font-poppins text-xl gap-3"
                  style={{backgroundColor: '#3B82F6'}}
                  onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.target as HTMLElement).style.backgroundColor = '#2563EB'}
                  onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.target as HTMLElement).style.backgroundColor = '#3B82F6'}
                >
                  Kunjungi 
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </NavLink>
              </div>
            </div>

            {/* Artikel Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 hover:shadow-xl transition-shadow flex flex-col">
              <div className="flex space-x-4 flex-1 py-6">
                <div className="flex items-start justify-center flex-shrink-0">
                  <span className="text-9xl font-bold" style={{color: '#4DA1B2', fontFamily: 'Open Sans, sans-serif'}}>2</span>
                </div>
                <div className="flex-1 font-poppins">
                  <h3 className="text-3xl font-bold mb-3" style={{color: '#374151'}}>Artikel</h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    Berisi berbagai artikel untuk menambah wawasan dan dengan konten edukatif seputar pendidikan, teknologi, 
                    dan pentingnya kejujuran dalam dunia pendidikan.
                  </p>
                </div>
              </div>
              <div className="text-center pb-6">
                <a 
                  href="/articles"
                  className="inline-flex items-center justify-center text-white px-4 rounded-lg font-normal transition-colors h-[50px] font-poppins text-xl gap-3"
                  style={{backgroundColor: '#3B82F6'}}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563EB'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#3B82F6'}
                >
                  Kunjungi 
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
