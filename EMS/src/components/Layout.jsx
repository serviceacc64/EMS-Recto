import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

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
    <div className="flex flex-col md:flex-row min-h-screen md:h-screen h-auto bg-transparent text-text-main overflow-auto md:overflow-hidden relative transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 min-w-0 md:h-screen h-auto flex flex-col overflow-visible md:overflow-hidden relative">
        <div ref={scrollContainerRef} className="flex-1 min-h-0 p-6 md:p-8 bg-transparent overflow-auto">
          <Header />
          <Outlet />
        </div>
        
        {/* Scroll to Top Button */}
        <button
          onClick={scrollToTop}
          className={`absolute bottom-8 right-8 flex items-center justify-center w-12 h-12 rounded-full bg-accent text-accent-text shadow-[0_4px_14px_rgba(var(--color-accent),0.4)] transition-all duration-300 z-50 hover:bg-accent-hover hover:scale-105 hover:shadow-[0_6px_20px_rgba(var(--color-accent),0.6)] ${
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
