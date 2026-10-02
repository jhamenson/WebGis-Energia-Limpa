/**
 * =============================================================================
 * [PT-BR] GERENCIADOR DO MAPA LEAFLET & BASES CARTOGRÁFICAS
 * [EN] LEAFLET MAP MANAGER & CARTOGRAPHIC BASEMAPS
 * =============================================================================
 * Projeto: Energia Limpa, Vida Sustentável
 * Elaboração feita por: Jhamenson Nascimento
 * Referência Geodésica: SIRGAS 2000 (EPSG:4674)
 * 
 * [PT-BR] Controla a inicialização do Leaflet, camadas base (Google Híbrido,
 *         Satélite, Esri Dark Canvas sem marcas d'água, Relevo OSM), rastreador
 *         de coordenadas geodésicas e geolocalização GPS.
 * [EN] Controls Leaflet initialization, basemaps (Google Hybrid, Satellite,
 *         clean Esri Dark Canvas, OSM Topo), real-time geodetic tracker,
 *         and GPS location.
 * =============================================================================
 */

class MapManager {
  constructor() {
    /** [PT-BR] Instância principal do mapa / [EN] Main map instance */
    this.map1 = null;

    /** [PT-BR] Basemap ativo inicial (Google Híbrido HD) / [EN] Initial active basemap */
    this.activeBasemap = "googleHybrid";

    /** [PT-BR] Dicionário de camadas base / [EN] Basemap layers dictionary */
    this.basemaps1 = {};

    /** [PT-BR] Marcador de localização GPS do usuário / [EN] User GPS location marker */
    this.userLocationMarker = null;

    /**
     * [PT-BR] Limites geográficos da Área de Estudo (Calha Norte do Pará e Oiapoque Amapá)
     * [EN] Geographic bounding box of the Study Area (Calha Norte Pará & Oiapoque Amapá)
     */
    this.studyAreaBounds = L.latLngBounds(
      L.latLng(-4.0, -61.0), // Sudoeste / South-West
      L.latLng(5.2, -50.5)   // Nordeste / North-East
    );
    this.defaultCenter = [0.8, -55.2];
    this.defaultZoom = 6;
  }

  /**
   * [PT-BR] Inicialização dos serviços do mapa
   * [EN] Initialize all map services
   */
  init() {
    this.initMap();
    this.setupBasemapSwitcher();
    this.setupQuickControls();
    this.setupCoordinatesTracker();
  }

