'use client';

import { useEffect, useState } from 'react';
import './landing.css';

const SLIDES = [
  {
    src: '/desa_slide_1.jpg',
    caption: 'Pemandangan Alam Desa',
    sub: 'Hamparan sawah dan sungai yang asri',
  },
  {
    src: '/desa_slide_2.jpg',
    caption: 'Kehidupan Masyarakat',
    sub: 'Kebersamaan warga Desa Remau Bako Tuo',
  },
  {
    src: '/desa_slide_3.jpg',
    caption: 'Panorama dari Udara',
    sub: 'Keindahan desa dari ketinggian',
  },
  {
    src: '/desa_slide_4.jpg',
    caption: 'Masjid Desa',
    sub: 'Pusat spiritual masyarakat desa',
  },
];

export default function LandingClient() {
  const [current, setCurrent] = useState(0);
  const [fade, setFade] = useState(true);

  // Auto-advance every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      goTo((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (indexOrUpdater: number | ((prev: number) => number)) => {
    setFade(false);
    setTimeout(() => {
      setCurrent(indexOrUpdater as any);
      setFade(true);
    }, 350);
  };

  const goToIndex = (i: number) => {
    if (i === current) return;
    setFade(false);
    setTimeout(() => {
      setCurrent(i);
      setFade(true);
    }, 350);
  };

  const prev = () => goToIndex((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goToIndex((current + 1) % SLIDES.length);

  return (
    <div className="landing-root">
      {/* ── Fullscreen Slideshow ── */}
      <div className="slideshow-container">
        {SLIDES.map((slide, i) => (
          <div
            key={i}
            className={`slide-item ${i === current ? 'slide-active' : ''}`}
            style={{ backgroundImage: `url(${slide.src})` }}
          />
        ))}

        {/* Dark gradient overlay */}
        <div className="slide-overlay" />

        {/* Caption */}
        <div className={`slide-caption ${fade ? 'slide-caption-visible' : ''}`}>
          <div className="slide-caption-title">{SLIDES[current].caption}</div>
          <div className="slide-caption-sub">{SLIDES[current].sub}</div>
        </div>

        {/* Arrows */}
        <button className="slide-arrow slide-arrow-left" onClick={prev} aria-label="Sebelumnya">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button className="slide-arrow slide-arrow-right" onClick={next} aria-label="Berikutnya">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Dots */}
        <div className="slide-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`slide-dot ${i === current ? 'slide-dot-active' : ''}`}
              onClick={() => goToIndex(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── Dark header ── */}
      <header className="map-header">
        <div className="map-header-content">
          <img src="https://desaremaubakotuo.netlify.app/lovable-uploads/logo-desa.png" alt="Logo Desa Remau Bako Tuo" className="map-header-logo" />
          <div className="map-header-text">
            <div className="map-header-title">DESA REMAU BAKO TUO</div>
            <div className="map-header-subtitle">KABUPATEN TANJUNG JABUNG TIMUR</div>
          </div>
        </div>
        <a href="/dashboard" className="map-header-btn" title="Buka Dashboard">
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </a>
      </header>

      {/* ── Watermark ── */}
      <div className="map-watermark">DESA REMAU BAKO TUO • JAMBI</div>
    </div>
  );
}
