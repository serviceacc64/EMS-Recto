import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Evaluate scroll position
          if (container.scrollTop > 300) {
            setShowScrollTop(true);
          } else {
            setShowScrollTop(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen h-auto bg-transparent text-[#0f172a] overflow-auto md:overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 min-w-0 md:h-screen h-auto flex flex-col overflow-visible md:overflow-hidden relative">
        <div ref={scrollContainerRef} className="flex-1 min-h-0 p-6 md:p-8 bg-transparent overflow-auto">
          <Outlet />
        </div>
        
        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className={`absolute bottom-8 right-8 flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 z-50 hover:bg-blue-700 hover:shadow-xl ${
            showScrollTop ? 'opacity-100 translate-y-0 cursor-pointer' : 'opacity-0 translate-y-8 pointer-events-none'
          }`}
          title="Scroll to Top"
        >
          <i className="fas fa-arrow-up text-[18px]"></i>
        </button>
      </main>
    </div>
  );
};

export default Layout;
