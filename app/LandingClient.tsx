'use client';

import { useEffect, useRef } from 'react';
import './landing.css';

export default function LandingClient() {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const initMap = () => {
      const L = (window as any).L;
      if (!L) return;

      const map = L.map(mapRef.current, {
        center: [-1.2182621315578288, 104.35172172755148], // Desa Remau Bako Tuo
        zoom: 13,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Esri, Maxar, Earthstar Geographics',
          maxZoom: 19,
        }
      ).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      const makeIcon = (bg: string, emoji: string) =>
        L.divIcon({
          className: '',
          html: `<div style="background:${bg};width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;font-size:15px;box-shadow:0 2px 10px rgba(0,0,0,.45)">${emoji}</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

      L.marker([-1.2182621315578288, 104.35172172755148], { icon: makeIcon('#16a34a', '🏠') })
        .bindPopup('<b>Kantor Desa Remau Bako Tuo</b><br>Pusat pemerintahan desa').addTo(map);
      L.marker([-1.2165, 104.3535], { icon: makeIcon('#dc2626', '🕌') })
        .bindPopup('<b>Masjid Al-Ikhlas</b><br>Tempat ibadah utama').addTo(map);
      L.marker([-1.2200, 104.3490], { icon: makeIcon('#d97706', '🏥') })
        .bindPopup('<b>Puskesmas Desa</b><br>Layanan kesehatan masyarakat').addTo(map);
      L.marker([-1.2210, 104.3555], { icon: makeIcon('#7c3aed', '🏫') })
        .bindPopup('<b>SD Negeri 1</b><br>Sekolah dasar negeri').addTo(map);

      leafletMapRef.current = map;
    };

    if ((window as any).L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, []);

  const goToDashboard = (_tabId: string) => {}; // handled by global BottomNav

  return (
    <div className="landing-root">
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

      {/* ── Fullscreen satellite map ── */}
      <div ref={mapRef} className="map-fullscreen" />

      {/* ── Map watermark ── */}
      <div className="map-watermark">JARINGAN SPATIAL SOCIETY</div>

    </div>
  );
}
