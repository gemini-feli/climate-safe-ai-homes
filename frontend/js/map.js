// --- CONFIG & INITIAL DATA -------------------------------------------------
let CAMPUS_CENTER = { lat: 18.5849503, lng: 73.7377211 }; // Default fallback
const CAMPUS_ZOOM = 18;

// Dynamic campus data based on user location
let campusData = {
  fireExtinguishers: [],
  exitRoutes: [],
  safeAssemblyZones: [],
  floodProneAreas: []
};

// Function to generate location-specific data based on user coordinates
function generateLocationBasedData(userLat, userLng) {
  // Calculate offsets from user location for precise positioning
  const offset = 0.0005; // Approximately 50 meters
  
  campusData = {
    fireExtinguishers: [
      { 
        id: "fe-1", 
        name: "Building A - Ground Floor", 
        coords: [userLat + offset, userLng + offset] 
      },
      { 
        id: "fe-2", 
        name: "Building B - Main Entrance", 
        coords: [userLat - offset, userLng + offset] 
      }
    ],
    exitRoutes: [
      { 
        id: "ex-1", 
        name: "Primary Exit Route", 
        coords: [
          [userLat - offset, userLng - offset], // Start point
          [userLat, userLng], // Mid point
          [userLat + offset, userLng + offset] // End point
        ] 
      }
    ],
    safeAssemblyZones: [
      { 
        id: "as-1", 
        name: "Main Assembly Area", 
        marker: [userLat + offset, userLng - offset], 
        area: [
          [userLat + offset, userLng - offset],
          [userLat + offset * 0.5, userLng - offset],
          [userLat + offset * 0.5, userLng - offset * 0.5],
          [userLat + offset, userLng - offset * 0.5]
        ] 
      }
    ],
    floodProneAreas: [
      { 
        id: "fl-1", 
        name: "Low-Lying Area", 
        marker: [userLat - offset, userLng - offset], 
        area: [
          [userLat - offset, userLng - offset],
          [userLat - offset * 0.5, userLng - offset],
          [userLat - offset * 0.5, userLng - offset * 0.5],
          [userLat - offset, userLng - offset * 0.5]
        ] 
      }
    ]
  };
}

// Function to update map center based on user location
function updateMapCenter(lat, lng) {
  CAMPUS_CENTER = { lat: lat, lng: lng };
  map.setView([lat, lng], CAMPUS_ZOOM);
  
  // Generate location-specific data
  generateLocationBasedData(lat, lng);
  
  // Re-render the map with new data
  renderInitialData();
  
  // Show location indicator
  showLocationIndicator();
  
  console.log(`🗺️ Map center updated to: ${lat}, ${lng}`);
}

// Function to get user location from various sources
function getUserLocation() {
  // Try to get location from URL parameters first
  const urlParams = new URLSearchParams(window.location.search);
  const lat = urlParams.get('lat');
  const lng = urlParams.get('lng');
  
  if (lat && lng) {
    updateMapCenter(parseFloat(lat), parseFloat(lng));
    return;
  }
  
  // Try to get from localStorage (set by profile dashboard)
  const storedLocation = localStorage.getItem('userLocation');
  if (storedLocation) {
    try {
      const location = JSON.parse(storedLocation);
      updateMapCenter(location.lat, location.lng);
      return;
    } catch (e) {
      console.warn('Failed to parse stored location:', e);
    }
  }
  
  // Fallback to geolocation API
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateMapCenter(lat, lng);
        // Store for future use
        localStorage.setItem('userLocation', JSON.stringify({ lat, lng }));
      },
      () => {
        console.warn('Geolocation failed, using default campus center');
        generateLocationBasedData(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
        renderInitialData();
      }
    );
  } else {
    // Use default location
    generateLocationBasedData(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
    renderInitialData();
  }
}

// Function to show location indicator
function showLocationIndicator() {
  const indicator = document.getElementById('locationIndicator');
  const text = document.getElementById('currentLocationText');
  
  if (indicator && text) {
    indicator.style.display = 'block';
    text.textContent = `Map centered at: ${CAMPUS_CENTER.lat.toFixed(6)}, ${CAMPUS_CENTER.lng.toFixed(6)}`;
  }
}

