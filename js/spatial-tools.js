/**
 * Spatial Analysis & Measurement Tools for Geoportal WebGIS
 * Distance ruler, area calculator, coordinate inspector and geoprocessing utilities.
 */

class SpatialTools {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.activeTool = null; // 'distance', 'area', 'point'
    this.points = [];
    this.markers = [];
    this.activePolyline = null;
    this.activePolygon = null;
    this.tempGuide = null;
    this.measureLayerGroup = L.layerGroup();
  }

  init() {
    if (this.mapManager.map1) {
      this.measureLayerGroup.addTo(this.mapManager.map1);
    }
    this.setupUI();
    this.setupMapClickEvents();
  }

  setupUI() {
    const distBtn = document.getElementById("tool-btn-distance");
    const areaBtn = document.getElementById("tool-btn-area");
    const clearBtn = document.getElementById("tool-btn-clear");

    if (distBtn) {
      distBtn.addEventListener("click", () => this.toggleTool("distance", distBtn));
    }
    if (areaBtn) {
      areaBtn.addEventListener("click", () => this.toggleTool("area", areaBtn));
    }
    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearMeasurements());
    }
  }

  toggleTool(toolName, btnElement) {
    if (this.activeTool === toolName) {
      this.deactivateTool();
      return;
    }

    this.deactivateTool();
    this.activeTool = toolName;
    if (btnElement) btnElement.classList.add("active");

    const resultBox = document.getElementById("measurement-result");
    if (resultBox) {
      resultBox.classList.add("show");
      document.getElementById("measure-title").textContent =
        toolName === "distance" ? "Medição de Distância Ativa" : "Cálculo de Área Ativo";
      document.getElementById("measure-value").textContent = "Clique no mapa para adicionar pontos...";
    }

    // Change map cursor
    if (this.mapManager.map1) {
      this.mapManager.map1.getContainer().style.cursor = "crosshair";
    }
  }

  deactivateTool() {
    this.activeTool = null;
    document.querySelectorAll(".tool-btn").forEach(b => b.classList.remove("active"));
    if (this.mapManager.map1) {
      this.mapManager.map1.getContainer().style.cursor = "";
    }
  }

  clearMeasurements() {
    this.deactivateTool();
    this.points = [];
    this.measureLayerGroup.clearLayers();
    this.activePolyline = null;
    this.activePolygon = null;

    const resultBox = document.getElementById("measurement-result");
    if (resultBox) resultBox.classList.remove("show");

    if (window.App && window.App.showToast) {
      window.App.showToast("Medições limpas.");
    }
  }

  setupMapClickEvents() {
    if (!this.mapManager.map1) return;

    this.mapManager.map1.on("click", e => {
      if (!this.activeTool) return;
      this.addPoint(e.latlng);
    });

    this.mapManager.map1.on("mousemove", e => {
      if (!this.activeTool || this.points.length === 0) return;
      this.updateDynamicGuide(e.latlng);
    });

    // Double click to finish
    this.mapManager.map1.on("dblclick", e => {
      if (!this.activeTool) return;
      L.DomEvent.stopPropagation(e);
      this.finishMeasurement();
    });
  }

  addPoint(latlng) {
    this.points.push(latlng);

    // Create marker
    const marker = L.circleMarker(latlng, {
      radius: 5,
      color: "#ffffff",
      fillColor: "#10b981",
      fillOpacity: 1,
      weight: 2
    }).addTo(this.measureLayerGroup);

    this.markers.push(marker);

    if (this.activeTool === "distance") {
      if (!this.activePolyline) {
        this.activePolyline = L.polyline(this.points, {
          color: "#10b981",
          weight: 3,
          dashArray: "5, 5"
        }).addTo(this.measureLayerGroup);
      } else {
        this.activePolyline.setLatLngs(this.points);
      }
      this.calculateDistance();
    } else if (this.activeTool === "area") {
      if (this.points.length >= 3) {
        if (!this.activePolygon) {
          this.activePolygon = L.polygon(this.points, {
            color: "#06b6d4",
            fillColor: "#06b6d4",
            fillOpacity: 0.25,
            weight: 2,
            dashArray: "4, 4"
          }).addTo(this.measureLayerGroup);
        } else {
          this.activePolygon.setLatLngs(this.points);
        }
        this.calculateArea();
      }
    }
  }

  updateDynamicGuide(mouseLatLng) {
    const tempPoints = [...this.points, mouseLatLng];
    if (this.activeTool === "distance" && this.activePolyline) {
      this.activePolyline.setLatLngs(tempPoints);
    } else if (this.activeTool === "area" && this.activePolygon && this.points.length >= 2) {
      this.activePolygon.setLatLngs(tempPoints);
    }
  }

  calculateDistance() {
    let totalMeters = 0;
    for (let i = 0; i < this.points.length - 1; i++) {
      totalMeters += this.points[i].distanceTo(this.points[i + 1]);
    }

    let text = "";
    if (totalMeters >= 1000) {
      text = (totalMeters / 1000).toFixed(2) + " km";
    } else {
      text = Math.round(totalMeters) + " m";
    }

    const valEl = document.getElementById("measure-value");
    if (valEl) valEl.textContent = `Distância: ${text} (${this.points.length} vértices)`;
  }

  calculateArea() {
    if (this.points.length < 3) return;

    // Convert to GeoJSON polygon for Turf.js area calculation
    const coords = this.points.map(p => [p.lng, p.lat]);
    coords.push(coords[0]); // Close ring

    try {
      const polygon = turf.polygon([coords]);
      const areaM2 = turf.area(polygon);
      const areaHa = areaM2 / 10000;
      const areaKm2 = areaM2 / 1000000;

      let text = "";
      if (areaKm2 >= 1) {
        text = `${areaKm2.toFixed(2)} km² (${areaHa.toFixed(1)} hectares)`;
      } else {
        text = `${areaHa.toFixed(2)} ha (${Math.round(areaM2)} m²)`;
      }

      const valEl = document.getElementById("measure-value");
      if (valEl) valEl.textContent = `Área: ${text}`;
    } catch (e) {
      console.warn("Erro ao calcular área com Turf:", e);
    }
  }

  finishMeasurement() {
    if (this.activeTool === "distance") {
      this.calculateDistance();
    } else if (this.activeTool === "area") {
      this.calculateArea();
    }
    this.deactivateTool();
    if (window.App && window.App.showToast) {
      window.App.showToast("Medição concluída.");
    }
  }
}

if (typeof window !== "undefined") {
  window.SpatialTools = SpatialTools;
}
