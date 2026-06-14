const fs = require('fs');
let code = fs.readFileSync('public/js/dashboard-main.js', 'utf8');

// 1. Fix GeoJSON fetch error
code = code.replace(
  'const response = await fetch(CONFIG.GEOJSON_URL);',
  `if (!CONFIG.GEOJSON_URL) {
      console.log('No GeoJSON URL provided, skipping polygon map loading.');
      return;
    }
    const response = await fetch(CONFIG.GEOJSON_URL);`
);

// 2. Modify `addDampakBencanaMarkers` to show Dusun markers
const markerFuncOrig = `function addDampakBencanaMarkers() {
  if (!state.maps.dampak || !state.data.bencana?.data) return;

  if (!state.layers.bencanaPoints) {
    state.layers.bencanaPoints = L.layerGroup().addTo(state.maps.dampak);
  } else {
    state.layers.bencanaPoints.clearLayers();
  }

  state.data.bencana.data.forEach((item) => {
    const coords = getMarkerCoords(item);
    if (!coords) return;

    const icon = createMarkerIcon('#dc2626', 'fa-exclamation-triangle');
    L.marker(coords, { icon })
      .bindPopup(
        \`
                            <div class="popup-header">
                                <strong><i class="fas fa-exclamation-triangle mr-2"></i>\${
                                  item.jenis_bencana || 'Bencana'
                                }</strong>
                            </div>
                            <div class="popup-body">
                                <p><strong>Wilayah:</strong> \${
                                  getWilayahNameForCoords(item) || '-'
                                }</p>
                                <p><strong>Kecamatan:</strong> \${
                                  item.kecamatan || '-'
                                }</p>
                                <p><strong>Desa:</strong> \${
                                  item.desa || '-'
                                }</p>
                                <p><strong>Pengungsi:</strong> \${formatNumber(
                                  item.pengungsi || 0
                                )}</p>
                                <p><strong>Status:</strong> \${
                                  item.status || '-'
                                }</p>
                            </div>
                        \`
      )
      .addTo(state.layers.bencanaPoints);
  });
}`;

const markerFuncNew = `function addDampakBencanaMarkers() {
  if (!state.maps.dampak || !state.data.bencana?.data) return;

  if (!state.layers.bencanaPoints) {
    state.layers.bencanaPoints = L.layerGroup().addTo(state.maps.dampak);
  } else {
    state.layers.bencanaPoints.clearLayers();
  }

  state.data.bencana.data.forEach((item) => {
    const coords = getMarkerCoords(item);
    if (!coords) return;

    const icon = createMarkerIcon('#0ea5e9', 'fa-home');
    L.marker(coords, { icon })
      .bindPopup(
        \`
            <div class="popup-header" style="background-color:#0ea5e9;">
                <strong><i class="fas fa-map-marker-alt mr-2"></i>Dusun \${item.nama_dusun || '-'}</strong>
            </div>
            <div class="popup-body">
                <p><strong>Desa:</strong> \${item.desa || '-'}</p>
                <p><strong>Kecamatan:</strong> \${item.kecamatan || '-'}</p>
                <hr class="my-2">
                <p><strong>Luas Wilayah:</strong> \${formatNumber(item.luas_ha || 0)} Ha</p>
                <p><strong>Jumlah Penduduk:</strong> \${formatNumber(item.jumlah_penduduk || 0)} Jiwa</p>
                <p><strong>Jumlah KK:</strong> \${formatNumber(item.jumlah_kk || 0)} KK</p>
            </div>
        \`
      )
      .addTo(state.layers.bencanaPoints);
  });
}`;
code = code.replace(markerFuncOrig, markerFuncNew);


// 3. Fix `renderPengungsiCharts` and `renderPengungsiTable` for the "Pembangunan" tab
// The user already has the updated HTML in DashboardClient.tsx (using chartDisabilitas, chartKK, tablePengungsi).
// We just need to make sure the JS doesn't crash when elements are missing, and we render the new charts safely.
// Since we reverted `dashboard-main.js`, `renderPengungsiCharts` renders disabilitas and kk charts. We just make sure ctx exists.