// --- MAP & LAYERS ---------------------------------------------------------
const map = L.map("map", { center: CAMPUS_CENTER, zoom: CAMPUS_ZOOM, preferCanvas: true });

// Base layers (OSM + Satellite for accuracy)
const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20, attribution: "© OpenStreetMap contributors"
}).addTo(map);

const esriSat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
  attribution: "Esri"
});

const baseMaps = { "OpenStreetMap": osm, "Satellite": esriSat };

// Feature groups (visible + editable)
const layerFire = L.featureGroup().addTo(map);
const layerExits = L.featureGroup().addTo(map);
const layerAssembly = L.featureGroup().addTo(map);
const layerFlood = L.featureGroup().addTo(map);

// editableLayers holds all drawn layers for editing/deleting
const editableLayers = L.featureGroup().addTo(map);

// Enhanced icons with better visibility
const redIcon = L.icon({ 
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png", 
  iconSize: [32, 32], 
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const greenIcon = L.icon({ 
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/green-dot.png", 
  iconSize: [32, 32], 
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const yellowIcon = L.icon({ 
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/yellow-dot.png", 
  iconSize: [32, 32], 
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

const blueIcon = L.icon({ 
  iconUrl: "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png", 
  iconSize: [32, 32], 
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Add layer control
const overlayMaps = {
  "🔴 Fire Safety Points": layerFire,
  "🟢 Exit Routes": layerExits,
  "🟡 Assembly Zones": layerAssembly,
  "🔵 Flood-Prone Areas": layerFlood
};
L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

// --- HELPERS ---------------------------------------------------------------
function uid(prefix="id"){ 
  return prefix + "-" + Date.now().toString(36).slice(-6) + "-" + Math.random().toString(36).slice(2,6); 
}

function latLngsToArray(lls){
  if (!Array.isArray(lls) || !lls.length) return [];
  if (Array.isArray(lls[0]) && lls[0].lat === undefined) {
    return lls[0].map(p => [p.lat, p.lng]);
  }
  if (lls[0].lat !== undefined) return lls.map(p => [p.lat, p.lng]);
  return lls.map(arr => arr.map(p => [p.lat, p.lng])).flat();
}

function arrayToLatLngs(arr){
  return arr.map(a => L.latLng(a[0], a[1]));
}

function computeCentroid(coords){
  if(!coords || !coords.length) return null;
  let lat = 0, lng = 0;
  coords.forEach(c => { lat += c[0]; lng += c[1]; });
  return [lat/coords.length, lng/coords.length];
}

// Enhanced rendering with precise positioning
function renderInitialData(){
  // Clear all layers
  layerFire.clearLayers(); 
  layerExits.clearLayers(); 
  layerAssembly.clearLayers(); 
  layerFlood.clearLayers(); 
  editableLayers.clearLayers();

  // Fire extinguishers with precise positioning
  campusData.fireExtinguishers.forEach(item => {
    const m = L.marker(item.coords, { icon: redIcon })
      .bindPopup(`
        <div style="text-align: center;">
          <h4 style="margin: 0 0 8px 0; color: #e10600;">${item.name}</h4>
          <p style="margin: 0; font-size: 12px;">Fire Safety Point</p>
          <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">
            Lat: ${item.coords[0].toFixed(6)}<br/>
            Lng: ${item.coords[1].toFixed(6)}
          </p>
        </div>
      `);
    m.feature = { properties: { id: item.id, name: item.name, category: "fire" } };
    m.addTo(layerFire);
    editableLayers.addLayer(m);
  });

  // Exit routes with arrows and precise positioning
  campusData.exitRoutes.forEach(item => {
    const pl = L.polyline(item.coords, { 
      color: "#17a34a", 
      weight: 6,
      opacity: 0.8
    }).bindPopup(`
      <div style="text-align: center;">
        <h4 style="margin: 0 0 8px 0; color: #17a34a;">${item.name}</h4>
        <p style="margin: 0; font-size: 12px;">Exit Route</p>
        <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">
          Start: ${item.coords[0][0].toFixed(6)}, ${item.coords[0][1].toFixed(6)}<br/>
          End: ${item.coords[item.coords.length-1][0].toFixed(6)}, ${item.coords[item.coords.length-1][1].toFixed(6)}
        </p>
      </div>
    `);
    pl.feature = { properties: { id: item.id, name: item.name, category: "exit" } };
    pl.addTo(layerExits);
    
    // Enhanced arrow decorator
    L.polylineDecorator(pl, {
      patterns: [{ 
        offset: 15, 
        repeat: 35, 
        symbol: L.Symbol.arrowHead({ 
          pixelSize: 10, 
          polygon: false, 
          pathOptions: { 
            stroke: true, 
            color: "#17a34a", 
            weight: 4,
            opacity: 0.9
          } 
        }) 
      }]
    }).addTo(layerExits);
    
    // Start marker
    if (item.coords && item.coords.length) {
      const start = item.coords[0];
      const m = L.marker(start, { icon: greenIcon })
        .bindPopup(`
          <div style="text-align: center;">
            <h4 style="margin: 0 0 8px 0; color: #17a34a;">Exit Start</h4>
            <p style="margin: 0; font-size: 12px;">${item.name}</p>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">
              Lat: ${start[0].toFixed(6)}<br/>
              Lng: ${start[1].toFixed(6)}
            </p>
          </div>
        `);
      m.feature = { properties: { id: item.id + "-start", name: "Exit start", category: "exit-start", parentId: item.id } };
      m.addTo(layerExits);
      editableLayers.addLayer(pl);
      editableLayers.addLayer(m);
    } else {
      editableLayers.addLayer(pl);
    }
  });

  // Assembly zones with precise positioning
  campusData.safeAssemblyZones.forEach(item => {
    const poly = L.polygon(item.area, { 
      color: "#d4b030", 
      weight: 3, 
      fillColor: "#ffd84d", 
      fillOpacity: 0.4 
    }).bindPopup(`
      <div style="text-align: center;">
        <h4 style="margin: 0 0 8px 0; color: #d4b030;">${item.name}</h4>
        <p style="margin: 0; font-size: 12px;">Assembly Zone</p>
        <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">
          Center: ${item.marker[0].toFixed(6)}, ${item.marker[1].toFixed(6)}
        </p>
      </div>
    `);
    poly.feature = { properties: { id: item.id, name: item.name, category: "assembly" } };
    poly.addTo(layerAssembly);
    
    // Center marker
    const mark = item.marker || computeCentroid(item.area);
    const m = L.marker(mark, { icon: yellowIcon })
      .bindPopup(`
        <div style="text-align: center;">
          <h4 style="margin: 0 0 8px 0; color: #d4b030;">${item.name}</h4>
          <p style="margin: 0; font-size: 12px;">Assembly Point</p>
          <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">
            Lat: ${mark[0].toFixed(6)}<br/>
            Lng: ${mark[1].toFixed(6)}
          </p>
        </div>
      `);
    m.feature = { properties: { id: item.id + "-mark", name: item.name, category: "assembly-marker", parentId: item.id } };
    m.addTo(layerAssembly);
    editableLayers.addLayer(poly);
    editableLayers.addLayer(m);
  });

  // Flood areas with precise positioning
  campusData.floodProneAreas.forEach(item => {
    const poly = L.polygon(item.area, { 
      color: "#2f7ad6", 
      weight: 3, 
      fillColor: "#4da3ff", 
      fillOpacity: 0.4 
    }).bindPopup(`
      <div style="text-align: center;">
        <h4 style="margin: 0 0 8px 0; color: #2f7ad6;">${item.name}</h4>
        <p style="margin: 0; font-size: 12px;">Flood-Prone Area</p>
        <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">
          Center: ${item.marker[0].toFixed(6)}, ${item.marker[1].toFixed(6)}
        </p>
      </div>
    `);
    poly.feature = { properties: { id: item.id, name: item.name, category: "flood" } };
    poly.addTo(layerFlood);
    
    // Center marker
    const mark = item.marker || computeCentroid(item.area);
    const m = L.marker(mark, { icon: blueIcon })
      .bindPopup(`
        <div style="text-align: center;">
          <h4 style="margin: 0 0 8px 0; color: #2f7ad6;">${item.name}</h4>
          <p style="margin: 0; font-size: 12px;">Flood-Prone Area</p>
          <p style="margin: 4px 0 0 0; font-size: 10px; color: #666;">
            Lat: ${mark[0].toFixed(6)}<br/>
            Lng: ${mark[1].toFixed(6)}
          </p>
        </div>
      `);
    m.feature = { properties: { id: item.id + "-mark", name: item.name, category: "flood-marker", parentId: item.id } };
    m.addTo(layerFlood);
    editableLayers.addLayer(poly);
    editableLayers.addLayer(m);
  });
}

// Initialize with user location
getUserLocation();


// --- DRAW CONTROLS (leaflet.draw) -----------------------------------------
const drawControl = new L.Control.Draw({
  edit: {
    featureGroup: editableLayers,
    poly: { allowIntersection: false }
  },
  draw: {
    polygon: true,
    polyline: true,
    rectangle: false,
    circle: false,
    marker: true,
    circlemarker: false
  }
});
map.addControl(drawControl);

// helper to add new item into campusData and map layers
function pushToDataAndMap(kind, obj, layer){
  // kind: 'fire','exit','assembly','flood'
  if(kind === 'fire'){
    const id = uid("fe");
    campusData.fireExtinguishers.push({ id, name: obj.name, coords: obj.coords });
    layer.feature = { properties: { id, name: obj.name, category: "fire" } };
    layer.bindPopup(`<b>${obj.name}</b><br/>Fire safety point`);
    layer.addTo(layerFire);
    editableLayers.addLayer(layer);
  } else if(kind === 'exit'){
    const id = uid("ex");
    campusData.exitRoutes.push({ id, name: obj.name, coords: obj.coords });
    layer.feature = { properties: { id, name: obj.name, category: "exit" } };
    layer.bindPopup(`<b>${obj.name}</b><br/>Exit route`);
    layer.addTo(layerExits);

    L.polylineDecorator(layer, {
      patterns: [{ offset: 12, repeat: 28, symbol: L.Symbol.arrowHead({ pixelSize:8, polygon: false, pathOptions: { stroke:true, color:"#17a34a", weight:3 } }) }]
    }).addTo(layerExits);
    // add start marker
    if (obj.coords && obj.coords.length){
      const start = obj.coords[0];
      const m = L.marker(start, { icon: greenIcon }).bindPopup(`<b>Exit start: ${obj.name}</b>`);
      m.feature = { properties: { id: id + "-start", name: "Exit start", category: "exit-start", parentId: id } };
      m.addTo(layerExits);
      editableLayers.addLayer(layer);
      editableLayers.addLayer(m);
    } else {
      editableLayers.addLayer(layer);
    }
  } else if(kind === 'assembly'){
    const id = uid("as");
    campusData.safeAssemblyZones.push({ id, name: obj.name, marker: obj.marker, area: obj.area });
    const poly = L.polygon(obj.area, { color: "#d4b030", weight:2, fillColor:"#ffd84d", fillOpacity:0.35 }).bindPopup(`<b>${obj.name}</b><br/>Assembly zone`);
    poly.feature = { properties: { id, name: obj.name, category: "assembly" } };
    poly.addTo(layerAssembly);
    const m = L.marker(obj.marker, { icon: yellowIcon }).bindPopup(`<b>${obj.name}</b><br/>Assembly point`);
    m.feature = { properties: { id: id + "-mark", name: obj.name, category: "assembly-marker", parentId: id } };
    m.addTo(layerAssembly);
    editableLayers.addLayer(poly);
    editableLayers.addLayer(m);
  } else if(kind === 'flood'){
    const id = uid("fl");
    campusData.floodProneAreas.push({ id, name: obj.name, marker: obj.marker, area: obj.area });
    const poly = L.polygon(obj.area, { color: "#2f7ad6", weight:2, fillColor:"#4da3ff", fillOpacity:0.35 }).bindPopup(`<b>${obj.name}</b><br/>Flood-prone area`);
    poly.feature = { properties: { id, name: obj.name, category: "flood" } };
    poly.addTo(layerFlood);
    const m = L.marker(obj.marker, { icon: blueIcon }).bindPopup(`<b>${obj.name}</b><br/>Flood-prone area`);
    m.feature = { properties: { id: id + "-mark", name: obj.name, category: "flood-marker", parentId: id } };
    m.addTo(layerFlood);
    editableLayers.addLayer(poly);
    editableLayers.addLayer(m);
  }
}

// --- DRAW EVENT HANDLERS ---------------------------------------------------
map.on(L.Draw.Event.CREATED, function(e){
  const type = e.layerType;
  const layer = e.layer;
  const category = document.getElementById("categorySelect").value;

  // ask for a name
  let defaultName = category === 'fire' ? 'Fire Extinguisher' : (category === 'exit' ? 'Exit Route' : (category === 'exit-start' ? 'Exit Start' : (category === 'assembly' ? 'Assembly Zone' : 'Flood Zone')));
  const name = window.prompt("Enter a name/label for this feature:", defaultName) || defaultName;

  if (type === 'marker') {
    const latlng = layer.getLatLng();
    if (category === 'fire') {
      pushToDataAndMap('fire', { name, coords: [latlng.lat, latlng.lng] }, layer);
    } else if (category === 'exit-start') {
      // create a tiny exit route entry with only start marker OR create a plain marker in exit layer
      const id = uid("exs");
      layer.feature = { properties: { id, name, category: "exit-start" } };
      layer.bindPopup(`<b>${name}</b><br/>Exit start point`).addTo(layerExits);
      editableLayers.addLayer(layer);
      // store as a minimal exitRoutes entry (start-only) or separate list — here we store a tiny exitRoutes entry for reference
      campusData.exitRoutes.push({ id, name, coords: [[latlng.lat, latlng.lng]] });
    } else if (category === 'assembly') {
      // marker-only assembly (user may prefer point rather than polygon)
      pushToDataAndMap('assembly', { name, marker: [latlng.lat, latlng.lng], area: [[latlng.lat, latlng.lng]] }, layer);
    } else if (category === 'flood') {
      pushToDataAndMap('flood', { name, marker: [latlng.lat, latlng.lng], area: [[latlng.lat, latlng.lng]] }, layer);
    } else {
      // default put in fire
      pushToDataAndMap('fire', { name, coords: [latlng.lat, latlng.lng] }, layer);
    }
  }

  if (type === 'polyline') {
    const coords = latLngsToArray(layer.getLatLngs());
    if (category === 'exit') {
      pushToDataAndMap('exit', { name, coords }, layer);
    } else {
      // user drew polyline but selected another category: add visually but warn
      layer.bindPopup(`<b>${name}</b><br/>Polyline`).addTo(map);
      editableLayers.addLayer(layer);
    }
  }

  if (type === 'polygon') {
    const coords = latLngsToArray(layer.getLatLngs());
    const centroid = computeCentroid(coords);
    if (category === 'assembly') {
      pushToDataAndMap('assembly', { name, marker: centroid, area: coords }, layer);
    } else if (category === 'flood') {
      pushToDataAndMap('flood', { name, marker: centroid, area: coords }, layer);
    } else {
      // fallback: add to map
      layer.bindPopup(`<b>${name}</b><br/>Polygon`).addTo(map);
      editableLayers.addLayer(layer);
    }
  }
});

// When user edits shapes, sync coordinates back into campusData
map.on(L.Draw.Event.EDITED, function(e){
  e.layers.eachLayer(layer => {
    const props = layer.feature && layer.feature.properties;
    if (!props || !props.id) return;
    const id = props.id;
    const category = props.category || props.category; // may not be set
    // find and update relevant record
    // check each collection for matching id or parentId
    function updateInCollection(coll, matchKey, updater){
      for (let i=0;i<coll.length;i++){
        if (coll[i].id === matchKey || coll[i].id + "-mark" === matchKey || coll[i].id + "-start" === matchKey) {
          updater(coll[i]);
          return true;
        }
        // also check parentId matches
        if (coll[i].id === props.parentId) {
          updater(coll[i]);
          return true;
        }
      }
      return false;
    }

    const latlngs = layer.getLatLngs ? layer.getLatLngs() : null;
    if (layer instanceof L.Marker) {
      const pos = layer.getLatLng();
      // find matching marker in data collections by id
      // check fire
      let updated = updateInCollection(campusData.fireExtinguishers, id, (rec)=> rec.coords = [pos.lat, pos.lng]);
      if (updated) return;
      // assembly marker parent update
      updated = updateInCollection(campusData.safeAssemblyZones, id, (rec)=> rec.marker = [pos.lat, pos.lng]);
      if (updated) return;
      // flood marker parent update
      updated = updateInCollection(campusData.floodProneAreas, id, (rec)=> rec.marker = [pos.lat, pos.lng]);
      if (updated) return;
      // exit start
      updated = updateInCollection(campusData.exitRoutes, id, (rec)=> { if (rec.coords && rec.coords.length) rec.coords[0] = [pos.lat, pos.lng]; else rec.coords = [[pos.lat,pos.lng]]; });
      if (updated) return;
    } else if (layer instanceof L.Polyline) {
      const arr = latLngsToArray(latlngs);
      // exitRoutes
      for (let i=0;i<campusData.exitRoutes.length;i++){
        if (campusData.exitRoutes[i].id === id || (props.parentId && campusData.exitRoutes[i].id === props.parentId)) {
          campusData.exitRoutes[i].coords = arr;
          // also update the little start marker if present by removing and redrawing
          // easiest approach: re-render all
          renderInitialData();
          return;
        }
      }
      // polygons -> assembly/flood
      for (let i=0;i<campusData.safeAssemblyZones.length;i++){
        if (campusData.safeAssemblyZones[i].id === id) {
          campusData.safeAssemblyZones[i].area = arr;
          campusData.safeAssemblyZones[i].marker = computeCentroid(arr);
          renderInitialData();
          return;
        }
      }
      for (let i=0;i<campusData.floodProneAreas.length;i++){
        if (campusData.floodProneAreas[i].id === id) {
          campusData.floodProneAreas[i].area = arr;
          campusData.floodProneAreas[i].marker = computeCentroid(arr);
          renderInitialData();
          return;
        }
      }
    }
  });
});

// When user deletes shapes, remove them from campusData
map.on(L.Draw.Event.DELETED, function(e){
  e.layers.eachLayer(layer => {
    const props = layer.feature && layer.feature.properties;
    if (!props) return;
    const id = props.id;
    // remove by id (or parentId)
    function removeById(coll){
      const idx = coll.findIndex(it => it.id === id || it.id + "-mark" === id || it.id + "-start" === id);
      if (idx >= 0) { coll.splice(idx,1); return true; }
      // sometimes id is a child marker with parentId
      const idx2 = coll.findIndex(it => (props.parentId && it.id === props.parentId));
      if (idx2 >= 0) { coll.splice(idx2,1); return true; }
      return false;
    }
    if (removeById(campusData.fireExtinguishers)) return;
    if (removeById(campusData.exitRoutes)) return;
    if (removeById(campusData.safeAssemblyZones)) return;
    if (removeById(campusData.floodProneAreas)) return;
  });
  // re-render to ensure visual consistency (start-markers etc.)
  renderInitialData();
});

// --- EXPORT / UI BUTTONS --------------------------------------------------
document.getElementById("exportJsonBtn").addEventListener("click", () => {
  const pretty = JSON.stringify(campusData, null, 2);
  const blob = new Blob([pretty], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "campus-data.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

document.getElementById("clearAllBtn").addEventListener("click", () => {
  if (!confirm("This will clear all features from the map (local only). Are you sure?")) return;
  campusData.fireExtinguishers = [];
  campusData.exitRoutes = [];
  campusData.safeAssemblyZones = [];
  campusData.floodProneAreas = [];
  renderInitialData();
});

// Fit bounds to content (if any)
function fitBoundsToData(){
  const group = L.featureGroup();
  [layerFire, layerExits, layerAssembly, layerFlood].forEach(l => l.eachLayer(layer => group.addLayer(layer)));
  if (group.getLayers().length) map.fitBounds(group.getBounds().pad(0.08));
}
fitBoundsToData();

// --- END -------------------------------------------------------------------
