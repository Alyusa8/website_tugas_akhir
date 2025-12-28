import type { Route } from "./+types/about";
import { NavLink } from "react-router";
import Navbar from "../components/Navbar";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Tentang Kami - Eye Exam" },
    { name: "description", content: "Menjaga Ujian, Menjunjung Kejujuran - Teknologi deteksi visual berbasis YOLO v5 untuk pengawasan ujian yang adil dan transparan" },
  ];
}

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-100 via-blue-50 to-slate-100 overflow-hidden min-h-screen pt-32">
        {/* Hero Content */}
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10 py-20">
          <h1 className="text-4xl lg:text-5xl font-bold mb-16" style={{color: '#374151'}}>
            Menjaga <span style={{color: '#4DA1B2'}}>Ujian</span>, Menjunjung <span style={{color: '#4DA1B2'}}>Kejujuran</span>
          </h1>
        </div>

        {/* Main Content inside hero section */}
        <div className="max-w-7xl mx-auto px-6 relative z-10 pb-20">
          {/* First Section - Siapa Kami */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24 relative">
            {/* Ellipse Background */}
            <div 
              className="absolute z-0"
              style={{
                width: '650px',
                height: '400px',
                borderRadius: '50%',
                background: 'linear-gradient(215deg, rgba(77, 161, 178, 0.6) 0%, rgba(247, 250, 252, 0) 60%)',
                boxShadow: '2px 2px 10px 0px rgba(0, 0, 0, 0.1)',
                top: '-44px',
                right: '-30px'
              }}
            ></div>

            {/* Left Image */}
            <div className="relative z-10">
              <img 
                src="/images/dosen1.jpg"
                alt="Students taking exam"
                className="w-140 h-80 object-cover rounded-2xl shadow-lg"
                style={{objectPosition: 'center 60%'}}
              />
            </div>
            
            {/* Right Content - Siapa Kami */}
            <div className="space-y-6 relative z-10 pl-14">
              <h2 className="text-3xl font-bold mb-6" style={{color: '#374151'}}>
                Siapa <span style={{color: '#4DA1B2'}}>Kami</span>?
              </h2>
              <p className="text-gray-600 text-lg" style={{lineHeight: '30px'}}>
                Kami adalah pengembang solusi pengawasan ujian yang memanfaatkan <span style={{color: '#4DA1B2'}} className="font-semibold">YOLOv5</span> untuk mendeteksi aktivitas atau perilaku mencurigakan saat ujian secara real-time.
              </p>
            </div>
          </div>

          {/* Arrow Down */}
          <div className="text-center mb-24">
            <svg className="w-8 h-8 mx-auto text-gray-400 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
            </svg>
          </div>

          {/* Quote Section */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            {/* Left Content - Quote */}
            <div className="bg-gray-100 p-8 rounded-2xl shadow-lg relative">
              <img 
                src="/images/petikdua.png" 
                alt="Quote mark" 
                className="w-16 h-12 mb-4 opacity-50"
              />
              <p className="text-gray-700 text-lg italic mb-6" style={{lineHeight: '33px'}}>
                Kami berinovasi untuk menciptakan lingkungan ujian yang jujur demi meningkatkan kualitas pendidikan. Seperti itulah cara kami mengembangkan teknologi.
              </p>
              <div className="flex items-center">
                <img 
                  src="/images/userunknown.png" 
                  alt="Alfitto Bayu Samudro" 
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <p className="font-semibold" style={{color: '#374151'}}>Alfitto Bayu Samudro</p>
                  <p className="text-sm text-gray-500">DEV EYE EXAM</p>
                </div>
              </div>
            </div>
            
            {/* Right Content - Teknologi */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold" style={{color: '#374151'}}>
                Teknologi yang Kami Gunakan
              </h2>
              <p className="text-gray-600 text-lg" style={{lineHeight: '40px'}}>
                Sistem pengawasan ujian ini dirancang dengan memanfaatkan teknologi deteksi visual berbasis kecerdasan buatan, yaitu <span style={{color: '#3B82F6'}} className="font-semibold">YOLO (You Only Look Once) versi 5.</span> Bisa disebut dengan <span style={{color: '#3B82F6'}} className="font-semibold">YOLOv5.</span> Algoritma ini dikenal luas karena keunggulan dalam mendeteksi objek secara real-time dengan akurasi tinggi. Hal ini memungkinkan sistem untuk melakukan pemantauan tanpa jeda, sehingga pelaksanaan ujian dapat berlangsung secara efisien dan aman.
              </p>
              
              <p className="text-gray-600 text-lg" style={{lineHeight: '40px'}}>
                YOLOv5 diintegrasikan untuk mendeteksi perilaku mencurigakan selama ujian, seperti pergerakan tangan yang tidak diperbolehkan, postur tubuh yang mencurigakan, atau indikasi penggunaan perangkat terlarang. Proses deteksi berlangsung secara otomatis melalui input kamera, tanpa memerlukan pemantauan terus-menerus oleh pengawas. Hal ini mendukung pelaksanaan ujian yang lebih objektif dan bebas bias.
              </p>

              <p className="text-gray-600 text-lg" style={{lineHeight: '40px'}}>
                Seluruh hasil deteksi terekam secara otomatis dan tersimpan dalam fitur histori, yang dapat diakses oleh user untuk keperluan audit dan evaluasi. Sistem ini juga dilengkapi dengan mekanisme keamanan data berbasis enkripsi, guna memastikan kerahasiaan informasi peserta. Dengan demikian, teknologi ini tidak hanya akurat, tetapi juga memenuhi prinsip integritas dan privasi.
              </p>
            </div>
          </div>

          {/* Komitmen Kami Section */}
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24 relative">
            {/* Ellipse Background */}
            <div 
              className="absolute z-0"
              style={{
                width: '700px',
                height: '450px',
                borderRadius: '50%',
                background: 'linear-gradient(35deg, rgba(77, 161, 178, 0.6) 0%, rgba(247, 250, 252, 0) 60%)',
                boxShadow: '2px 2px 10px 0px rgba(0, 0, 0, 0.1)',
                bottom: '-70px',
                left: '-76px'
              }}
            ></div>
            
            {/* Left Content - Komitmen Kami */}
            <div className="space-y-6 relative z-10">
              <h2 className="text-3xl font-bold mb-6" style={{color: '#374151'}}>
                Komitmen <span style={{color: '#4DA1B2'}}>Kami</span>
              </h2>
              <p className="text-gray-600 text-lg" style={{lineHeight: '30px'}}>
                Kami berkomitmen menyediakan pengawasan ujian yang <span className="font-semibold">adil</span> dan <span className="font-semibold">transparan</span>, serta mendukung institusi pendidikan dalam menjaga integritas akademik dengan teknologi yang cerdas.
              </p>
            </div>
            
            {/* Right Image */}
            <div>
              <img 
                src="/images/dosen2.jpg"
                alt="Classroom exam setting"
                className="w-full h-80 object-cover rounded-2xl shadow-lg"
                style={{objectPosition: 'center 37%'}}
              />
            </div>
          </div>

          {/* Large EYE EXAM Text */}
          <div className="pl-0 pt-30 -mb-23.25">
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
      <footer className="py-0 px-0" style={{backgroundColor: '#2C3E50', color: '#F7FAFC'}}>
        <div className="w-full py-8 px-5">
          <div className="flex justify-between items-start">
            {/* Logo and Description - Kiri */}
            <div className="flex-1 max-w-md pl-[50px] pt-6">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/images/EYEEXAM-Logo.png" 
                  alt="Eye Exam Logo" 
                  className="h-16 w-auto"
                />
              </div>
              <p className="text-gray-300 pr-[50px] text-sm leading-relaxed">
                Platform ujian online dengan teknologi 
                deteksi gerakan untuk menjaga integritas ujian.
              </p>
            </div>

            {/* Grouped Sections - Kanan */}
            <div className="flex space-x-[250px] pr-[150px]">
              {/* Fitur */}
              <div>
                <h4 className="font-semibold mb-4 text-xl">Fitur</h4>
                <ul className="space-y-2 text-sm">
                  <li><NavLink to="/" className="text-gray-300 transition-colors" style={{color: '#F7FAFC'}} onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'} onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'}>Beranda</NavLink></li>
                  <li>
                    <NavLink 
                      to="/detection" 
                      className="text-gray-300 transition-colors" 
                      style={{color: '#F7FAFC'}} 
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.target as HTMLElement).style.color = '#F7FAFC'} 
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.target as HTMLElement).style.color = '#F7FAFC'}
                    >
                      Deteksi YOLO
                    </NavLink>
                  </li>
                  <li>
                    <NavLink 
                      to="/history" 
                      className="text-gray-300 transition-colors" 
                      style={{color: '#F7FAFC'}} 
                      onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.target as HTMLElement).style.color = '#F7FAFC'} 
                      onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.target as HTMLElement).style.color = '#F7FAFC'}
                    >
                      Histori
                    </NavLink>
                  </li>
                  <li><NavLink to="/articles" className="text-gray-300 transition-colors" style={{color: '#F7FAFC'}} onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'} onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'}>Artikel</NavLink></li>
                  <li><NavLink to="/about" className="text-gray-300 transition-colors" style={{color: '#F7FAFC'}} onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'} onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'}>Tentang Kami</NavLink></li>
                </ul>
              </div>

              {/* Interaksi dengan Kami */}
              <div>
                <h4 className="font-semibold mb-4 text-xl">Interaksi dengan Kami</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <a href="https://instagram.com/eye_exam" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 hover:transform hover:scale-105 transition-all">
                      <img 
                        src="/images/instagramlogo.png" 
                        alt="Instagram Logo" 
                        className="h-6 w-6 object-contain"
                      />
                      <span className="text-gray-300 transition-colors" style={{color: '#F7FAFC'}}>Eye_Exam</span>
                    </a>
                  </li>
                  <li className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <a href="https://facebook.com/eyeexam" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 hover:transform hover:scale-105 transition-all">
                      <img 
                        src="/images/facebooklogo.jpg" 
                        alt="Facebook Logo" 
                        className="h-6 w-6 object-contain rounded-lg"
                      />
                      <span className="text-gray-300 transition-colors" style={{color: '#F7FAFC'}}>@Eye_Exam</span>
                    </a>
                  </li>
                  <li className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <a href="https://x.com/eyeexam" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 hover:transform hover:scale-105 transition-all">
                      <img 
                        src="/images/Xlogo.jpg" 
                        alt="X Logo" 
                        className="h-6 w-6 object-contain rounded-lg"
                      />
                      <span className="text-gray-300 transition-colors" style={{color: '#F7FAFC'}}>@EyeExam</span>
                    </a>
                  </li>
                </ul>
              </div>

              {/* Hubungi Kami */}
              <div>
                <h4 className="font-semibold mb-4 text-xl">Hubungi Kami</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center space-x-3">
                    <img 
                      src="/images/gmaillogo.png" 
                      alt="Gmail Logo" 
                      className="h-6 w-6 object-contain"
                    />
                    <span className="text-gray-300" style={{color: '#F7FAFC'}}>eyeexam@gmail.com</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <img 
                      src="/images/kontaklogo.jpg" 
                      alt="Phone Logo" 
                      className="h-6 w-6 object-contain rounded-lg"
                    />
                    <span className="text-gray-300" style={{color: '#F7FAFC'}}>+62 896-0872-7717</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 text-right" style={{borderTop: '1px solid #60A5FA'}}>
            <p className="text-sm" style={{color: '#F7FAFC'}}>
              Copyright © 2025 Eye Exam. Semua Hak Dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}