code = code.replace(
  "const ctxDisabilitas = document.getElementById('chartDisabilitas');\n  if (state.charts.disabilitas) state.charts.disabilitas.destroy();",
  "const ctxDisabilitas = document.getElementById('chartDisabilitas');\n  if (state.charts.disabilitas) state.charts.disabilitas.destroy();\n  if (!ctxDisabilitas) return;"
);
code = code.replace(
  "const ctxKK = document.getElementById('chartKK');\n  if (state.charts.kk) state.charts.kk.destroy();",
  "const ctxKK = document.getElementById('chartKK');\n  if (state.charts.kk) state.charts.kk.destroy();\n  if (!ctxKK) return;"
);

// 4. Update the "Bantuan" tab functions to support Indeks (IDM) charts.
// We will replace `renderBantuanCharts`, `renderBantuanTable`, and `populateBantuanFilters` 
const bantuanChartsOrig = `function renderBantuanCharts() {
  const data = state.data.banlog;
  if (!data) return;

  // Status Pie Chart
  const ctxStatus = document.getElementById('chartBantuanStatus');
  if (state.charts.bantuanStatus) state.charts.bantuanStatus.destroy();

  state.charts.bantuanStatus = new Chart(ctxStatus, {
    type: 'doughnut',
    data: {
      labels: ['Tersalurkan', 'Proses', 'Pending', 'Dibatalkan'],
      datasets: [
        {
          data: [
            data.total_kuning,
            data.total_biru,
            data.total_biru_keabuan,
            data.total_putih,
          ],
          backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { size: 10 } },
        },
      },
    },
  });

  // Bantuan per Kabupaten Bar Chart
  const ctxKab = document.getElementById('chartBantuanKab');
  if (state.charts.bantuanKab) state.charts.bantuanKab.destroy();

  const kabData = {};
  (data.data || []).forEach((d) => {
    const kab = d.kabupaten || 'Unknown';
    kabData[kab] = (kabData[kab] || 0) + 1;
  });

  state.charts.bantuanKab = new Chart(ctxKab, {
    type: 'bar',
    data: {
      labels: Object.keys(kabData),
      datasets: [
        {
          label: 'Jumlah Bantuan',
          data: Object.values(kabData),
          backgroundColor: '#3b82f6',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}`;

const bantuanChartsNew = `function renderBantuanCharts() {
  const data = state.data.banlog;
  if (!data) return;

  const ctxStatus = document.getElementById('chartBantuanStatus');
  if (state.charts.bantuanStatus) state.charts.bantuanStatus.destroy();

  if (ctxStatus) {
    state.charts.bantuanStatus = new Chart(ctxStatus, {
      type: 'doughnut',
      data: {
        labels: ['Sangat Baik', 'Baik', 'Cukup', 'Kurang'],
        datasets: [{
          data: [data.total_kuning, data.total_biru, data.total_biru_keabuan, data.total_putih],
          backgroundColor: ['#eab308', '#3b82f6', '#6b7280', '#e5e7eb'],
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
        },
      },
    });
  }

  const ctxKab = document.getElementById('chartBantuanKab');
  if (state.charts.bantuanKab) state.charts.bantuanKab.destroy();

  const indikators = data.data || [];
  let sumIKS = 0, countIKS = 0;
  let sumIKE = 0, countIKE = 0;
  let sumIKL = 0, countIKL = 0;

  indikators.forEach(d => {
    if (d.kode && d.kode.startsWith('S')) { sumIKS += d.skor; countIKS++; }
    if (d.kode && d.kode.startsWith('E')) { sumIKE += d.skor; countIKE++; }
    if (d.kode && d.kode.startsWith('L')) { sumIKL += d.skor; countIKL++; }
  });

  const avgIKS = countIKS > 0 ? (sumIKS / countIKS).toFixed(2) : 0;
  const avgIKE = countIKE > 0 ? (sumIKE / countIKE).toFixed(2) : 0;
  const avgIKL = countIKL > 0 ? (sumIKL / countIKL).toFixed(2) : 0;

  if (ctxKab) {
    state.charts.bantuanKab = new Chart(ctxKab, {
      type: 'bar',
      data: {
        labels: ['Ketahanan Sosial (IKS)', 'Ketahanan Ekonomi (IKE)', 'Ketahanan Lingkungan (IKL)'],
        datasets: [{
          label: 'Skor',
          data: [avgIKS, avgIKE, avgIKL],
          backgroundColor: ['#ec4899', '#3b82f6', '#10b981'],
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 1.0 } },
        plugins: { legend: { display: false } }
      },
    });
  }
}`;
code = code.replace(bantuanChartsOrig, bantuanChartsNew);

