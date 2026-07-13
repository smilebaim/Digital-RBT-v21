'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLoading from './components/DashboardLoading';
import {
  DASHBOARD_EVENTS,
  isDashboardInitComplete,
  waitForDashboardInit,
  type DashboardLoadingItem,
  type LoadingItemStatus,
} from './lib/dashboard-bridge';
import { ensureDashboardScripts, installDashboardStubs } from './lib/load-dashboard-scripts';
import { getInternalTabFromUrl } from './lib/dashboard-tabs';
import './dashboard.css';

const HTML_CONTENT = `
  <!-- Toast Container -->
  <div id="toastContainer"></div>

  <!-- Mobile Menu Overlay (legacy, hidden) -->
  <div id="mobileMenuOverlay" class="mobile-menu-overlay" onclick="toggleMobileMenu()" style="display: none !important;"></div>

  <!-- Mobile Menu Drawer (legacy, hidden) -->
  <div id="mobileMenuDrawer" class="mobile-menu-drawer" style="display: none !important;">
    <div class="mobile-menu-drawer-header">
      <span class="font-semibold">Menu</span>
      <button onclick="toggleMobileMenu()" class="p-1 hover:bg-white/20 rounded">
        <i class="fas fa-times text-lg"></i>
      </button>
    </div>
    <div class="mobile-menu-drawer-body">
      <div class="mb-4">
        <p class="text-xs text-gray-500 mb-2 px-1">Navigasi</p>
        <div class="mobile-menu-item active" onclick="switchTabMobile('dampak')">
          <i class="fas fa-id-card"></i>
          <span>Profil</span>
        </div>
        <div class="mobile-menu-item" onclick="switchTabMobile('peta-operasi')">
          <i class="fas fa-map-marked-alt"></i>
          <span>Peta</span>
        </div>
        <div class="mobile-menu-item" onclick="switchTabMobile('pengungsi')">
          <i class="fas fa-hammer"></i>
          <span>Program</span>
        </div>
        <div class="mobile-menu-item" onclick="switchTabMobile('pengungsi')">
          <i class="fas fa-wallet"></i>
          <span>Dana Desa</span>
        </div>
        <div class="mobile-menu-item" onclick="switchTabMobile('bantuan')">
          <i class="fas fa-chart-line"></i>
          <span>Indeks</span>
        </div>
      </div>
      <div class="border-t pt-4">
        <p class="text-xs text-gray-500 mb-2 px-1">Update Terakhir</p>
        <div class="px-1 text-sm font-medium text-gray-700" id="lastUpdateMobile">-</div>
      </div>
    </div>
  </div>

  <!-- Header -->
  <header
    class="text-gray-800 shadow-[0_4px_30px_rgba(0,0,0,0.1)] sticky top-0 z-50 border-b border-white/50" style="background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(16px) saturate(180%); -webkit-backdrop-filter: blur(16px) saturate(180%);">
    <div class="container-fluid px-2 md:px-4">
      <div class="flex items-center justify-between h-14 md:h-16">
        <!-- Logo & Title -->
        <a href="/" class="flex items-center gap-2 md:gap-3 min-w-0 flex-1 hover:opacity-90 transition-opacity">
          <img src="https://desaremaubakotuo.netlify.app/lovable-uploads/logo-desa.png" alt="Logo Desa Remau Bako Tuo" class="h-10 md:h-12 w-auto flex-shrink-0">
          <div class="min-w-0">
            <h1 class="text-[15px] md:text-xl font-normal truncate text-black">Desa Remau Bako Tuo</h1>
            <p class="text-[11.5px] md:text-sm font-normal text-black block">Kabupaten Tanjung Jabung Timur</p>
          </div>
        </a>

        <!-- Menu Navigation (Desktop) -->
        <nav class="hidden lg:flex items-center gap-2">
          <!-- Menu items jika ada -->
        </nav>

        <!-- Right Actions -->
        <div class="flex items-center gap-2 md:gap-4 flex-shrink-0">
          <div class="text-right hidden sm:block">
            <p class="text-[11px] md:text-xs font-normal text-black">Update Terakhir</p>
            <p id="lastUpdate" class="text-xs md:text-sm font-normal text-black">-</p>
          </div>
          <button onclick="refreshData()" class="bg-transparent hover:bg-black/5 text-black w-8 h-8 md:w-9 md:h-9 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            title="Refresh Data">
            <i class="fas fa-sync-alt text-[15px] md:text-[17px]"></i>
          </button>
          <!-- Hamburger button — opens global React drawer -->
          <button
            onclick="if(window.__openGlobalDrawer) window.__openGlobalDrawer();"
            class="bg-transparent hover:bg-black/5 text-black w-8 h-8 md:w-9 md:h-9 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            title="Menu"
            aria-label="Buka menu">
            <i class="fas fa-bars text-[15px] md:text-[17px]"></i>
          </button>
          <!-- Mobile Menu Button (legacy, hidden) -->
          <button id="mobileMenuBtn" onclick="toggleMobileMenu()"
            class="md:hidden bg-transparent hover:bg-black/5 text-black p-1.5 rounded-lg transition" style="display: none !important">
            <i class="fas fa-bars text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Tab Bar (hidden — replaced by global BottomNav) -->
  <div class="bg-white shadow-sm border-b sticky top-14 md:top-16 z-40" style="display: none !important;">
    <div class="container-fluid px-2 md:px-4">
      <div
        class="flex items-center justify-between md:justify-start gap-0 md:gap-1 overflow-x-auto py-1 scrollbar-hide">
        <button onclick="switchTab('dampak')" id="tab-dampak"
          class="tab-btn active flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium text-gray-600 hover:text-primary-600 whitespace-nowrap">
          <i class="fas fa-id-card mr-1 md:mr-2"></i><span class="hidden xs:inline">Profil</span><span
            class="xs:hidden">Profil</span>
        </button>
        <button onclick="switchTab('peta-operasi')" id="tab-peta-operasi"
          class="tab-btn flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium text-gray-600 hover:text-primary-600 whitespace-nowrap">
          <i class="fas fa-map-marked-alt mr-1 md:mr-2"></i><span class="hidden sm:inline">Peta</span><span
            class="sm:hidden">Peta</span>
        </button>
        <button onclick="switchTab('pengungsi')" id="tab-pengungsi"
          class="tab-btn flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium text-gray-600 hover:text-primary-600 whitespace-nowrap">
          <i class="fas fa-hammer mr-1 md:mr-2"></i><span class="hidden xs:inline">Program</span><span
            class="xs:hidden">Program</span>
        </button>
        <button onclick="switchTab('bantuan')" id="tab-bantuan"
          class="tab-btn flex-1 md:flex-none px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium text-gray-600 hover:text-primary-600 whitespace-nowrap">
          <i class="fas fa-chart-line mr-1 md:mr-2"></i><span class="hidden xs:inline">Indeks</span><span
            class="xs:hidden">IDM</span>
        </button>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <main class="container-fluid px-2 md:px-4 py-4">
    <!-- TAB: Profil Desa -->
    <div id="content-dampak" class="tab-content active">
      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
        <div class="kpi-card card-hover cursor-pointer" onclick="focusMapOnCategory('korban', this)"
          title="Klik untuk melihat di peta">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Jumlah Penduduk</p>
              <p id="kpi-korban" class="text-2xl font-bold text-gray-800">-</p>
            </div>
            <div class="bg-primary-100 p-3 rounded-full">
              <i class="fas fa-users text-primary-600"></i>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover cursor-pointer" onclick="focusMapOnCategory('pengungsi', this)"
          title="Klik untuk melihat di peta">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Jumlah KK</p>
              <p id="kpi-pengungsi" class="text-2xl font-bold text-gray-800">-</p>
            </div>
            <div class="bg-orange-100 p-3 rounded-full">
              <i class="fas fa-home text-orange-600"></i>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover cursor-pointer" onclick="focusMapOnCategory('titik', this)"
          title="Klik untuk melihat di peta">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Jumlah Dusun</p>
              <p id="kpi-titik" class="text-2xl font-bold text-gray-800">-</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
              <i class="fas fa-map-pin text-blue-600"></i>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover cursor-pointer" onclick="focusMapOnCategory('rumah', this)"
          title="Klik untuk melihat di peta">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Jumlah RT/RW</p>
              <p id="kpi-rumah" class="text-2xl font-bold text-gray-800">-</p>
            </div>
            <div class="bg-red-100 p-3 rounded-full">
              <i class="fas fa-sitemap text-red-600"></i>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover cursor-pointer" onclick="focusMapOnCategory('sawah', this)"
          title="Klik untuk melihat di peta">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Luas Wilayah (Ha)</p>
              <p id="kpi-sawah" class="text-2xl font-bold text-gray-800">-</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
              <i class="fas fa-map text-green-600"></i>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover cursor-pointer" onclick="focusMapOnCategory('kabupaten', this)"
          title="Klik untuk melihat di peta">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Tahun Berdiri</p>
              <p id="kpi-kabupaten" class="text-2xl font-bold text-gray-800">-</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
              <i class="fas fa-landmark text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Grid: Charts + Map + Info -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 main-grid">
        <!-- Left Panel: Charts -->
        <div class="lg:col-span-1 space-y-4">
          <!-- Status Pie Chart -->
          <div class="panel p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">
              <i class="fas fa-chart-pie text-primary-500 mr-2"></i>Komposisi Penduduk
            </h3>
            <div class="chart-container">
              <canvas id="chartStatusDampak"></canvas>
            </div>
          </div>

          <!-- Top Dusun Bar -->
          <div class="panel p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">
              <i class="fas fa-chart-bar text-primary-500 mr-2"></i>Penduduk per Dusun
            </h3>
            <div class="chart-container" style="height: 200px;">
              <canvas id="chartTopWilayah"></canvas>
            </div>
          </div>
        </div>

        <!-- Center Map -->
        <div class="lg:col-span-2 panel p-0 overflow-hidden map-container-responsive" style="height: 520px;">
          <div id="map" class="h-full w-full"></div>
        </div>

        <!-- Right Panel: Stats & Legend -->
        <div class="lg:col-span-1 space-y-4">
          <!-- Info Dasar Desa -->
          <div class="panel p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">
              <i class="fas fa-info-circle text-primary-500 mr-2"></i>Info Dasar Desa
            </h3>
            <div class="space-y-2" id="quickStats">
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-xs text-gray-500">Tahun Berdiri</span>
                <span id="stat-fasum" class="font-semibold text-gray-800">-</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-xs text-gray-500">Laki-laki</span>
                <span id="stat-kebun" class="font-semibold text-gray-800">-</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-xs text-gray-500">Perempuan</span>
                <span id="stat-tambak" class="font-semibold text-gray-800">-</span>
              </div>
            </div>
          </div>

          <!-- Realisasi Program / Rekap APBDes -->
          <div class="panel p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">
              <i class="fas fa-layer-group text-primary-500 mr-2"></i>Rekap APBDes
            </h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-xs text-gray-500">Dana Desa</span>
                <span id="cluster-total-kerusakan" class="font-semibold text-green-600">-</span>
              </div>
              <div class="flex justify-between items-center py-2 border-b border-gray-100">
                <span class="text-xs text-gray-500">ADD</span>
                <span id="cluster-total-kerugian" class="font-semibold text-blue-600">-</span>
              </div>
              <div class="flex justify-between items-center py-2">
                <span class="text-xs text-gray-500">Total APBDes</span>
                <span id="cluster-total-kerusakan-kerugian" class="font-semibold text-gray-800">-</span>
              </div>
            </div>
            <!-- Per Bidang with Pagination -->
            <div class="mt-3 pt-3 border-t border-gray-100">
              <div class="flex justify-between items-center mb-2">
                <p class="text-xs font-medium text-gray-600">Per Bidang:</p>
                <div class="flex items-center gap-1">
                  <button id="sektor-prev" onclick="changeSektorPage(-1)"
                    class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" disabled>
                    <i class="fas fa-chevron-left text-xs"></i>
                  </button>
                  <span id="sektor-page-info" class="text-xs text-gray-500">1/1</span>
                  <button id="sektor-next" onclick="changeSektorPage(1)"
                    class="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30" disabled>
                    <i class="fas fa-chevron-right text-xs"></i>
                  </button>
                </div>
              </div>
              <div id="cluster-sektor-breakdown" class="space-y-1">
                <div class="text-gray-400 text-center py-1 text-xs">Memuat...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Program Section -->
      <div class="panel p-4 mt-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700">
            <i class="fas fa-hard-hat text-green-500 mr-2"></i>Program Desa
            <span id="pertanian-total"
              class="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">0</span>
          </h3>
          <div class="flex gap-2 text-xs">
            <div class="px-2 py-1 bg-red-50 rounded">
              <span class="text-red-600">Prioritas:</span>
              <span id="pertanian-berat" class="font-bold text-red-700">0</span>
            </div>
            <div class="px-2 py-1 bg-yellow-50 rounded">
              <span class="text-yellow-600">Sedang:</span>
              <span id="pertanian-sedang" class="font-bold text-yellow-700">0</span>
            </div>
            <div class="px-2 py-1 bg-green-50 rounded">
              <span class="text-green-600">Selesai:</span>
              <span id="pertanian-ringan" class="font-bold text-green-700">0</span>
            </div>
          </div>
        </div>
        <div class="overflow-x-auto max-h-64">
          <table class="data-table text-xs w-full">
            <thead>
              <tr class="bg-gray-50">
                <th class="text-left p-2">Nama Program</th>
                <th class="text-left p-2">Kabupaten</th>
                <th class="text-left p-2">Kecamatan</th>
                <th class="text-right p-2">Volume</th>
                <th class="text-right p-2">Anggaran</th>
                <th class="text-center p-2">Status</th>
              </tr>
            </thead>
            <tbody id="tablePertanian">
              <tr>
                <td colspan="6" class="text-center p-4 text-gray-400">Memuat data...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB: Peta Desa -->
    <div id="content-peta-operasi" class="tab-content">
      <!-- Fullscreen Map Container -->
      <div class="map-fullscreen-container panel">
        <!-- Map -->
        <div id="mapOperasi"></div>

        <!-- Right Overlay Cards -->
        <div class="map-overlay-right">
          <!-- Fasilitas Desa -->
          <div class="map-overlay-card">
            <h3><i class="fas fa-hospital text-green-500 mr-1"></i>Fasilitas Kesehatan</h3>
            <div class="grid grid-cols-3 gap-1 text-xs">
              <div class="text-center p-1 bg-green-50 rounded">
                <div class="text-gray-500">Polindes</div>
                <div id="stat-puskesmas" class="font-bold text-green-600">-</div>
              </div>
              <div class="text-center p-1 bg-blue-50 rounded">
                <div class="text-gray-500">Posyandu</div>
                <div id="stat-rsud" class="font-bold text-blue-600">-</div>
              </div>
              <div class="text-center p-1 bg-purple-50 rounded">
                <div class="text-gray-500">Puskesmas</div>
                <div id="stat-fasyankes" class="font-bold text-purple-600">-</div>
              </div>
            </div>
          </div>

          <!-- Infrastruktur Status -->
          <div class="map-overlay-card">
            <h3><i class="fas fa-tools text-red-500 mr-1"></i>Status Infrastruktur</h3>
            <div class="flex gap-1 text-xs">
              <div class="flex-1 text-center p-1 bg-red-50 rounded">
                <div class="text-red-600 text-[10px]">Kritis</div>
                <div id="jaringan-critical" class="font-bold text-red-700">-</div>
              </div>
              <div class="flex-1 text-center p-1 bg-yellow-50 rounded">
                <div class="text-yellow-600 text-[10px]">Perhatian</div>
                <div id="jaringan-warning" class="font-bold text-yellow-700">-</div>
              </div>
              <div class="flex-1 text-center p-1 bg-green-50 rounded">
                <div class="text-green-600 text-[10px]">Baik</div>
                <div id="jaringan-normal" class="font-bold text-green-700">-</div>
              </div>
            </div>
          </div>

          <!-- Titik Penting -->
          <div class="map-overlay-card">
            <h3><i class="fas fa-map-marker-alt text-indigo-500 mr-1"></i>Titik Penting Desa</h3>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-gray-500">Total Titik</span>
                <span id="posko-total" class="font-bold text-indigo-600">-</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500">Fasilitas Publik</span>
                <span id="posko-pengungsi-total" class="font-bold text-indigo-600">-</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500">Pos Layanan</span>
                <span id="posko-titik-pengungsian" class="font-bold text-indigo-600">-</span>
              </div>
            </div>
          </div>

          <!-- Legend Compact -->
          <div class="map-overlay-card">
            <h3><i class="fas fa-info-circle text-primary-500 mr-1"></i>Legenda</h3>
            <div class="grid grid-cols-2 gap-1 text-xs">
              <div class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                <span>Kritis</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span>Perhatian</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>Sedang</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                <span>Baik</span>
              </div>
            </div>
            <div class="mt-1 pt-1 border-t text-[10px] text-gray-500">
              <div>Status kondisi infrastruktur desa</div>
            </div>
          </div>
        </div>

        <!-- Bottom Right: Layer Controls -->
        <div class="map-overlay-bottom-right">
          <div class="layer-control-toggle" onclick="toggleLayerControl()">
            <span><i class="fas fa-layer-group mr-1"></i>Layer & Filter</span>
            <i id="layer-control-icon" class="fas fa-chevron-up"></i>
          </div>
          <div id="layer-control-content" class="layer-control-content expanded">
            <div class="layer-control-panel">
              <!-- Layer Toggles -->
              <div class="layer-title">LAYER:</div>
              <div class="layer-items mb-2">
                <label
                  class="inline-flex items-center gap-1 px-1.5 py-1 bg-green-50 border border-green-200 rounded cursor-pointer hover:bg-green-100">
                  <input type="checkbox" id="layer-faskes" checked onchange="toggleFaskesLayer()"
                    class="w-3 h-3 accent-green-600">
                  <i class="fas fa-hospital text-green-600 text-xs"></i>
                  <span id="stat-faskes-total" class="text-xs font-bold text-green-700">-</span>
                </label>
                <label
                  class="inline-flex items-center gap-1 px-1.5 py-1 bg-yellow-50 border border-yellow-200 rounded cursor-pointer hover:bg-yellow-100">
                  <input type="checkbox" id="layer-banlog" onchange="toggleLayer('banlog')"
                    class="w-3 h-3 accent-yellow-600">
                  <i class="fas fa-star text-yellow-600 text-xs"></i>
                  <span id="stat-banlog" class="text-xs font-bold text-yellow-700">-</span>
                </label>
                <label
                  class="inline-flex items-center gap-1 px-1.5 py-1 bg-red-50 border border-red-200 rounded cursor-pointer hover:bg-red-100">
                  <input type="checkbox" id="layer-jaringan" onchange="toggleLayer('jaringan')"
                    class="w-3 h-3 accent-red-600">
                  <i class="fas fa-tools text-red-600 text-xs"></i>
                  <span id="stat-jaringan" class="text-xs font-bold text-red-700">-</span>
                </label>
                <label
                  class="inline-flex items-center gap-1 px-1.5 py-1 bg-pink-50 border border-pink-200 rounded cursor-pointer hover:bg-pink-100">
                  <input type="checkbox" id="layer-cluster6" onchange="toggleLayer('cluster6')"
                    class="w-3 h-3 accent-pink-600">
                  <i class="fas fa-chart-line text-pink-600 text-xs"></i>
                  <span id="stat-cluster6" class="text-xs font-bold text-pink-700">-</span>
                </label>
                <label
                  class="inline-flex items-center gap-1 px-1.5 py-1 bg-indigo-50 border border-indigo-200 rounded cursor-pointer hover:bg-indigo-100">
                  <input type="checkbox" id="layer-posko" onchange="toggleLayer('posko')"
                    class="w-3 h-3 accent-indigo-600">
                  <i class="fas fa-map-marker-alt text-indigo-600 text-xs"></i>
                  <span id="stat-posko" class="text-xs font-bold text-indigo-700">-</span>
                </label>
                <label
                  class="inline-flex items-center gap-1 px-1.5 py-1 bg-amber-50 border border-amber-200 rounded cursor-pointer hover:bg-amber-100">
                  <input type="checkbox" id="layer-tenda" onchange="toggleLayer('tenda')"
                    class="w-3 h-3 accent-amber-600">
                  <i class="fas fa-tents text-amber-600 text-xs"></i>
                  <span id="stat-tenda" class="text-xs font-bold text-amber-700">-</span>
                </label>
                <label
                  class="inline-flex items-center gap-1 px-1.5 py-1 bg-cyan-50 border border-cyan-200 rounded cursor-pointer hover:bg-cyan-100">
                  <input type="checkbox" id="layer-faspublik" onchange="toggleLayer('faspublik')"
                    class="w-3 h-3 accent-cyan-600">
                  <i class="fas fa-building-flag text-cyan-600 text-xs"></i>
                  <span id="stat-faspublik" class="text-xs font-bold text-cyan-700">-</span>
                </label>
                <label
                  class="inline-flex items-center gap-1 px-1.5 py-1 bg-violet-50 border border-violet-200 rounded cursor-pointer hover:bg-violet-100">
                  <input type="checkbox" id="layer-polygon" onchange="togglePolygonLayer()"
                    class="w-3 h-3 accent-violet-600" checked>
                  <i class="fas fa-draw-polygon text-violet-600 text-xs"></i>
                  <span id="stat-polygon" class="text-xs font-bold text-violet-700">-</span>
                </label>
              </div>

              <!-- Filters -->
              <div class="layer-title">FILTER:</div>
              <div class="flex flex-wrap gap-1 mb-2">
                <select id="filterKabupaten" onchange="applyFilter()" class="text-xs border rounded px-1.5 py-1 flex-1">
                  <option value="">Semua Dusun</option>
                </select>
                <select id="filterStatus" onchange="applyFilter()" class="text-xs border rounded px-1.5 py-1">
                  <option value="">Semua Status</option>
                  <option value="critical">Kritis</option>
                  <option value="warning">Perlu Perhatian</option>
                  <option value="normal">Baik</option>
                </select>
                <button onclick="resetFilters()" class="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">
                  <i class="fas fa-redo text-gray-500"></i>
                </button>
              </div>

              <!-- IDM Filters -->
              <div id="cluster6-filters" class="mb-2" style="display: none;">
                <div class="layer-title text-pink-600">IDM FILTER:</div>
                <div class="flex flex-wrap gap-1">
                  <select id="filterSektor" onchange="applyCluster6Filter()"
                    class="text-xs border border-pink-200 rounded px-1.5 py-1 flex-1">
                    <option value="">Semua Dimensi</option>
                  </select>
                  <select id="filterSubSektor" onchange="applyCluster6Filter()"
                    class="text-xs border border-pink-200 rounded px-1.5 py-1 flex-1">
                    <option value="">Semua Indikator</option>
                  </select>
                </div>
              </div>

              <!-- Polygon Controls -->
              <div id="polygon-controls" style="display: flex; flex-wrap: wrap;">
                <div class="layer-title text-violet-600">WILAYAH:</div>
                <div class="flex flex-wrap gap-1">
                  <select id="polygon-level" onchange="changePolygonLevel(this.value)"
                    class="text-xs border border-violet-200 rounded px-1.5 py-1">
                    <option value="2" selected>Kabupaten/Kota</option>
                    <option value="3">Kecamatan</option>
                    <option value="4">Desa/Kelurahan</option>
                  </select>
                  <div class="relative flex-1">
                    <input type="text" id="polygon-search-input" placeholder="Cari wilayah..."
                      class="text-xs border border-violet-200 rounded px-2 py-1 w-full" onkeyup="searchPolygon()"
                      autocomplete="off">
                    <div id="polygon-search-results"
                      class="absolute top-full left-0 w-full bg-white border border-violet-200 rounded-b shadow-lg z-50 max-h-48 overflow-y-auto"
                      style="display: none;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: Program (Dana Desa) -->
    <div id="content-pengungsi" class="tab-content">
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div class="kpi-card card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Total APBDes</p>
              <p id="kpi-penduduk" class="text-2xl font-bold text-gray-800">-</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
              <i class="fas fa-piggy-bank text-blue-600"></i>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Dana Desa (DD)</p>
              <p id="kpi-kk" class="text-2xl font-bold text-gray-800">-</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
              <i class="fas fa-money-bill-wave text-green-600"></i>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">Alokasi Dana Desa</p>
              <p id="kpi-disabilitas" class="text-2xl font-bold text-gray-800">-</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
              <i class="fas fa-donate text-purple-600"></i>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 mb-1">PAD Desa</p>
              <p id="kpi-pengungsi-tab" class="text-2xl font-bold text-gray-800">-</p>
            </div>
            <div class="bg-orange-100 p-3 rounded-full">
              <i class="fas fa-hand-holding-usd text-orange-600"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div class="panel p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">
            <i class="fas fa-star text-yellow-500 mr-2"></i>Program Unggulan
            <span id="orangHilang-total"
              class="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">0</span>
          </h3>
          <!-- Summary Stats -->
          <div class="flex gap-2 mb-3">
            <div class="flex-1 text-center p-2 bg-yellow-50 rounded">
              <div class="text-xs text-yellow-600">Berjalan</div>
              <div id="orangHilang-ongoing" class="font-bold text-yellow-700">0</div>
            </div>
            <div class="flex-1 text-center p-2 bg-green-50 rounded">
              <div class="text-xs text-green-600">Selesai</div>
              <div id="orangHilang-found" class="font-bold text-green-700">0</div>
            </div>
          </div>
          <!-- Slider Container -->
          <div class="relative" style="height: 180px;">
            <div id="orangHilang-slider" class="overflow-hidden h-full">
              <div id="orangHilang-cards" class="flex transition-transform duration-300 h-full">
                <div class="flex-shrink-0 w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  <i class="fas fa-spinner fa-spin mr-2"></i>Memuat data...
                </div>
              </div>
            </div>
            <button id="orangHilang-prev" onclick="slideOrangHilang(-1)"
              class="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 z-10 disabled:opacity-30"
              disabled>
              <i class="fas fa-chevron-left text-gray-600"></i>
            </button>
            <button id="orangHilang-next" onclick="slideOrangHilang(1)"
              class="absolute right-0 top-1/2 -translate-y-1/2 -mr-2 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100 z-10 disabled:opacity-30"
              disabled>
              <i class="fas fa-chevron-right text-gray-600"></i>
            </button>
            <div id="orangHilang-dots" class="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1"></div>
          </div>
        </div>
        <div class="panel p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">
            <i class="fas fa-chart-pie text-primary-500 mr-2"></i>Anggaran per Bidang
          </h3>
          <div class="chart-container" style="height: 250px;">
            <canvas id="chartDisabilitas"></canvas>
          </div>
        </div>
        <div class="panel p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">
            <i class="fas fa-chart-bar text-primary-500 mr-2"></i>Realisasi Anggaran
          </h3>
          <div class="chart-container" style="height: 250px;">
            <canvas id="chartKK"></canvas>
          </div>
        </div>
      </div>

      <!-- Map + Table -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="panel map-container-responsive" style="height: 400px;">
          <div id="mapPengungsi" class="h-full"></div>
        </div>
        <div class="panel p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">
            <i class="fas fa-table text-primary-500 mr-2"></i>Rincian APBDes
          </h3>
          <div class="overflow-x-auto max-h-80">
            <table class="data-table text-sm">
              <thead>
                <tr class="bg-gray-50">
                  <th class="text-left p-3">Bidang Program</th>
                  <th class="text-right p-3">Pagu</th>
                  <th class="text-right p-3">Realisasi</th>
                  <th class="text-right p-3">Sisa</th>
                </tr>
              </thead>
              <tbody id="tablePengungsi">
                <!-- Data rows -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: Indeks (IDM) -->
    <div id="content-bantuan" class="tab-content">
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div class="kpi-card card-hover">
          <div class="flex items-center gap-3">
            <div class="bg-primary-100 p-3 rounded-full">
              <i class="fas fa-chart-line text-primary-600"></i>
            </div>
            <div>
              <p class="text-xs text-gray-500">Skor IDM 2024</p>
              <p id="kpi-desa" class="text-xl font-bold">-</p>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover">
          <div class="flex items-center gap-3">
            <div class="bg-yellow-100 p-3 rounded-full">
              <i class="fas fa-star text-yellow-600"></i>
            </div>
            <div>
              <p class="text-xs text-gray-500">Status Maju</p>
              <p id="kpi-kuning" class="text-xl font-bold text-yellow-600">-</p>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover">
          <div class="flex items-center gap-3">
            <div class="bg-blue-100 p-3 rounded-full">
              <i class="fas fa-seedling text-blue-600"></i>
            </div>
            <div>
              <p class="text-xs text-gray-500">Berkembang</p>
              <p id="kpi-biru" class="text-xl font-bold text-blue-600">-</p>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover">
          <div class="flex items-center gap-3">
            <div class="bg-gray-200 p-3 rounded-full">
              <i class="fas fa-pause-circle text-gray-600"></i>
            </div>
            <div>
              <p class="text-xs text-gray-500">Tertinggal</p>
              <p id="kpi-abu" class="text-xl font-bold text-gray-600">-</p>
            </div>
          </div>
        </div>
        <div class="kpi-card card-hover">
          <div class="flex items-center gap-3">
            <div class="bg-white border-2 p-3 rounded-full">
              <i class="fas fa-hourglass-start text-gray-400"></i>
            </div>
            <div>
              <p class="text-xs text-gray-500">Sangat Tertinggal</p>
              <p id="kpi-putih" class="text-xl font-bold">-</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div class="panel p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">
            <i class="fas fa-chart-pie text-primary-500 mr-2"></i>Status Indikator IDM
          </h3>
          <div class="chart-container" style="height: 250px;">
            <canvas id="chartBantuanStatus"></canvas>
          </div>
        </div>
        <div class="panel p-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">
            <i class="fas fa-chart-bar text-primary-500 mr-2"></i>Skor IKS, IKE, IKL
          </h3>
          <div class="chart-container" style="height: 250px;">
            <canvas id="chartBantuanKab"></canvas>
          </div>
        </div>
      </div>

      <!-- Map + Table -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="panel map-container-responsive" style="height: 400px;">
          <div id="mapBantuan" class="h-full"></div>
        </div>
        <div class="space-y-4">
          <!-- Tabel Historis -->
          <div class="panel p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">
              <i class="fas fa-history text-primary-500 mr-2"></i>Tabel Historis Dimensi IDM
            </h3>
            <div class="overflow-x-auto">
              <table class="data-table text-sm w-full">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="text-left p-3">Dimensi</th>
                    <th class="text-center p-3">Tahun Lalu</th>
                    <th class="text-center p-3">Tahun Ini</th>
                    <th class="text-center p-3">Tren YoY</th>
                  </tr>
                </thead>
                <tbody id="tableBantuanHistoris">
                  <!-- Data rows -->
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Rincian Indikator -->
          <div class="panel p-4">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">
              <i class="fas fa-table text-primary-500 mr-2"></i>Rincian Indikator
            </h3>
            <div class="overflow-x-auto max-h-80">
              <table class="data-table text-sm w-full">
                <thead>
                  <tr class="bg-gray-50">
                    <th class="text-left p-3">Indikator</th>
                    <th class="text-center p-3">Kode</th>
                    <th class="text-right p-3">Skor</th>
                    <th class="text-center p-3">Status</th>
                  </tr>
                </thead>
                <tbody id="tableBantuan">
                  <!-- Data rows -->
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB: Kelembagaan Desa -->
    <div id="content-kelembagaan" class="tab-content">
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="kpi-card card-hover p-4 bg-white rounded-xl shadow-sm border border-black/5 flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 mb-1">Jumlah Lembaga</p>
            <p class="text-2xl font-bold text-gray-800">6 Lembaga</p>
          </div>
          <div class="bg-red-50 p-3 rounded-full text-red-600">
            <i class="fas fa-sitemap text-lg"></i>
          </div>
        </div>
        <div class="kpi-card card-hover p-4 bg-white rounded-xl shadow-sm border border-black/5 flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 mb-1">Total Pengurus</p>
            <p class="text-2xl font-bold text-gray-800">48 Orang</p>
          </div>
          <div class="bg-green-50 p-3 rounded-full text-green-600">
            <i class="fas fa-user-shield text-lg"></i>
          </div>
        </div>
        <div class="kpi-card card-hover p-4 bg-white rounded-xl shadow-sm border border-black/5 flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 mb-1">Program Aktif</p>
            <p class="text-2xl font-bold text-gray-800">12 Kegiatan</p>
          </div>
          <div class="bg-blue-50 p-3 rounded-full text-blue-600">
            <i class="fas fa-tasks text-lg"></i>
          </div>
        </div>
        <div class="kpi-card card-hover p-4 bg-white rounded-xl shadow-sm border border-black/5 flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 mb-1">Kemitraan</p>
            <p class="text-2xl font-bold text-gray-800">4 Sektor</p>
          </div>
          <div class="bg-purple-50 p-3 rounded-full text-purple-600">
            <i class="fas fa-handshake text-lg"></i>
          </div>
        </div>
      </div>

      <!-- Main Columns -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Side: Interactive Menu List of Institutions -->
        <div class="lg:col-span-1 space-y-3">
          <div class="panel p-4 bg-white rounded-xl shadow-sm border border-black/5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">
              <i class="fas fa-landmark text-primary-500 mr-2"></i>Daftar Kelembagaan
            </h3>
            <div class="space-y-2">
              <button onclick="switchInstitutionTab('pemdes')" id="inst-btn-pemdes" class="w-full text-left p-3 rounded-xl border border-primary-100 bg-primary-50/50 text-primary-700 font-medium transition-all flex items-center justify-between hover:bg-primary-50 inst-tab-btn active">
                <span class="flex items-center gap-3"><i class="fas fa-building text-base w-5 text-center"></i> Pemerintah Desa (Pemdes)</span>
                <i class="fas fa-chevron-right text-xs"></i>
              </button>
              <button onclick="switchInstitutionTab('bpd')" id="inst-btn-bpd" class="w-full text-left p-3 rounded-xl border border-gray-100 bg-transparent text-gray-700 font-normal transition-all flex items-center justify-between hover:bg-gray-50 inst-tab-btn">
                <span class="flex items-center gap-3"><i class="fas fa-gavel text-base w-5 text-center"></i> Badan Permusyawaratan (BPD)</span>
                <i class="fas fa-chevron-right text-xs"></i>
              </button>
              <button onclick="switchInstitutionTab('pkk')" id="inst-btn-pkk" class="w-full text-left p-3 rounded-xl border border-gray-100 bg-transparent text-gray-700 font-normal transition-all flex items-center justify-between hover:bg-gray-50 inst-tab-btn">
                <span class="flex items-center gap-3"><i class="fas fa-female text-base w-5 text-center"></i> Pemberdayaan Keluarga (PKK)</span>
                <i class="fas fa-chevron-right text-xs"></i>
              </button>
              <button onclick="switchInstitutionTab('karang-taruna')" id="inst-btn-karang-taruna" class="w-full text-left p-3 rounded-xl border border-gray-100 bg-transparent text-gray-700 font-normal transition-all flex items-center justify-between hover:bg-gray-50 inst-tab-btn">
                <span class="flex items-center gap-3"><i class="fas fa-users-cog text-base w-5 text-center"></i> Karang Taruna</span>
                <i class="fas fa-chevron-right text-xs"></i>
              </button>
              <button onclick="switchInstitutionTab('lpm')" id="inst-btn-lpm" class="w-full text-left p-3 rounded-xl border border-gray-100 bg-transparent text-gray-700 font-normal transition-all flex items-center justify-between hover:bg-gray-50 inst-tab-btn">
                <span class="flex items-center gap-3"><i class="fas fa-shield-alt text-base w-5 text-center"></i> LPM / Lembaga Adat</span>
                <i class="fas fa-chevron-right text-xs"></i>
              </button>
              <button onclick="switchInstitutionTab('bumdes')" id="inst-btn-bumdes" class="w-full text-left p-3 rounded-xl border border-gray-100 bg-transparent text-gray-700 font-normal transition-all flex items-center justify-between hover:bg-gray-50 inst-tab-btn">
                <span class="flex items-center gap-3"><i class="fas fa-store text-base w-5 text-center"></i> BUMDesa</span>
                <i class="fas fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Quick Information -->
          <div class="panel p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md text-white">
            <h4 class="font-bold mb-1 text-sm"><i class="fas fa-info-circle mr-2"></i>Sinergi & Kemitraan</h4>
            <p class="text-xs text-white/85 leading-relaxed">Kelembagaan Desa Remau Bako Tuo bergerak aktif dan bersinergi demi mewujudkan tata kelola desa yang transparan, maju, mandiri, dan berbudaya luhur.</p>
          </div>
        </div>

        <!-- Right Side: Content display for the active Institution -->
        <div class="lg:col-span-2">
          
          <!-- Tab 1: PEMERINTAH DESA (PEMDES) -->
          <div id="inst-content-pemdes" class="panel p-5 bg-white rounded-xl shadow-sm border border-black/5 inst-content-panel active">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 class="text-lg font-bold text-gray-800">Pemerintah Desa (PEMDES)</h3>
                <p class="text-xs text-gray-500">Struktur Organisasi dan Tata Kerja Pemerintah Desa</p>
              </div>
              <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Aktif</span>
            </div>
            
            <p class="text-sm text-gray-600 mb-6 leading-relaxed">
              Pemerintah Desa adalah penyelenggara urusan pemerintahan dan kepentingan masyarakat setempat dalam sistem pemerintahan Negara Kesatuan Republik Indonesia. Dipimpin oleh Kepala Desa dan dibantu oleh perangkat desa.
            </p>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-users text-blue-500 mr-2"></i>Struktur Kepengurusan Utama</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-bold">K</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">H. Herman, S.Sos</h5>
                  <p class="text-xs text-blue-600 font-semibold mb-0.5">Kepala Desa</p>
                  <p class="text-[10px] text-gray-400">Masa Jabatan: 2021 - 2027</p>
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-lg font-bold">S</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">Ahmad Faisal, S.E</h5>
                  <p class="text-xs text-indigo-600 font-semibold mb-0.5">Sekretaris Desa</p>
                  <p class="text-[10px] text-gray-400">NIP. 19850312 201101 1 002</p>
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-lg font-bold">K</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">Siti Rahma</h5>
                  <p class="text-xs text-emerald-600 font-semibold mb-0.5">Kaur Keuangan (Bendahara)</p>
                  <p class="text-[10px] text-gray-400">Sistem Siskeudes Online</p>
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-lg font-bold">P</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">Budi Santoso</h5>
                  <p class="text-xs text-amber-600 font-semibold mb-0.5">Kasi Pemerintahan</p>
                  <p class="text-[10px] text-gray-400">Layanan Adminduk Terpadu</p>
                </div>
              </div>
            </div>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-calendar-check text-emerald-500 mr-2"></i>Agenda & Prioritas Kerja</h4>
            <div class="space-y-2">
              <div class="p-3 bg-green-50/50 rounded-lg border border-green-100 flex items-start gap-3">
                <span class="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                <div>
                  <h5 class="text-xs font-bold text-green-800">Peningkatan Digitalisasi Layanan Desa</h5>
                  <p class="text-[11px] text-gray-600 mt-0.5">Pengembangan Sistem Informasi Desa (SID) untuk pelayanan surat-menyurat mandiri bagi warga.</p>
                </div>
              </div>
              <div class="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-start gap-3">
                <span class="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                <div>
                  <h5 class="text-xs font-bold text-blue-800">Pembangunan Infrastruktur Berkelanjutan</h5>
                  <p class="text-[11px] text-gray-600 mt-0.5">Fokus pada jalan usaha tani, sanitasi pemukiman, dan jembatan penghubung dusun di tahun anggaran berjalan.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 2: BPD -->
          <div id="inst-content-bpd" class="panel p-5 bg-white rounded-xl shadow-sm border border-black/5 inst-content-panel hidden">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 class="text-lg font-bold text-gray-800">Badan Permusyawaratan Desa (BPD)</h3>
                <p class="text-xs text-gray-500">Lembaga Legislatif Tingkat Desa</p>
              </div>
              <span class="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold">Aktif</span>
            </div>

            <p class="text-sm text-gray-600 mb-6 leading-relaxed">
              BPD adalah lembaga yang melaksanakan fungsi pemerintahan yang anggotanya merupakan wakil dari penduduk desa berdasarkan keterwakilan wilayah dan ditetapkan secara demokratis. BPD bertugas membahas dan menyepakati rancangan peraturan desa bersama kepala desa serta mengawasi kinerja pemerintah desa.
            </p>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-users text-amber-500 mr-2"></i>Kepengurusan BPD</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-lg font-bold">K</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">Ir. H. Syarifuddin</h5>
                  <p class="text-xs text-amber-700 font-semibold mb-0.5">Ketua BPD</p>
                  <p class="text-[10px] text-gray-400">Wakil Dusun Makmur</p>
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-lg font-bold">W</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">M. Ridwan, S.Pd</h5>
                  <p class="text-xs text-gray-600 font-semibold mb-0.5">Wakil Ketua BPD</p>
                  <p class="text-[10px] text-gray-400">Wakil Dusun Sejahtera</p>
                </div>
              </div>
            </div>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-check-double text-indigo-500 mr-2"></i>Fungsi & Kegiatan Terbaru</h4>
            <ul class="space-y-3 text-xs text-gray-600">
              <li class="flex items-start gap-2">
                <i class="fas fa-check text-green-500 mt-0.5"></i>
                <div>
                  <strong>Penyusunan Perdes APBDes 2026:</strong> Telah menyepakati bersama rancangan peraturan desa tentang Anggaran Pendapatan dan Belanja Desa (APBDes) Tahun Anggaran 2026 pada tanggal 15 Desember 2025.
                </div>
              </li>
              <li class="flex items-start gap-2">
                <i class="fas fa-check text-green-500 mt-0.5"></i>
                <div>
                  <strong>Musyawarah Dusun (Musdus):</strong> Mengadakan serap aspirasi warga secara berkala di tiap dusun untuk bahan rancangan prioritas RKPDesa.
                </div>
              </li>
            </ul>
          </div>

          <!-- Tab 3: PKK -->
          <div id="inst-content-pkk" class="panel p-5 bg-white rounded-xl shadow-sm border border-black/5 inst-content-panel hidden">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 class="text-lg font-bold text-gray-800">Pemberdayaan Kesejahteraan Keluarga (PKK)</h3>
                <p class="text-xs text-gray-500">Gerakan Pembangunan Masyarakat untuk Kesejahteraan Keluarga</p>
              </div>
              <span class="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold">Aktif</span>
            </div>

            <p class="text-sm text-gray-600 mb-6 leading-relaxed">
              PKK Desa Remau Bako Tuo berperan aktif dalam program posyandu, pencegahan stunting, keterampilan kerajinan tangan wanita, penyuluhan kesehatan, serta ketahanan pangan keluarga melalui program taman obat keluarga (TOGA) dan halaman asri teratur indah nyaman (HATINYA PKK).
            </p>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-female text-pink-500 mr-2"></i>Tokoh Penggerak PKK</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-pink-100 text-pink-700 rounded-full flex items-center justify-center text-lg font-bold">H</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">Ny. Hj. Fatimah Herman</h5>
                  <p class="text-xs text-pink-700 font-semibold mb-0.5">Ketua Tim Penggerak PKK</p>
                  <p class="text-[10px] text-gray-400">Koordinator Utama 10 Program Pokok</p>
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-lg font-bold">R</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">dr. Rina Amalia</h5>
                  <p class="text-xs text-rose-700 font-semibold mb-0.5">Sekretaris & Ketua Pokja IV (Kesehatan)</p>
                  <p class="text-[10px] text-gray-400">Penanggung Jawab Program Bebas Stunting</p>
                </div>
              </div>
            </div>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-heart text-pink-500 mr-2"></i>Program Kerja Unggulan</h4>
            <div class="space-y-3 text-xs text-gray-600">
              <div class="border-l-4 border-pink-400 pl-3">
                <h5 class="font-bold text-gray-800">Posyandu Balita & Lansia Terintegrasi</h5>
                <p class="mt-0.5 text-gray-500">Dilaksanakan setiap tanggal 10 bulan berjalan, menyediakan timbang balita, imunisasi, PMT (Pemberian Makanan Tambahan) sehat, serta cek kesehatan lansia gratis.</p>
              </div>
              <div class="border-l-4 border-pink-400 pl-3">
                <h5 class="font-bold text-gray-800">Kelompok Wanita Tani (KWT) "Mekar Sari"</h5>
                <p class="mt-0.5 text-gray-500">Pelatihan hidroponik dan pemanfaatan pekarangan rumah untuk sayuran organik keluarga demi menekan laju inflasi pangan skala rumah tangga.</p>
              </div>
            </div>
          </div>

          <!-- Tab 4: Karang Taruna -->
          <div id="inst-content-karang-taruna" class="panel p-5 bg-white rounded-xl shadow-sm border border-black/5 inst-content-panel hidden">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 class="text-lg font-bold text-gray-800">Karang Taruna "Karya Bakti"</h3>
                <p class="text-xs text-gray-500">Wadah Pengembangan Generasi Muda Desa</p>
              </div>
              <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">Aktif</span>
            </div>

            <p class="text-sm text-gray-600 mb-6 leading-relaxed">
              Karang Taruna adalah organisasi sosial wadah pengembangan generasi muda yang tumbuh dan berkembang atas dasar kesadaran dan tanggung jawab sosial dari, oleh dan untuk masyarakat khususnya generasi muda di wilayah desa.
            </p>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-user-friends text-blue-500 mr-2"></i>Pimpinan Karang Taruna</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-lg font-bold">R</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">Rizky Pratama, S.Kom</h5>
                  <p class="text-xs text-blue-700 font-semibold mb-0.5">Ketua Karang Taruna</p>
                  <p class="text-[10px] text-gray-400">Penggerak Kreativitas & Digital Pemuda</p>
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center text-lg font-bold">F</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">Fandi Ahmad</h5>
                  <p class="text-xs text-cyan-700 font-semibold mb-0.5">Koordinator Olahraga & Seni</p>
                  <p class="text-[10px] text-gray-400">Penanggung Jawab Turnamen Tahunan</p>
                </div>
              </div>
            </div>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-trophy text-amber-500 mr-2"></i>Kegiatan & Prestasi Terbaru</h4>
            <div class="space-y-3 text-xs text-gray-600">
              <div class="p-3 bg-gray-50 rounded-lg">
                <h5 class="font-bold text-gray-800"><i class="fas fa-futbol mr-1 text-blue-500"></i> Turnamen Sepak Bola Kades Cup</h5>
                <p class="mt-1 text-gray-500">Sukses menyelenggarakan turnamen antar dusun yang dihadiri ratusan penonton dan merangsang ekonomi UMKM sekitar lapangan desa.</p>
              </div>
              <div class="p-3 bg-gray-50 rounded-lg">
                <h5 class="font-bold text-gray-800"><i class="fas fa-palette mr-1 text-purple-500"></i> Pelatihan Desain Grafis & Pembuatan Konten</h5>
                <p class="mt-1 text-gray-500">Memberikan skill digital untuk 25 pemuda desa agar dapat membuka jasa kreatif mandiri dan mempromosikan pariwisata desa secara online.</p>
              </div>
            </div>
          </div>

          <!-- Tab 5: LPM / Lembaga Adat -->
          <div id="inst-content-lpm" class="panel p-5 bg-white rounded-xl shadow-sm border border-black/5 inst-content-panel hidden">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 class="text-lg font-bold text-gray-800">LPM & Lembaga Adat Melayu</h3>
                <p class="text-xs text-gray-500">Lembaga Pemberdayaan Masyarakat dan Penjaga Budaya Tradisional</p>
              </div>
              <span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">Aktif</span>
            </div>

            <p class="text-sm text-gray-600 mb-6 leading-relaxed">
              Lembaga Pemberdayaan Masyarakat (LPM) membantu pemerintah desa dalam merencanakan pembangunan partisipatif dan menggerakkan swadaya gotong royong warga. Sementara Lembaga Adat Melayu Desa berperan menjaga nilai, adat-istiadat luhur, menyelesaikan konflik sosial secara kekeluargaan, serta membina kehidupan berbudaya masyarakat.
            </p>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-user-graduate text-purple-500 mr-2"></i>Ketua Lembaga</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-lg font-bold">D</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">Drs. H. M. Jamil</h5>
                  <p class="text-xs text-purple-700 font-semibold mb-0.5">Ketua LPM</p>
                  <p class="text-[10px] text-gray-400">Koordinator Swadaya Pembangunan</p>
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-lg font-bold">A</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">Datuk Penghulu M. Rasyid</h5>
                  <p class="text-xs text-amber-700 font-semibold mb-0.5">Ketua Lembaga Adat Melayu</p>
                  <p class="text-[10px] text-gray-400">Pemberi Pertimbangan Adat & Budaya</p>
                </div>
              </div>
            </div>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-hands-helping text-amber-600 mr-2"></i>Fokus Program & Swadaya</h4>
            <div class="space-y-3 text-xs text-gray-600">
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                <div>
                  <strong>Gotong Royong Bersih Lingkungan:</strong> Agenda rutin setiap hari Minggu pertama untuk membersihkan drainase desa, facilities ibadah, serta penataan makam umum.
                </div>
              </div>
              <div class="flex items-start gap-3">
                <div class="w-2 h-2 rounded-full bg-purple-500 mt-1.5 flex-shrink-0"></div>
                <div>
                  <strong>Suku dan Seni Tradisional Melayu:</strong> Pelatihan tari persembahan dan musik kompang tradisional bagi anak-anak sekolah desa untuk melestarikan kebudayaan Melayu Jambi.
                </div>
              </div>
            </div>
          </div>

          <!-- Tab 6: BUMDes -->
          <div id="inst-content-bumdes" class="panel p-5 bg-white rounded-xl shadow-sm border border-black/5 inst-content-panel hidden">
            <div class="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <h3 class="text-lg font-bold text-gray-800">BUMDesa "Bako Mandiri"</h3>
                <p class="text-xs text-gray-500">Badan Usaha Milik Desa - Pilar Ekonomi Desa</p>
              </div>
              <span class="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">Aktif & Berdaya</span>
            </div>

            <p class="text-sm text-gray-600 mb-6 leading-relaxed">
              BUMDesa "Bako Mandiri" didirikan untuk mengoptimalkan potensi aset desa, meningkatkan perekonomian warga, serta menyumbangkan Pendapatan Asli Desa (PADes). Mengelola beberapa unit usaha strategis yang melayani kebutuhan warga desa.
            </p>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-coins text-emerald-500 mr-2"></i>Kinerja & Manajemen BUMDes</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-lg font-bold">M</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">Mulya Syahputra, S.Ak</h5>
                  <p class="text-xs text-emerald-700 font-semibold mb-0.5">Direktur Utama BUMDes</p>
                  <p class="text-[10px] text-gray-400">Pengalaman Manajemen Keuangan</p>
                </div>
              </div>
              <div class="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                <div class="w-12 h-12 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-lg font-bold">K</div>
                <div>
                  <h5 class="text-sm font-bold text-gray-800">Unit Saprotan & Agen Air</h5>
                  <p class="text-xs text-yellow-700 font-semibold mb-0.5">Penyedia Pupuk & PPOB</p>
                  <p class="text-[10px] text-gray-400">Layanan Pembayaran Listrik & Pulsa Desa</p>
                </div>
              </div>
            </div>

            <h4 class="text-sm font-semibold text-gray-700 mb-3"><i class="fas fa-chart-line text-emerald-600 mr-2"></i>Kinerja Unit Usaha BUMDes</h4>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs text-gray-600 border-collapse">
                <thead>
                  <tr class="bg-gray-50 border-b border-gray-200">
                    <th class="p-2 font-bold text-gray-700">Nama Unit Usaha</th>
                    <th class="p-2 font-bold text-gray-700">Layanan / Produk</th>
                    <th class="p-2 font-bold text-gray-700 text-right">Kontribusi Omset (2025)</th>
                    <th class="p-2 font-bold text-gray-700 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="p-2 font-medium text-gray-800">Unit Saprotan (Sarana Produksi Pertanian)</td>
                    <td class="p-2">Pupuk bersubsidi, herbisida, bibit unggul</td>
                    <td class="p-2 text-right">Rp 45.000.000</td>
                    <td class="p-2 text-center"><span class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-semibold">Sangat Sehat</span></td>
                  </tr>
                  <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="p-2 font-medium text-gray-800">Agen Token & Pembayaran Listrik (PPOB)</td>
                    <td class="p-2">Pulsa, token PLN, bayar PDAM, transfer dana</td>
                    <td class="p-2 text-right">Rp 12.500.000</td>
                    <td class="p-2 text-center"><span class="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-semibold">Sehat</span></td>
                  </tr>
                  <tr class="hover:bg-gray-50">
                    <td class="p-2 font-medium text-gray-800">Unit Air Bersih Desa (PAMDes)</td>
                    <td class="p-2">Penyaluran air bersih dusun rawan payau</td>
                    <td class="p-2 text-right">Rp 18.000.000</td>
                    <td class="p-2 text-center"><span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold">Uji Coba</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
`;

