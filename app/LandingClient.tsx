'use client';

import { useEffect, useState } from 'react';
import './landing.css';

const SLIDES = [
  {
    src: '/desa_slide_1.jpg',
    caption: 'SELAMAT DATANG DI LAMAN INFORMASI\nDESA REMAU BAKO TUO',
    sub: 'Laman ini merupakan pengembangan Sistem Informasi Desa untuk menampilkan layanan publik dan meningkatkan peran masyarakat dalam mendukung program pembangunan desa yang lebih partisipatif dan berkelanjutan',
  },
  {
    src: '/desa_slide_2.jpg',
    caption: 'SELAMAT DATANG DI LAMAN INFORMASI\nDESA REMAU BAKO TUO',
    sub: 'Laman ini merupakan pengembangan Sistem Informasi Desa untuk menampilkan layanan publik dan meningkatkan peran masyarakat dalam mendukung program pembangunan desa yang lebih partisipatif dan berkelanjutan',
  },
  {
    src: '/desa_slide_3.jpg',
    caption: 'SELAMAT DATANG DI LAMAN INFORMASI\nDESA REMAU BAKO TUO',
    sub: 'Laman ini merupakan pengembangan Sistem Informasi Desa untuk menampilkan layanan publik dan meningkatkan peran masyarakat dalam mendukung program pembangunan desa yang lebih partisipatif dan berkelanjutan',
  },
  {
    src: '/desa_slide_4.jpg',
    caption: 'SELAMAT DATANG DI LAMAN INFORMASI\nDESA REMAU BAKO TUO',
    sub: 'Laman ini merupakan pengembangan Sistem Informasi Desa untuk menampilkan layanan publik dan meningkatkan peran masyarakat dalam mendukung program pembangunan desa yang lebih partisipatif dan berkelanjutan',
  },
];

/* ── Menu items drawer ──
   Literasi  → tab Indeks      (?tab=indeks)
   Ekonomi   → tab Pembangunan (?tab=pembangunan)
   Layanan   → tab Profil      (?tab=profil)
   Login     → /dashboard
*/


export default function LandingClient() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  // Auto-advance slideshow every 5 seconds
  useEffect(() => {
    const timer = setInterval(goNext, 5000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const goToIndex = (i: number) => {
    if (i === current) return;
    setFade(false);
    setTimeout(() => { setCurrent(i); setFade(true); }, 350);
  };

  const goNext = () => {
    setFade(false);
    setTimeout(() => { setCurrent(prev => (prev + 1) % SLIDES.length); setFade(true); }, 350);
  };

  const goPrev = () => {
    setFade(false);
    setTimeout(() => { setCurrent(prev => (prev - 1 + SLIDES.length) % SLIDES.length); setFade(true); }, 350);
  };

  return (
    <div className="landing-root">

      {/* ══ HEADER ══ */}
      <header className="land-header">
        <div className="land-header-inner">

          {/* Logo + Nama Desa */}
          <a href="/" className="land-brand">
            <img
              src="https://desaremaubakotuo.netlify.app/lovable-uploads/logo-desa.png"
              alt="Logo Desa Remau Bako Tuo"
              className="land-brand-logo"
            />
            <div className="land-brand-text">
              <span className="land-brand-title">Desa Remau Bako Tuo</span>
              <span className="land-brand-sub">Kabupaten Tanjung Jabung Timur</span>
            </div>
          </a>

          {/* Hamburger — Buka menu drawer */}
          <button
            className="bg-transparent hover:bg-white/10 w-8 h-8 md:w-9 md:h-9 rounded-md flex items-center justify-center transition-all duration-200 text-white border-none cursor-pointer outline-none hover:scale-105 active:scale-95"
            onClick={() => (window as any).__openGlobalDrawer?.()}
            aria-label="Buka menu navigasi"
          >
            <i className="fas fa-bars text-[15px] md:text-[17px]"></i>
          </button>
        </div>
      </header>



      {/* ══ FULLSCREEN SLIDESHOW ══ */}
      <div className="slideshow-container">
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`slide-item ${i === current ? 'slide-active' : ''}`}
            style={{ backgroundImage: `url(${slide.src})` }}
          />
        ))}
        <div className="slide-overlay" />

        <div className={`slide-caption ${fade ? 'slide-caption-visible' : ''}`}>
          <div className="slide-caption-title" style={{ whiteSpace: 'pre-line' }}>{SLIDES[current].caption}</div>
          <div className="slide-caption-sub" style={{ whiteSpace: 'pre-line' }}>{SLIDES[current].sub}</div>
        </div>

        <button className="slide-arrow slide-arrow-left" onClick={goPrev} aria-label="Sebelumnya">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="slide-arrow slide-arrow-right" onClick={goNext} aria-label="Berikutnya">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>


      </div>

      <div className="map-watermark">DESA REMAU BAKO TUO • JAMBI</div>
    </div>
  );
}
