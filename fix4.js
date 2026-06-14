const fs = require('fs');

let code = fs.readFileSync('public/js/dashboard-main.js', 'utf8');

const targetFuncStart = 'function addDampakBencanaMarkers() {';
const targetFuncEnd = '  });\n}';

const startIdx = code.indexOf(targetFuncStart);
const endIdx = code.indexOf(targetFuncEnd, startIdx) + targetFuncEnd.length;

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `function addDampakBencanaMarkers() {
  if (!state.maps.dampak || !state.data.bencana?.data) return;

  if (!state.layers.bencanaPoints) {
    state.layers.bencanaPoints = L.layerGroup().addTo(state.maps.dampak);
  } else {
    state.layers.bencanaPoints.clearLayers();
  }

  state.data.bencana.data.forEach((item) => {
    const coords = getMarkerCoords(item);
    if (!coords) return;

    // Untuk Profil Desa, gunakan marker biru & icon home
    const icon = createMarkerIcon('#0ea5e9', 'fa-home');
    
    L.marker(coords, { icon })
      .bindPopup(\`
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
      \`)
      .addTo(state.layers.bencanaPoints);
  });
}`;

  code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
  fs.writeFileSync('public/js/dashboard-main.js', code);
  console.log('Fixed marker popup and icon');
} else {
  console.log('Could not find function bounds.');
}
