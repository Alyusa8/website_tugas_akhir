import { NavLink, useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../contexts/ProfileContext";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const { user } = useAuth();
  const { profileData, isLoading } = useProfile();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Get display data with proper priority: database first, then fallback to auth metadata
  const displayName = (!isLoading && profileData?.full_name) 
    ? profileData.full_name 
    : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User');
  const displayImage = (!isLoading && profileData?.avatar_url) 
    ? profileData.avatar_url 
    : '/images/userunknown.png';
  
  // Check if current page is one of the target pages (Beranda, Artikel, Tentang Kami)
  const isTargetPage = ['/', '/articles', '/about'].includes(location.pathname);
  
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .nav-link {
            position: relative;
            display: inline-block;
            font-weight: 600;
            transition: font-weight 0.2s ease;
            min-width: fit-content;
          }
          
          .nav-link::before {
            content: attr(data-text);
            font-weight: 700;
            visibility: hidden;
            overflow: hidden;
            user-select: none;
            pointer-events: none;
            position: absolute;
            left: 0;
            top: 0;
            white-space: nowrap;
            z-index: -1;
          }
          
          .nav-link::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 0;
            height: 2px;
            background-color: #3B82F6;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: width;
          }
          
          .nav-link:hover::after {
            width: 100%;
          }
          
          .nav-link.active {
            font-weight: 600;
          }
          
          .nav-link.active::after {
            width: 100%;
          }
          
          .nav-link-container {
            transform: translateZ(0);
            backface-visibility: hidden;
            perspective: 1000px;
          }

          /* Mobile Hamburger Menu */
          .hamburger {
            display: none;
            flex-direction: column;
            cursor: pointer;
            gap: 5px;
          }

          .hamburger span {
            width: 25px;
            height: 3px;
            background-color: #F7FAFC;
            border-radius: 2px;
            transition: all 0.3s ease;
          }

          .hamburger.active span:nth-child(1) {
            transform: rotate(45deg) translate(8px, 8px);
          }

          .hamburger.active span:nth-child(2) {
            opacity: 0;
          }

          .hamburger.active span:nth-child(3) {
            transform: rotate(-45deg) translate(7px, -7px);
          }

          /* Mobile Sidebar Menu */
          .mobile-sidebar {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 280px;
            height: 100vh;
            background: rgba(44, 62, 80, 0.98);
            backdrop-filter: blur(10px);
            flex-direction: column;
            padding: 20px;
            z-index: 40;
            animation: slideInLeft 0.3s ease;
            overflow-y: auto;
          }

          .mobile-sidebar.active {
            display: flex;
          }

          @keyframes slideInLeft {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }

          /* Overlay behind sidebar */
          .mobile-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 35;
            animation: fadeIn 0.3s ease;
          }

          .mobile-overlay.active {
            display: block;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          /* Sidebar Profile Section */
          .sidebar-profile {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px;
            margin-bottom: 20px;
            background: rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.3);
          }

          .sidebar-profile img {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            object-fit: cover;
            flex-shrink: 0;
          }

          .sidebar-profile-info {
            flex: 1;
            min-width: 0;
          }

          .sidebar-profile-name {
            font-size: 14px;
            font-weight: 600;
            color: #F7FAFC;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .sidebar-profile-email {
            font-size: 12px;
            color: #D1D5DB;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          /* Sidebar Menu Items */
          .sidebar-menu {
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex: 1;
            margin-bottom: 20px;
          }

          .sidebar-menu a {
            padding: 12px 16px;
            color: #F7FAFC;
            border-radius: 8px;
            transition: all 0.2s ease;
            font-weight: 500;
            font-size: 14px;
            text-decoration: none;
            display: block;
          }

          .sidebar-menu a:hover {
            background-color: rgba(59, 130, 246, 0.2);
            padding-left: 20px;
          }

          .sidebar-menu a.active {
            background-color: #3B82F6;
            font-weight: 600;
            color: #FFFFFF;
          }

          /* Sidebar Divider */
          .sidebar-divider {
            height: 1px;
            background-color: rgba(255, 255, 255, 0.1);
            margin: 16px 0;
          }

          /* Sidebar Footer */
          .sidebar-footer {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
          }

          .sidebar-footer a {
            padding: 12px 16px;
            border-radius: 8px;
            transition: all 0.2s ease;
            font-weight: 500;
            text-align: center;
            text-decoration: none;
          }

          .sidebar-footer a.login-btn {
            background-color: #3B82F6;
            color: #FFFFFF;
          }

          .sidebar-footer a.login-btn:hover {
            background-color: #2563EB;
          }

          .sidebar-footer a.register-btn {
            background-color: transparent;
            color: #F7FAFC;
            border: 1px solid #F7FAFC;
          }

          .sidebar-footer a.register-btn:hover {
            background-color: #F7FAFC;
            color: #2C3E50;
          }

          .sidebar-footer a.logout-btn {
            background-color: transparent;
            color: #EF4444;
            border: 1px solid #EF4444;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          }

          .sidebar-footer a.logout-btn:hover {
            background-color: #EF4444;
            color: #FFFFFF;
          }

          /* Responsive breakpoints */
          @media (max-width: 1024px) {
            .nav-link-container {
              display: none;
            }

            .hamburger {
              display: flex;
            }

            .navbar-profile-section {
              display: none;
            }
          }

          @media (max-width: 768px) {
            .navbar-container {
              padding: 0 12px !important;
            }

            .navbar-logo {
              width: auto !important;
            }

            .navbar-auth {
              width: auto !important;
            }
          }
        `
      }} />
      
      <nav className="fixed top-0 left-0 right-0 z-50 mt-5 px-5">
        <div className="navbar-container w-full h-[70px] backdrop-blur-md border border-white/30 rounded-2xl shadow-lg px-5 py-0 flex items-center relative" style={{backgroundColor: '#2C3E50CC'}}>
          
          {/* Hamburger Menu (Mobile) - Left Side */}
          <div 
            className={`hamburger ${isMobileMenuOpen ? 'active' : ''} absolute left-5 lg:relative`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>

          {/* Logo - Left Side */}
          <div className="navbar-logo flex items-center space-x-3">
            <img 
              src="/images/EYEEXAM-Logo.png" 
              alt="Eye Exam Logo" 
              className="h-10 w-auto"
            />
          </div>

          {/* Navigation Links - Centered (Hidden on mobile) */}
          <div className="nav-link-container flex items-center space-x-8 flex-1 justify-center">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `nav-link pb-1 transition-colors ${isActive ? 'active' : ''}`
              } 
              data-text="Beranda" 
              style={{color: '#F7FAFC'}}
            >
              Beranda
            </NavLink>
            
            <NavLink 
              to="/detection" 
              className={({ isActive }) => 
                `nav-link pb-1 transition-colors ${isActive ? 'active' : ''}`
              } 
              data-text="Deteksi YOLO" 
              style={{color: '#F7FAFC'}}
            >
              Deteksi YOLO
            </NavLink>
            
            <NavLink 
              to="/history" 
              className={({ isActive }) => 
                `nav-link pb-1 transition-colors ${isActive ? 'active' : ''}`
              } 
              data-text="Histori" 
              style={{color: '#F7FAFC'}}
            >
              Histori
            </NavLink>
            
            <NavLink 
              to="/articles" 
              className={({ isActive }) => 
                `nav-link pb-1 transition-colors ${isActive ? 'active' : ''}`
              } 
              data-text="Artikel" 
              style={{color: '#F7FAFC'}}
            >
              Artikel
            </NavLink>
            
            <NavLink 
              to="/about" 
              className={({ isActive }) => 
                `nav-link pb-1 transition-colors ${isActive ? 'active' : ''}`
              } 
              data-text="Tentang Kami" 
              style={{color: '#F7FAFC'}}
            >
              Tentang Kami
            </NavLink>
          </div>

          {/* Auth Section - Profile Icon (Desktop Only) */}
          <div className="navbar-auth navbar-profile-section flex items-center justify-end ml-auto">
            {user ? (
              /* User Profile - Fixed container dengan text dari kanan */
              <div className="w-full max-w-[180px]">
                <NavLink
                  to="/profile"
                  className="flex items-center justify-end space-x-2 px-3 py-2 rounded-lg w-full"
                >
                  <div className="text-right hidden sm:block min-w-0 flex-1">
                    <div 
                      className="text-sm font-medium text-white"
                      style={{ 
                        direction: 'rtl',
                        textAlign: 'right',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {displayName}
                    </div>
                  </div>
                  <img
                    src={displayImage}
                    alt="Profile"
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                </NavLink>
              </div>
            ) : (
              /* Login/Register Buttons */
              <div className="flex items-center space-x-3">
                <NavLink 
                  to="/login"
                  className="px-6 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: '#3B82F6',
                    color: '#F7FAFC'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#2563EB'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#3B82F6'}
                >
                  Masuk
                </NavLink>
                
                <NavLink 
                  to="/register"
                  className="px-6 py-2 rounded-lg font-medium transition-colors border"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#F7FAFC',
                    borderColor: '#F7FAFC'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#F7FAFC';
                    (e.target as HTMLElement).style.color = '#2C3E50';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    (e.target as HTMLElement).style.color = '#F7FAFC';
                  }}
                >
                  Daftar
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sidebar Menu */}
        <div className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}></div>
        
        <div className={`mobile-sidebar ${isMobileMenuOpen ? 'active' : ''}`}>
          {/* Profile Section */}
          {user && (
            <>
              <div className="sidebar-profile">
                <img 
                  src={displayImage} 
                  alt="Profile"
                />
                <div className="sidebar-profile-info">
                  <div className="sidebar-profile-name">{displayName}</div>
                  <div className="sidebar-profile-email">{user?.email}</div>
                </div>
              </div>
              <div className="sidebar-divider"></div>
            </>
          )}

          {/* Menu Items */}
          <div className="sidebar-menu">
            <NavLink 
              to="/" 
              className={({ isActive }) => `${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Beranda
            </NavLink>
            
            <NavLink 
              to="/detection" 
              className={({ isActive }) => `${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Deteksi YOLO
            </NavLink>
            
            <NavLink 
              to="/history" 
              className={({ isActive }) => `${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Histori
            </NavLink>
            
            <NavLink 
              to="/articles" 
              className={({ isActive }) => `${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Artikel
            </NavLink>
            
            <NavLink 
              to="/about" 
              className={({ isActive }) => `${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Tentang Kami
            </NavLink>
          </div>

          {/* Footer */}
          <div className="sidebar-footer">
            {user ? (
              <NavLink 
                to="/profile"
                className=""
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  color: '#F7FAFC',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  textAlign: 'center'
                }}
              >
                Edit Profil
              </NavLink>
            ) : (
              <>
                <NavLink 
                  to="/login"
                  className="login-btn"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Masuk
                </NavLink>
                <NavLink 
                  to="/register"
                  className="register-btn"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Daftar
                </NavLink>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}