const bantuanTableOrig = `function renderBantuanTable() {
  const tbody = document.getElementById('tableBantuan');
  const data = state.data.banlog?.data || [];

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center p-4 text-gray-400">Tidak ada data bantuan</td></tr>';
    return;
  }

  tbody.innerHTML = data
    .map((item) => {
      const statusColor =
        {
          Tersalurkan: 'text-green-600 bg-green-50',
          Proses: 'text-blue-600 bg-blue-50',
          Pending: 'text-yellow-600 bg-yellow-50',
          Dibatalkan: 'text-red-600 bg-red-50',
        }[item.status_bantuan] || 'text-gray-600 bg-gray-50';

      return \`
                <tr class="border-b hover:bg-gray-50 cursor-pointer" onclick="showBantuanDetail('\${
                  item.id
                }')">
                    <td class="p-3 font-medium">\${item.jenis_bantuan || '-'}</td>
                    <td class="p-3">\${item.kabupaten || '-'}</td>
                    <td class="p-3">\${item.kecamatan || '-'}</td>
                    <td class="p-3">\${item.desa || '-'}</td>
                    <td class="p-3 text-right font-medium">\${formatNumber(
                      item.jumlah_paket || 0
                    )} \${item.satuan || 'Paket'}</td>
                    <td class="p-3 text-center">
                        <span class="px-2 py-1 rounded text-xs font-medium \${statusColor}">
                            \${item.status_bantuan || '-'}
                        </span>
                    </td>
                </tr>
            \`;
    })
    .join('');
}`;

const bantuanTableNew = `function renderBantuanTable() {
  const tbody = document.getElementById('tableBantuan');
  if (!tbody) return;
  const data = state.data.banlog?.data || [];

  if (data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" class="text-center p-4 text-gray-400">Tidak ada data indikator</td></tr>';
    return;
  }

  tbody.innerHTML = data
    .map((item) => {
      const statusColor =
        {
          SangatBaik: 'text-green-600 bg-green-50',
          Baik: 'text-blue-600 bg-blue-50',
          Cukup: 'text-yellow-600 bg-yellow-50',
          Kurang: 'text-red-600 bg-red-50',
        }[item.status_indikator] || 'text-gray-600 bg-gray-50';

      return \`
                <tr class="border-b hover:bg-gray-50">
                    <td class="p-3 font-medium">\${item.indikator || '-'}</td>
                    <td class="p-3 text-center">\${item.kode || '-'}</td>
                    <td class="p-3 text-right font-medium">\${item.skor || 0}</td>
                    <td class="p-3 text-center">
                        <span class="px-2 py-1 rounded text-xs font-medium \${statusColor}">
                            \${item.status_indikator || '-'}
                        </span>
                    </td>
                </tr>
            \`;
    })
    .join('');
}`;
code = code.replace(bantuanTableOrig, bantuanTableNew);

const populateBantuanFiltersOrig = `function populateBantuanFilters() {
  const data = state.data.banlog?.data || [];
  const kabSet = new Set();
  data.forEach((d) => d.kabupaten && kabSet.add(d.kabupaten));

  const select = document.getElementById('filterBantuanKab');
  select.innerHTML =
    '<option value="">Semua Kabupaten</option>' +
    [...kabSet]
      .sort()
      .map((k) => \`<option value="\${k}">\${k}</option>\`)
      .join('');
}`;

const populateBantuanFiltersNew = `function populateBantuanFilters() {
  const data = state.data.banlog?.data || [];
  const kabSet = new Set();
  data.forEach((d) => d.kabupaten && kabSet.add(d.kabupaten));

  const select = document.getElementById('filterBantuanKab');
  if (select) {
    select.innerHTML =
      '<option value="">Semua Kabupaten</option>' +
      [...kabSet]
        .sort()
        .map((k) => \`<option value="\${k}">\${k}</option>\`)
        .join('');
  }
}`;
code = code.replace(populateBantuanFiltersOrig, populateBantuanFiltersNew);

fs.writeFileSync('public/js/dashboard-main.js', code);
console.log('Successfully patched dashboard-main.js completely.');
