/**
 * Application Orchestrator - PROJETO: ENERGIA LIMPA • ARQUEOLOGIA
 * Coordinates search index across all 4 layers (including 2,670 IPHAN Archaeological Sites and ANA Massa de Água),
 * keyboard shortcuts, tabs, and notifications.
 */

class App {
  constructor() {
    this.mapManager = null;
    this.layerCatalog = null;
    this.attributeTable = null;
    this.analyticsPanel = null;
    this.exportTools = null;
    this.searchIndex = [];
  }

  async start() {
    console.log("Inicializando WebGIS Arqueológico - Projeto: Energia Limpa...");

    if (window.lucide) {
      try { window.lucide.createIcons(); } catch(e) {}
    }

    // 1. Initialize Map Manager
    this.mapManager = new MapManager();
    this.mapManager.init();

    // 2. Initialize Layer Catalog
    this.layerCatalog = new LayerCatalog(this.mapManager);
    window.LayerCatalog = this.layerCatalog;

    // 3. Initialize Attribute Table
    this.attributeTable = new AttributeTable(this.layerCatalog, this.mapManager);
    window.AttributeTable = this.attributeTable;
    this.attributeTable.init();

    // 4. Initialize Analytics Panel
    if (typeof AnalyticsPanel !== "undefined") {
      this.analyticsPanel = new AnalyticsPanel(this.layerCatalog);
      window.AnalyticsPanel = this.analyticsPanel;
    }

    // 5. Initialize Export Tools
    if (typeof ExportTools !== "undefined") {
      this.exportTools = new ExportTools(this.mapManager, this.layerCatalog);
      this.exportTools.init();
    }

    // 6. Setup UI & Event Listeners
    this.setupSidebarTabs();
    this.setupSidebarToggle();
    this.setupSearch();
    this.setupKeyboardShortcuts();

    // 7. Load Layers asynchronously
    try {
      await this.layerCatalog.loadAllLayers();
    } catch(err) {
      console.error("Erro ao carregar camadas:", err);
    }

    if (window.lucide) {
      try { window.lucide.createIcons(); } catch(e) {}
    }

    this.showToast("WebGIS Arqueológico carregado em SIRGAS 2000!");
  }

