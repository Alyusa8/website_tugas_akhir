import { NavLink } from "react-router";

export default function Footer() {
  return (
    <footer className="bg-slate-700 text-white py-12 px-4 sm:px-6 lg:px-8" style={{backgroundColor: '#374151'}}>
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-8">
          {/* Logo and Description - Left Section */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <img 
                src="/images/EYEEXAM-Logo.png" 
                alt="Eye Exam Logo" 
                className="h-8 sm:h-10 w-auto object-contain"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Platform ujian online dengan teknologi 
              deteksi gerakan untuk menjaga integritas ujian.
            </p>
          </div>

          {/* Fitur Section */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4 text-base sm:text-lg" style={{color: '#F7FAFC'}}>Fitur</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <NavLink 
                  to="/" 
                  className="text-gray-300 transition-colors" 
                  style={{color: '#F7FAFC'}} 
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'}
                >
                  Beranda
                </NavLink>
              </li>
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
              <li>
                <NavLink 
                  to="/articles" 
                  className="text-gray-300 transition-colors" 
                  style={{color: '#F7FAFC'}} 
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'}
                >
                  Artikel
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/about" 
                  className="text-gray-300 transition-colors" 
                  style={{color: '#F7FAFC'}} 
                  onMouseEnter={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.color = '#F7FAFC'}
                >
                  Tentang Kami
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Interaksi dengan Kami Section */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4 text-base sm:text-lg" style={{color: '#F7FAFC'}}>Interaksi dengan Kami</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                <a 
                  href="https://instagram.com/eye_exam" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-3 hover:transform hover:scale-105 transition-all"
                >
                  <img 
                    src="/images/instagramlogo.png" 
                    alt="Instagram Logo" 
                    className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                  />
                  <span className="text-gray-300 transition-colors" style={{color: '#F7FAFC'}}>Eye_Exam</span>
                </a>
              </li>
              <li className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                <a 
                  href="https://facebook.com/eyeexam" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-3 hover:transform hover:scale-105 transition-all"
                >
                  <img 
                    src="/images/facebooklogo.jpg" 
                    alt="Facebook Logo" 
                    className="h-5 w-5 sm:h-6 sm:w-6 object-contain rounded-lg"
                  />
                  <span className="text-gray-300 transition-colors" style={{color: '#F7FAFC'}}>@Eye_Exam</span>
                </a>
              </li>
              <li className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer">
                <a 
                  href="https://x.com/eyeexam" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center space-x-3 hover:transform hover:scale-105 transition-all"
                >
                  <img 
                    src="/images/Xlogo.jpg" 
                    alt="X Logo" 
                    className="h-5 w-5 sm:h-6 sm:w-6 object-contain rounded-lg"
                  />
                  <span className="text-gray-300 transition-colors" style={{color: '#F7FAFC'}}>@EyeExam</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Hubungi Kami Section */}
          <div className="col-span-1">
            <h4 className="font-semibold mb-4 text-base sm:text-lg" style={{color: '#F7FAFC'}}>Hubungi Kami</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <img 
                  src="/images/gmaillogo.png" 
                  alt="Gmail Logo" 
                  className="h-5 w-5 sm:h-6 sm:w-6 object-contain mt-0.5 flex-shrink-0"
                />
                <span className="break-all" style={{color: '#F7FAFC'}}>eyeexam@gmail.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <img 
                  src="/images/kontaklogo.jpg" 
                  alt="Phone Logo" 
                  className="h-5 w-5 sm:h-6 sm:w-6 object-contain rounded-lg flex-shrink-0"
                />
                <span style={{color: '#F7FAFC'}}>+62 896-0872-7717</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-blue-400 my-8" style={{borderTopColor: '#60A5FA'}}></div>

        {/* Bottom Footer */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-center sm:text-right">
          <p className="text-xs sm:text-sm text-gray-300">
            © 2025 Eye Exam. Semua Hak Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