  /**
   * ===========================================================================
   * [PT-BR] PROVEDORES DE MAPAS BASE (TILES CARTOGRÁFICOS)
   * [EN] CARTOGRAPHIC BASEMAP TILE PROVIDERS
   * ===========================================================================
   */
  getBasemapLayers() {
    return {
      // 1. Google Híbrido HD (Satélite de Alta Resolução + Vias e Toponímia)
      //    Google Hybrid HD (High-Res Satellite + Roads and Labels)
      googleHybrid: L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}", {
        attribution: '&copy; Google Maps',
        maxZoom: 20
      }),

      // 2. Google Satélite Puro (Imagens Aéreas sem Textos)
      //    Google Satellite (Pure Aerial Imagery)
      googleSat: L.tileLayer("https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}", {
        attribution: '&copy; Google Maps',
        maxZoom: 20
      }),

      // 3. Esri Dark Canvas (Tema Escuro Oficial sem Marcas d'Água)
      //    Esri Dark Canvas (Official Dark Gray Base + Reference, No Watermarks)
      dark: L.layerGroup([
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
          attribution: '&copy; Esri, DeLorme, &copy; OpenStreetMap',
          maxZoom: 16
        }),
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 16
        })
      ]),

      // 4. Esri Satélite Global
      //    Esri World Imagery
      satellite: L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: '&copy; Esri, Maxar, Earthstar Geographics',
        maxZoom: 19
      }),

      // 5. Relevo Topográfico (Curvas de Nível e Altimetria)
      //    OpenTopoMap Topographic Relief & Contours
      topo: L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenTopoMap',
        maxZoom: 17
      })
    };
  }

  /**
   * ===========================================================================
   * [PT-BR] CRIAÇÃO DA INSTÂNCIA LEAFLET E ATRIBUIÇÃO OFICIAL
   * [EN] LEAFLET INSTANCE CREATION & OFFICIAL CARTOGRAPHIC ATTRIBUTION
   * ===========================================================================
   */
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

    // Atribuição de autoria científica oficial na barra inferior do mapa
    // Official scientific authorship attribution in bottom map bar
    L.control.attribution({
      position: "bottomright",
      prefix: 'Elaboração feita por <strong>Jhamenson Nascimento</strong> | <span style="color:#ea580c">SIRGAS 2000</span>'
    }).addTo(this.map1);

    this.basemaps1 = this.getBasemapLayers();
    this.basemaps1[this.activeBasemap].addTo(this.map1);

    // [PT-BR] Painéis de sobreposição com estratigrafia em camadas (Ordem de Bolo)
    //         Base: Territórios Indígenas (410) | Meio: Hidrografia (440) | Topo: Aldeias (550)
    // [EN] Stratigraphic overlay panes (Cake order: Areas -> Rivers -> Villages)
    this.map1.createPane("terrasPane");
    this.map1.getPane("terrasPane").style.zIndex = "410";

    this.map1.createPane("waterPane");
    this.map1.getPane("waterPane").style.zIndex = "440";

    this.map1.createPane("aldeiasPane");
    this.map1.getPane("aldeiasPane").style.zIndex = "550";

    // Renderiza ícones ao abrir popups
    // Render Lucide icons when popups are opened
    this.map1.on("popupopen", () => {
      if (window.lucide) {
        try { window.lucide.createIcons(); } catch (e) {}
      }
    });
  }

  /**
   * ===========================================================================
   * [PT-BR] SELETOR DE MAPAS BASE (DROPDOWN & INTERATIVIDADE)
   * [EN] BASEMAP SWITCHER DROPDOWN & INTERACTIVITY
   * ===========================================================================
   */
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

    // Listener de alternância de basemaps
    // Basemap switch listener
    const items = document.querySelectorAll(".basemap-menu-item");
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const selectedBasemap = item.getAttribute("data-basemap");
        this.switchBasemap(selectedBasemap);

        items.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        const label = item.querySelector("strong")?.innerText || "Mapa Base";
        const labelEl = document.getElementById("active-basemap-label");
        if (labelEl) labelEl.innerText = label;

        if (menu) menu.classList.remove("open");
        if (toggleBtn) toggleBtn.classList.remove("active");
      });
    });
  }

  /**
   * [PT-BR] Alterna dinamicamente a camada base ativa no Leaflet
   * [EN] Dynamically switches the active Leaflet basemap layer
   */
  switchBasemap(basemapKey) {
    if (this.basemaps1[this.activeBasemap]) {
      this.map1.removeLayer(this.basemaps1[this.activeBasemap]);
    }
    if (this.basemaps1[basemapKey]) {
      this.basemaps1[basemapKey].addTo(this.map1);
      this.activeBasemap = basemapKey;
    }
  }

  /**
   * ===========================================================================
   * [PT-BR] CONTROLES RÁPIDOS (ZOOM +, ZOOM -, RE-ENQUADRAR, GPS)
   * [EN] QUICK FLOATING CONTROLS (ZOOM IN, ZOOM OUT, RE-CENTER, GPS)
   * ===========================================================================
   */
  setupQuickControls() {
    const zoomInBtn = document.getElementById("btn-zoom-in");
    const zoomOutBtn = document.getElementById("btn-zoom-out");
    const resetBtn = document.getElementById("btn-reset-view");
    const locateBtn = document.getElementById("btn-locate-user");

    if (zoomInBtn) {
      zoomInBtn.addEventListener("click", () => this.map1.zoomIn());
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener("click", () => this.map1.zoomOut());
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => this.resetToStudyArea());
    }

    if (locateBtn) {
      locateBtn.addEventListener("click", () => this.locateUser());
    }
  }

  /**
   * [PT-BR] Re-enquadra a visualização nos limites das áreas de estudo
   * [EN] Re-centers and fits bounds to research study areas
   */
  resetToStudyArea() {
    if (this.map1 && this.studyAreaBounds) {
      this.map1.flyToBounds(this.studyAreaBounds, {
        padding: [30, 30],
        duration: 1.2
      });
    }
  }

  /**
   * [PT-BR] Ajusta os limites da câmera para uma geometria específica
   * [EN] Fits map camera to specific geometry bounds
   */
  fitBounds(bounds) {
    if (this.map1 && bounds && bounds.isValid()) {
      this.map1.flyToBounds(bounds, {
        padding: [40, 40],
        duration: 1.0,
        maxZoom: 14
      });
    }
  }

  /**
   * ===========================================================================
   * [PT-BR] GEOLOCALIZAÇÃO GPS DO USUÁRIO
   * [EN] USER GPS GEOLOCATION ENGINE
   * ===========================================================================
   */
  locateUser() {
    if (!navigator.geolocation) {
      if (window.App) window.App.showToast("Geolocalização não suportada pelo seu navegador.");
      return;
    }

    if (window.App) window.App.showToast("Obtendo localização GPS...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        if (this.userLocationMarker) {
          this.map1.removeLayer(this.userLocationMarker);
        }

        // Marcador visual com círculo de precisão
        // Visual marker with accuracy buffer circle
        this.userLocationMarker = L.layerGroup([
          L.circle([lat, lng], {
            radius: accuracy,
            color: "#ea580c",
            fillColor: "#ea580c",
            fillOpacity: 0.15,
            weight: 1.5
          }),
          L.circleMarker([lat, lng], {
            radius: 8,
            color: "#ffffff",
            fillColor: "#ea580c",
            fillOpacity: 1,
            weight: 2.5
          })
        ]).addTo(this.map1);

        this.map1.flyTo([lat, lng], 14, { duration: 1.2 });
        if (window.App) {
          window.App.showToast(`GPS localizado (Precisão: ±${Math.round(accuracy)}m)`);
        }
      },
      (err) => {
        if (window.App) {
          window.App.showToast("Permissão de GPS negada ou sinal indisponível.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  /**
   * ===========================================================================
   * [PT-BR] RASTREADOR DE COORDENADAS GEODÉSICAS EM TEMPO REAL
   * [EN] REAL-TIME GEODETIC COORDINATES TRACKER (SIRGAS 2000)
   * ===========================================================================
   */
  setupCoordinatesTracker() {
    const toggleBtn = document.getElementById("btn-coord-toggle");
    const popover = document.getElementById("coord-popover-box");
    const preview = document.getElementById("coord-btn-preview");
    const latEl = document.getElementById("coord-lat");
    const lngEl = document.getElementById("coord-lng");
    const utmEl = document.getElementById("coord-utm");
    const zoomEl = document.getElementById("coord-zoom");

    if (toggleBtn && popover) {
      toggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        popover.classList.toggle("open");
        toggleBtn.classList.toggle("active");
      });

      document.addEventListener("click", (e) => {
        if (!popover.contains(e.target) && e.target !== toggleBtn) {
          popover.classList.remove("open");
          toggleBtn.classList.remove("active");
        }
      });
    }

    const updateCoords = (lat, lng) => {
      if (preview) preview.textContent = `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
      if (latEl) latEl.textContent = `${lat.toFixed(5)}°`;
      if (lngEl) lngEl.textContent = `${lng.toFixed(5)}°`;
      if (zoomEl && this.map1) zoomEl.textContent = `Zoom ${this.map1.getZoom()}`;

      if (utmEl) {
        // Cálculo automático de fuso UTM SIRGAS 2000
        // Automatic SIRGAS 2000 UTM Zone calculation
        const zone = Math.floor((lng + 180) / 6) + 1;
        const hemi = lat >= 0 ? "N" : "S";
        utmEl.textContent = `UTM ${zone}${hemi} (SIRGAS 2000)`;
      }
    };

    // Rastreamento dinâmico no mouse e no toque
    // Dynamic tracking on mouse move and touch
    this.map1.on("mousemove", (e) => {
      updateCoords(e.latlng.lat, e.latlng.lng);
    });

    this.map1.on("move", () => {
      const center = this.map1.getCenter();
      updateCoords(center.lat, center.lng);
    });

    this.map1.on("click", (e) => {
      updateCoords(e.latlng.lat, e.latlng.lng);
    });

    this.map1.on("zoomend", () => {
      if (zoomEl) zoomEl.textContent = `Zoom ${this.map1.getZoom()}`;
    });
  }
}