  setupSidebarTabs() {
    const tabBtns = document.querySelectorAll(".sidebar-tab-btn");
    const contents = document.querySelectorAll(".sidebar-tab-content");
    const sidebar = document.getElementById("geoportal-sidebar");

    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.tab;
        const isMobile = window.matchMedia("(max-width: 767px)").matches;

        tabBtns.forEach(b => b.classList.remove("active"));
        contents.forEach(c => {
          c.classList.remove("active");
          c.classList.remove("fullscreen-mobile-open");
        });

        btn.classList.add("active");
        const targetEl = document.getElementById(`tab-${targetTab}`);

        if (targetEl) {
          targetEl.classList.add("active");

          if (isMobile && sidebar) {
            if (targetTab === "metadata") {
              // Open Dicionário as fullscreen modal on mobile
              sidebar.classList.remove("bottom-sheet-open");
              targetEl.classList.add("fullscreen-mobile-open");
            } else {
              // Open Camadas / Estatísticas as 40vh bottom sheet
              sidebar.classList.add("bottom-sheet-open");
            }
          }
        }

        if (targetTab === "stats" && this.analyticsPanel) {
          setTimeout(() => this.analyticsPanel.renderCharts(), 100);
        }
      });
    });

    // Close button inside Dicionário fullscreen modal on mobile
    const closeDictBtn = document.getElementById("btn-close-dict-modal");
    if (closeDictBtn) {
      closeDictBtn.addEventListener("click", () => {
        const dictEl = document.getElementById("tab-metadata");
        if (dictEl) dictEl.classList.remove("fullscreen-mobile-open");
        // Reset tab to layers
        const firstTab = document.querySelector('.sidebar-tab-btn[data-tab="layers"]');
        if (firstTab) {
          tabBtns.forEach(b => b.classList.remove("active"));
          contents.forEach(c => c.classList.remove("active"));
          firstTab.classList.add("active");
          const layersEl = document.getElementById("tab-layers");
          if (layersEl) layersEl.classList.add("active");
        }
      });
    }

    // Close button for bottom sheet on mobile
    const closeSheetBtn = document.getElementById("btn-close-bottom-sheet");
    if (closeSheetBtn && sidebar) {
      closeSheetBtn.addEventListener("click", () => {
        sidebar.classList.remove("bottom-sheet-open");
      });
    }

    // Mobile trigger button on map to open bottom sheet
    const mobileSheetToggle = document.getElementById("btn-mobile-sheet-toggle");
    if (mobileSheetToggle && sidebar) {
      mobileSheetToggle.addEventListener("click", () => {
        const isOpen = sidebar.classList.contains("bottom-sheet-open");
        if (isOpen) {
          sidebar.classList.remove("bottom-sheet-open");
        } else {
          // If dictionary was active in fullscreen, reset to layers
          const dictEl = document.getElementById("tab-metadata");
          if (dictEl && dictEl.classList.contains("fullscreen-mobile-open")) {
            dictEl.classList.remove("fullscreen-mobile-open");
            const firstTab = document.querySelector('.sidebar-tab-btn[data-tab="layers"]');
            if (firstTab) firstTab.click();
          } else {
            // Activate currently selected tab or default to layers
            const activeTab = document.querySelector(".sidebar-tab-btn.active");
            if (activeTab && activeTab.dataset.tab === "metadata") {
              const firstTab = document.querySelector('.sidebar-tab-btn[data-tab="layers"]');
              if (firstTab) firstTab.click();
            }
          }
          sidebar.classList.add("bottom-sheet-open");
        }
      });
    }
  }

  setupSidebarToggle() {
    const toggleBtn = document.getElementById("btn-toggle-sidebar");
    const container = document.getElementById("app-container");
    const sidebar = document.getElementById("geoportal-sidebar");
    if (!toggleBtn || !container) return;

    toggleBtn.addEventListener("click", () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (isMobile && sidebar) {
        sidebar.classList.toggle("bottom-sheet-open");
      } else {
        container.classList.toggle("sidebar-collapsed");
      }
      setTimeout(() => {
        if (this.mapManager && this.mapManager.map1) this.mapManager.map1.invalidateSize();
      }, 250);
    });

    // Window resize handler with debounce for responsive map recalculation
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const isMobile = window.matchMedia("(max-width: 767px)").matches;
        if (!isMobile && sidebar) {
          sidebar.classList.remove("bottom-sheet-open");
          const dictEl = document.getElementById("tab-metadata");
          if (dictEl) dictEl.classList.remove("fullscreen-mobile-open");
        }
        if (this.mapManager && this.mapManager.map1) {
          this.mapManager.map1.invalidateSize();
        }
      }, 150);
    });
  }

  buildSearchIndex() {
    this.searchIndex = [];

    // 2. Index Terras Indígenas
    const tiConfig = this.layerCatalog.layers.terrasIndigenas;
    if (tiConfig && tiConfig.geoJsonData && tiConfig.geoJsonData.features) {
      tiConfig.geoJsonData.features.forEach(f => {
        const nome = f.properties.nome_oficial || f.properties.terrai_nom || "Terra Indígena";
        this.searchIndex.push({
          title: nome,
          subtitle: `${f.properties.etnia_nome || 'Povos Indígenas'} • ${f.properties.municipios_lista || ''}`,
          type: "Terra Indígena",
          feature: f,
          layerId: "terrasIndigenas"
        });
      });
    }

    // 3. Index Aldeias
    const aldConfig = this.layerCatalog.layers.aldeias;
    if (aldConfig && aldConfig.geoJsonData && aldConfig.geoJsonData.features) {
      aldConfig.geoJsonData.features.forEach(f => {
        const nome = f.properties.nome_aldei || f.properties.nome_formatado || "Aldeia";
        this.searchIndex.push({
          title: nome,
          subtitle: `${f.properties.terra_indigena || ''} • ${f.properties.etnia_predominante || ''} (${f.properties.nommunic || ''})`,
          type: "Aldeia Indígena",
          feature: f,
          layerId: "aldeias"
        });
      });
    }

    // 4. Index Massa de Água (ANA)
    const mdaConfig = this.layerCatalog.layers.massaDeAgua;
    if (mdaConfig && mdaConfig.geoJsonData && mdaConfig.geoJsonData.features) {
      const addedWater = new Set();
      mdaConfig.geoJsonData.features.forEach(f => {
        const nome = f.properties.nome_formatado || f.properties.nmoriginal;
        if (nome && nome !== "Massa de Água / Curso Hídrico" && !addedWater.has(nome)) {
          addedWater.add(nome);
          this.searchIndex.push({
            title: nome,
            subtitle: `${f.properties.tipo_formatado || 'Corpo d\'Água'} • ${f.properties.municipio_formatado || ''} (${f.properties.uf_formatada || ''})`,
            type: "Massa de água",
            feature: f,
            layerId: "massaDeAgua"
          });
        }
      });
    }
  }

  setupSearch() {
    const input = document.getElementById("global-search-input");
    const dropdown = document.getElementById("search-results-dropdown");
    const clearBtn = document.getElementById("search-clear-btn");

    if (!input || !dropdown) return;

    input.addEventListener("input", e => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        dropdown.style.display = "none";
        if (clearBtn) clearBtn.style.display = "none";
        return;
      }

      if (clearBtn) clearBtn.style.display = "block";

      const matches = this.searchIndex.filter(item =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      ).slice(0, 12);

      if (matches.length === 0) {
        dropdown.innerHTML = `<div style="padding:1rem;color:#a8a29e;text-align:center">Nenhum resultado para "${q}".</div>`;
      } else {
        dropdown.innerHTML = matches.map((m, idx) => `
          <div class="search-result-item" data-idx="${idx}">
            <div class="search-item-info">
              <strong>${m.title}</strong>
              <span>${m.subtitle}</span>
            </div>
            <span class="search-item-tag">${m.type}</span>
          </div>
        `).join("");

        dropdown.querySelectorAll(".search-result-item").forEach((el, idx) => {
          el.addEventListener("click", () => {
            const item = matches[idx];
            this.handleSearchSelection(item);
            dropdown.style.display = "none";
          });
        });
      }

      dropdown.style.display = "block";
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        dropdown.style.display = "none";
        clearBtn.style.display = "none";
      });
    }

    document.addEventListener("click", e => {
      if (!e.target.closest(".header-search-box")) {
        dropdown.style.display = "none";
      }
    });
  }

  handleSearchSelection(item) {
    const feat = item.feature;
    if (!feat) return;

    if (feat.geometry.type === "Point") {
      const coords = feat.geometry.coordinates;
      this.mapManager.map1.setView([coords[1], coords[0]], 13, { animate: true });
    } else {
      const temp = L.geoJSON(feat);
      const b = temp.getBounds();
      if (b && b.isValid()) {
        this.mapManager.fitBounds(b);
      }
    }

    this.showToast(`Localizado (SIRGAS 2000): ${item.title}`);
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        if (this.attributeTable && this.attributeTable.isOpen) this.attributeTable.close();
        if (this.exportTools) this.exportTools.closeExportModal();
        const dd = document.getElementById("search-results-dropdown");
        if (dd) dd.style.display = "none";
      } else if (e.key === "t" && e.altKey) {
        if (this.attributeTable) this.attributeTable.toggle();
      }
    });
  }

  showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i data-lucide="info" style="width:16px;height:16px;color:#ea580c"></i> <span>${message}</span>`;
    container.appendChild(toast);

    if (window.lucide) {
      try { window.lucide.createIcons(); } catch(e) {}
    }

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  zoomToCurrentFeature() {
    if (this.mapManager) {
      this.mapManager.resetToStudyArea();
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  window.App = new App();
  window.App.start();
});