export default function DashboardClient() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'scripts' | 'data'>('scripts');
  const [items, setItems] = useState<DashboardLoadingItem[]>([]);
  const [ready, setReady] = useState(false);

  const syncTabFromUrl = useCallback(() => {
    if (!isDashboardInitComplete() || typeof window.switchTab !== 'function') return;
    const internalTab = getInternalTabFromUrl(searchParams?.get('tab'));
    void window.switchTab(internalTab);
  }, [searchParams]);

  // Hide legacy nav elements replaced by React BottomNav
  useEffect(() => {
    const mobileOverlay = document.getElementById('mobileMenuOverlay');
    const mobileDrawer = document.getElementById('mobileMenuDrawer');
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileOverlay) mobileOverlay.style.display = 'none';
    if (mobileDrawer) mobileDrawer.style.display = 'none';
    if (mobileBtn) mobileBtn.style.display = 'none';

    const tabDampak = document.getElementById('tab-dampak');
    if (tabDampak) {
      const tabBar = tabDampak.parentElement?.parentElement?.parentElement as HTMLElement | null;
      if (tabBar) tabBar.style.display = 'none';
    }

    const mainEl = document.querySelector('main') as HTMLElement | null;
    if (mainEl) mainEl.style.paddingBottom = '84px';
  }, []);

  // Bridge legacy loading events → React loading UI
  useEffect(() => {
    const onLoading = (e: Event) => {
      const visible = (e as CustomEvent<{ visible: boolean }>).detail.visible;
      if (visible) {
        setLoading(true);
        setPhase('data');
      }
    };

    const onLoadingItems = (e: Event) => {
      const labels = (e as CustomEvent<{ items: string[] }>).detail.items;
      setItems(labels.map((label) => ({ label, status: 'pending' as LoadingItemStatus })));
      setPhase('data');
      setLoading(true);
    };

    const onLoadingItem = (e: Event) => {
      const { index, status } = (e as CustomEvent<{ index: number; status: LoadingItemStatus }>).detail;
      setItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, status } : item))
      );
    };

    const onInitComplete = () => {
      setLoading(false);
      setReady(true);
    };

    window.addEventListener(DASHBOARD_EVENTS.LOADING, onLoading);
    window.addEventListener(DASHBOARD_EVENTS.LOADING_ITEMS, onLoadingItems);
    window.addEventListener(DASHBOARD_EVENTS.LOADING_ITEM, onLoadingItem);
    window.addEventListener(DASHBOARD_EVENTS.INIT_COMPLETE, onInitComplete);

    return () => {
      window.removeEventListener(DASHBOARD_EVENTS.LOADING, onLoading);
      window.removeEventListener(DASHBOARD_EVENTS.LOADING_ITEMS, onLoadingItems);
      window.removeEventListener(DASHBOARD_EVENTS.LOADING_ITEM, onLoadingItem);
      window.removeEventListener(DASHBOARD_EVENTS.INIT_COMPLETE, onInitComplete);
    };
  }, []);

  // Load legacy scripts once, then wait for init
  useEffect(() => {
    let cancelled = false;

    installDashboardStubs();
    window.__dashboardInitialTab = getInternalTabFromUrl(searchParams?.get('tab'));
    setLoading(true);
    setPhase('scripts');

    ensureDashboardScripts()
      .then(() => waitForDashboardInit())
      .then(() => {
        if (!cancelled) {
          setLoading(false);
          setReady(true);
        }
      })
      .catch((e) => {
        console.error('Dashboard load error:', e);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount; initial tab set above
  }, []);

  // Sync tab when URL changes after dashboard is ready
  useEffect(() => {
    if (!ready) return;
    syncTabFromUrl();
  }, [ready, syncTabFromUrl]);

  return (
    <>
      <DashboardLoading visible={loading} phase={phase} items={items} />
      <div dangerouslySetInnerHTML={{ __html: HTML_CONTENT }} />
    </>
  );
}

