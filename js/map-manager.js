/**
 * Map Manager - PROJETO: ENERGIA LIMPA
 * High-performance map with Google Maps High-Res Satellite/Hybrid tiles,
 * collapsible coordinates toggle button, SIRGAS 2000 (EPSG:4674) UTM converter,
 * GPS location, and automatic framing for Calha Norte & Oiapoque.
 */

class MapManager {
  constructor() {
    this.map1 = null;
    this.activeBasemap = "googleHybrid"; // Default high-res Google Satellite + Labels
    this.basemaps1 = {};
    this.userLocationMarker = null;

    // Study Area Bounds (Calha Norte do Pará, Amazonas, Roraima & Oiapoque Amapá)
    this.studyAreaBounds = L.latLngBounds(
      L.latLng(-4.0, -61.0), // South-West
      L.latLng(5.2, -50.5)   // North-East
    );
    this.defaultCenter = [0.8, -55.2];
    this.defaultZoom = 6;
  }

  init() {
    this.initMap();
    this.setupBasemapSwitcher();
    this.setupQuickControls();
    this.setupCoordinatesTracker();
  }

  getBasemapLayers() {
    return {
      googleHybrid: L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        attribution: '&copy; Google Maps',
        maxZoom: 20
      }),
      googleSat: L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        attribution: '&copy; Google Maps',
        maxZoom: 20
      }),
      dark: L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap',
        maxZoom: 19,
        subdomains: "abcd"
      }),
      satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 19
      }),
      topo: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenTopoMap',
        maxZoom: 17
      }),
      osm: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
      })
    };
  }

  initMap() {
    this.map1 = L.map("map1", {
      center: this.defaultCenter,
      zoom: this.defaultZoom,
      minZoom: 4,
      maxZoom: 20,
      maxBounds: [
        [-25.0, -90.0],
        [25.0, -30.0]
      ],
      maxBoundsViscosity: 0.8,
      zoomControl: false,
      attributionControl: false
    });

    L.control.attribution({ position: "bottomright", prefix: false }).addTo(this.map1);
    this.basemaps1 = this.getBasemapLayers();
    this.basemaps1[this.activeBasemap].addTo(this.map1);
  }

  setupBasemapSwitcher() {
    const toggleBtn = document.getElementById("btn-basemap-toggle");
    const menu = document.getElementById("basemap-dropdown-menu");

    if (toggleBtn && menu) {
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("open");
        toggleBtn.classList.toggle("active");
      });

      document.addEventListener("click", (e) => {
        if (!menu.contains(e.target) && e.target !== toggleBtn) {
          menu.classList.remove("open");
          toggleBtn.classList.remove("active");
        }
      });
    }

    document.querySelectorAll(".basemap-menu-item").forEach(btn => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.basemap;
        this.setBasemap(type);

        document.querySelectorAll(".basemap-menu-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const labelSpan = document.getElementById("active-basemap-label");
        if (labelSpan) {
          labelSpan.textContent = btn.querySelector("span") ? btn.querySelector("span").textContent : type;
        }

        if (menu) menu.classList.remove("open");
        if (toggleBtn) toggleBtn.classList.remove("active");
      });
    });
  }

  setBasemap(type) {
    if (!this.basemaps1[type]) return;

    if (this.basemaps1[this.activeBasemap]) {
      this.map1.removeLayer(this.basemaps1[this.activeBasemap]);
    }
    this.activeBasemap = type;
    this.basemaps1[type].addTo(this.map1);
    this.basemaps1[type].bringToBack();
  }

  setupQuickControls() {
    const zoomInBtn = document.getElementById("btn-zoom-in");
    const zoomOutBtn = document.getElementById("btn-zoom-out");
    const homeBtn = document.getElementById("btn-zoom-home");
    const locateBtn = document.getElementById("btn-locate-user");

    if (zoomInBtn) zoomInBtn.addEventListener("click", () => this.map1.zoomIn());
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => this.map1.zoomOut());

    if (homeBtn) {
      homeBtn.addEventListener("click", () => this.resetToStudyArea());
    }

    if (locateBtn) {
      locateBtn.addEventListener("click", () => this.locateUser());
    }
  }

  resetToStudyArea() {
    if (this.map1) {
      this.map1.fitBounds(this.studyAreaBounds, { padding: [30, 30], animate: true });
      if (window.App && window.App.showToast) {
        window.App.showToast("Câmera centralizada na Área do Projeto.");
      }
    }
  }

  locateUser() {
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    const locateBtn = document.getElementById("btn-locate-user");
    if (locateBtn) locateBtn.classList.add("active");

    if (window.App && window.App.showToast) {
      window.App.showToast("Buscando sua localização GPS...");
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        if (this.userLocationMarker) {
          this.map1.removeLayer(this.userLocationMarker);
        }

        const iconHtml = `
          <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(234,88,12,0.4);animation:markerPulse 2s infinite;"></div>
            <div style="width:14px;height:14px;background:#ea580c;border:2px solid #ffffff;border-radius:50%;box-shadow:0 0 8px rgba(0,0,0,0.6);"></div>
          </div>
        `;
        const customIcon = L.divIcon({ html: iconHtml, className: "", iconSize: [24, 24], iconAnchor: [12, 12] });

        this.userLocationMarker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map1);
        this.userLocationMarker.bindPopup(`
          <div style="padding:0.5rem;font-size:0.8rem">
            <strong style="color:#ea580c">Sua Localização Atual</strong><br>
            Lat: ${lat.toFixed(5)}°, Long: ${lng.toFixed(5)}°<br>
            <span style="font-size:0.75rem;color:#a8a29e">Precisão: ±${Math.round(accuracy)} metros</span>
          </div>
        `).openPopup();

        this.map1.setView([lat, lng], 13, { animate: true });

        if (locateBtn) locateBtn.classList.remove("active");
        if (window.App && window.App.showToast) {
          window.App.showToast("Localização encontrada com sucesso!");
        }
      },
      err => {
        if (locateBtn) locateBtn.classList.remove("active");
        console.warn("Erro ao obter localização GPS:", err);
        alert("Não foi possível obter sua localização GPS. Verifique as permissões do seu navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  /**
   * High-precision Transverse Mercator (UTM) conversion for SIRGAS 2000 / GRS80
   */
  calcSIRGAS2000UTM(latDeg, lngDeg) {
    let lng = ((lngDeg + 180) % 360 + 360) % 360 - 180;
    let lat = latDeg;

    const a = 6378137.0;
    const f = 1 / 298.257222101;
    const b = a * (1 - f);
    const e2 = (a * a - b * b) / (a * a);
    const ePrime2 = (a * a - b * b) / (b * b);
    const k0 = 0.9996;

    const zone = Math.floor((lng + 180) / 6) + 1;
    const lambda0Deg = (zone - 1) * 6 - 180 + 3;
    const lambda0 = (lambda0Deg * Math.PI) / 180;

    const phi = (lat * Math.PI) / 180;
    const lambda = (lng * Math.PI) / 180;

    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) * Math.sin(phi));
    const T = Math.tan(phi) * Math.tan(phi);
    const C = ePrime2 * Math.cos(phi) * Math.cos(phi);
    const A = Math.cos(phi) * (lambda - lambda0);

    const M = a * (
      (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * phi -
      (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * Math.sin(2 * phi) +
      (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * Math.sin(4 * phi) -
      (35 * e2 * e2 * e2 / 3072) * Math.sin(6 * phi)
    );

    let easting = k0 * N * (
      A +
      (1 - T + C) * Math.pow(A, 3) / 6 +
      (5 - 18 * T + T * T + 72 * C - 58 * ePrime2) * Math.pow(A, 5) / 120
    ) + 500000;

    let northing = k0 * (
      M +
      N * Math.tan(phi) * (
        Math.pow(A, 2) / 2 +
        (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 +
        (61 - 58 * T + T * T + 600 * C - 330 * ePrime2) * Math.pow(A, 6) / 720
      )
    );

    const isSouth = lat < 0;
    if (isSouth) {
      northing += 10000000;
    }

    const hemi = isSouth ? "S" : "N";
    return {
      zone: zone,
      hemi: hemi,
      fuso: `Fuso ${zone}${hemi}`,
      easting: Math.round(easting),
      northing: Math.round(northing),
      formatted: `UTM ${zone}${hemi} (E: ${Math.round(easting).toLocaleString('pt-BR')} m, N: ${Math.round(northing).toLocaleString('pt-BR')} m)`
    };
  }

  setupCoordinatesTracker() {
    const coordToggleBtn = document.getElementById("btn-coord-toggle");
    const coordPopover = document.getElementById("coord-popover-box");
    const latSpan = document.getElementById("coord-lat");
    const lngSpan = document.getElementById("coord-lng");
    const utmSpan = document.getElementById("coord-utm");
    const zoomSpan = document.getElementById("coord-zoom");
    const buttonCoordText = document.getElementById("coord-btn-preview");

    if (coordToggleBtn && coordPopover) {
      coordToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        coordPopover.classList.toggle("open");
        coordToggleBtn.classList.toggle("active");
      });

      document.addEventListener("click", (e) => {
        if (!coordPopover.contains(e.target) && e.target !== coordToggleBtn) {
          coordPopover.classList.remove("open");
          coordToggleBtn.classList.remove("active");
        }
      });
    }

    if (!latSpan || !lngSpan) return;

    this.map1.on("mousemove", e => {
      const lat = e.latlng.lat;
      const wrappedLng = e.latlng.wrap().lng;

      latSpan.textContent = lat.toFixed(5) + "°";
      lngSpan.textContent = wrappedLng.toFixed(5) + "°";

      if (buttonCoordText) {
        buttonCoordText.textContent = `${lat.toFixed(3)}°, ${wrappedLng.toFixed(3)}°`;
      }

      if (utmSpan) {
        const utmData = this.calcSIRGAS2000UTM(lat, wrappedLng);
        utmSpan.innerHTML = `<span class="badge-sirgas">SIRGAS 2000</span> ${utmData.formatted}`;
      }

      if (zoomSpan) {
        zoomSpan.textContent = "Zoom " + this.map1.getZoom();
      }
    });

    this.map1.on("zoomend", () => {
      if (zoomSpan) zoomSpan.textContent = "Zoom " + this.map1.getZoom();
    });
  }

  addLayer(layer) {
    if (this.map1 && layer) {
      layer.addTo(this.map1);
    }
  }

  removeLayer(layer) {
    if (this.map1 && layer) {
      this.map1.removeLayer(layer);
    }
  }

  fitBounds(bounds) {
    if (this.map1 && bounds && bounds.isValid && bounds.isValid()) {
      this.map1.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }
}

if (typeof window !== "undefined") {
  window.MapManager = MapManager;
}
