/**
 * =============================================================================
 * [PT-BR] ORQUESTRADOR PRINCIPAL DA APLICAÇÃO (APP)
 * [EN] MAIN APPLICATION ORCHESTRATOR (APP)
 * =============================================================================
 * Projeto: Energia Limpa, Vida Sustentável
 * Elaboração feita por: Jhamenson Nascimento
 * Referência Geodésica: SIRGAS 2000 (EPSG:4674)
 * 
 * [PT-BR] Coordena o ciclo de vida, índices de busca global, abas, modais,
 *         atalhos de teclado e integração entre os módulos do WebGIS.
 * [EN] Coordinates lifecycle, global search indexes, navigation tabs,
 *         modals, keyboard shortcuts, and inter-module communication.
 * =============================================================================
 */

class App {
  constructor() {
    /** [PT-BR] Instâncias dos módulos / [EN] Module instances */
    this.mapManager = null;
    this.layerCatalog = null;
    this.attributeTable = null;
    this.analyticsPanel = null;
    this.exportTools = null;

    /** [PT-BR] Índice de busca unificado / [EN] Unified search index */
    this.searchIndex = [];
  }

  /**
   * ===========================================================================
   * [PT-BR] INICIALIZAÇÃO DA APLICAÇÃO
   * [EN] APPLICATION INITIALIZATION LIFECYCLE
   * ===========================================================================
   */
  async start() {
    console.log("[WebGIS] Inicializando Projeto: Energia Limpa, Vida Sustentável...");

    // Renderiza ícones do Lucide no carregamento inicial
    // Render Lucide icons on initial boot
    if (window.lucide) {
      try { window.lucide.createIcons(); } catch (e) {}
    }

    // 1. [PT-BR] Inicializa o Gerenciador do Mapa Leaflet
    //    [EN] Initialize Leaflet Map Manager
    this.mapManager = new MapManager();
    this.mapManager.init();

    // 2. [PT-BR] Inicializa o Catálogo de Camadas Espaciais
    //    [EN] Initialize Spatial Layer Catalog
    this.layerCatalog = new LayerCatalog(this.mapManager);
    window.LayerCatalog = this.layerCatalog;

    // 3. [PT-BR] Inicializa a Tabela de Atributos Geoespaciais
    //    [EN] Initialize Geospatial Attribute Table
    this.attributeTable = new AttributeTable(this.layerCatalog, this.mapManager);
    window.AttributeTable = this.attributeTable;
    this.attributeTable.init();

    // 4. [PT-BR] Inicializa o Painel de Estatísticas & Gráficos (Chart.js)
    //    [EN] Initialize Analytics & Demographic Charts (Chart.js)
    if (typeof AnalyticsPanel !== "undefined") {
      this.analyticsPanel = new AnalyticsPanel(this.layerCatalog);
      window.AnalyticsPanel = this.analyticsPanel;
    }

    // 5. [PT-BR] Inicializa as Ferramentas de Exportação Cartográfica (PNG/PDF)
    //    [EN] Initialize Cartographic Export Tools (PNG/PDF)
    if (typeof ExportTools !== "undefined") {
      this.exportTools = new ExportTools(this.mapManager, this.layerCatalog);
      this.exportTools.init();
    }

    // 6. [PT-BR] Configura Eventos de Interface (Abas, Barra Lateral, Modais, Busca)
    //    [EN] Setup UI Events (Tabs, Sidebar, Modals, Search)
    this.setupSidebarTabs();
    this.setupSidebarToggle();
    this.setupQrModal();
    this.setupSearch();
    this.setupKeyboardShortcuts();

    // 7. [PT-BR] Carregamento Assíncrono dos Dados Vetoriais GeoJSON
    //    [EN] Asynchronous Loading of GeoJSON Vector Datasets
    try {
      await this.layerCatalog.loadAllLayers();
    } catch (err) {
      console.error("[WebGIS] Erro ao carregar camadas:", err);
    }

    // Atualiza ícones após carregar todas as camadas
    // Refresh icons after all layers are loaded
    if (window.lucide) {
      try { window.lucide.createIcons(); } catch (e) {}
    }

    this.showToast("WebGIS carregado em SIRGAS 2000 com sucesso!");
  }

  /**
   * ===========================================================================
   * [PT-BR] NAVEGAÇÃO DE ABAS NA BARRA LATERAL (MOBILE BOTTOM SHEET & DESKTOP)
   * [EN] SIDEBAR TAB NAVIGATION (MOBILE BOTTOM SHEET & DESKTOP)
   * ===========================================================================
   */
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
              // Abre o dicionário em tela cheia no mobile
              // Open dictionary as fullscreen modal on mobile
              sidebar.classList.remove("bottom-sheet-open");
              targetEl.classList.add("fullscreen-mobile-open");
            } else {
              // Abre camadas ou estatísticas como bottom sheet de 40vh
              // Open layers or statistics as 40vh bottom sheet
              sidebar.classList.add("bottom-sheet-open");
            }
          }
        }

        // Renderiza gráficos com leve delay para calcular dimensões do container
        // Render charts with slight delay to accurately calculate container bounds
        if (targetTab === "stats" && this.analyticsPanel) {
          setTimeout(() => this.analyticsPanel.renderCharts(), 100);
        }
      });
    });

    // Botão de fechar o dicionário em tela cheia no celular
    // Close button for fullscreen dictionary modal on mobile
    const closeDictBtn = document.getElementById("btn-close-dict-modal");
    if (closeDictBtn) {
      closeDictBtn.addEventListener("click", () => {
        const dictEl = document.getElementById("tab-metadata");
        if (dictEl) dictEl.classList.remove("fullscreen-mobile-open");
        
        // Retorna a aba ativa para camadas
        // Reset active tab to layers
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

    // Botão de fechar o bottom sheet no celular
    // Close button for bottom sheet on mobile
    const closeSheetBtn = document.getElementById("btn-close-bottom-sheet");
    if (closeSheetBtn && sidebar) {
      closeSheetBtn.addEventListener("click", () => {
        sidebar.classList.remove("bottom-sheet-open");
      });
    }
  }

  /**
   * ===========================================================================
   * [PT-BR] CONTROLE DE RECOLHIMENTO DA BARRA LATERAL & REDIMENSIONAMENTO
   * [EN] SIDEBAR COLLAPSE TOGGLE & RESPONSIVE RESIZE HANDLING
   * ===========================================================================
   */
  setupSidebarToggle() {
    const toggleBtn = document.getElementById("btn-toggle-sidebar");
    const container = document.getElementById("app-container");
    const sidebar = document.getElementById("geoportal-sidebar");
    if (!toggleBtn || !container) return;

    toggleBtn.addEventListener("click", () => {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (isMobile && sidebar) {
        const isOpen = sidebar.classList.contains("bottom-sheet-open");
        if (isOpen) {
          sidebar.classList.remove("bottom-sheet-open");
        } else {
          // Garante que uma aba esteja visível ao abrir
          // Ensure active tab is displayed upon opening
          const activeTabBtn = document.querySelector(".sidebar-tab-btn.active") || document.querySelector('.sidebar-tab-btn[data-tab="layers"]');
          if (activeTabBtn) activeTabBtn.click();
          sidebar.classList.add("bottom-sheet-open");
        }
      } else {
        container.classList.toggle("sidebar-collapsed");
        const isCollapsed = container.classList.contains("sidebar-collapsed");
        toggleBtn.setAttribute("title", isCollapsed ? "Expandir Painel Lateral • Expand Sidebar" : "Recolher Painel Lateral • Collapse Sidebar");
      }
      setTimeout(() => {
        if (this.mapManager && this.mapManager.map1) {
          this.mapManager.map1.invalidateSize();
        }
      }, 250);
    });

    // Tratamento de redimensionamento de janela com debounce
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

  /**
   * ===========================================================================
   * [PT-BR] MODAL DE ACESSO RÁPIDO VIA QR CODE (MOBILE & DESKTOP)
   * [EN] QUICK ACCESS QR CODE MODAL HANDLER
   * ===========================================================================
   */
  setupQrModal() {
    const openBtn = document.getElementById("btn-open-qr-modal");
    const modal = document.getElementById("modal-qr-code");
    const closeBtn = document.getElementById("btn-close-qr-modal");
    const copyBtn = document.getElementById("btn-copy-webgis-url");
    const copyLabel = document.getElementById("copy-btn-label");
    const urlInput = document.getElementById("qr-share-url-input");

    if (openBtn && modal) {
      openBtn.addEventListener("click", () => {
        modal.classList.add("open");
      });
    }

    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => {
        modal.classList.remove("open");
      });
    }

    // Fecha modal ao clicar fora do diálogo / Close modal on backdrop click
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("open");
        }
      });
    }

    // Copiar URL com feedback visual / Copy URL with visual feedback
    if (copyBtn && urlInput) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(urlInput.value);
          if (copyLabel) copyLabel.textContent = "Copiado!";
          copyBtn.style.background = "var(--color-emerald)";
          copyBtn.style.color = "#ffffff";
          this.showToast("Link copiado para a área de transferência!");

          setTimeout(() => {
            if (copyLabel) copyLabel.textContent = "Copiar";
            copyBtn.style.background = "";
            copyBtn.style.color = "";
          }, 2500);
        } catch (err) {
          urlInput.select();
          document.execCommand("copy");
          if (copyLabel) copyLabel.textContent = "Copiado!";
          this.showToast("Link copiado!");
        }
      });
    }
  }

  /**
   * ===========================================================================
   * [PT-BR] CONSTRUÇÃO DO ÍNDICE DE BUSCA UNIFICADO
   * [EN] BUILD UNIFIED SEARCH AUTOCOMPLETE INDEX
   * ===========================================================================
   */
  buildSearchIndex() {
    this.searchIndex = [];

    // 1. Indexa Terras Indígenas / Index Indigenous Lands
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

    // 2. Indexa Aldeias Indígenas / Index Villages
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

    // 3. Indexa Recursos Hídricos / Index Water Resources (ANA BHO)
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

  /**
   * ===========================================================================
   * [PT-BR] CONFIGURAÇÃO DA BUSCA GLOBAL AUTOCOMPLETE
   * [EN] GLOBAL SEARCH AUTOCOMPLETE SETUP
   * ===========================================================================
   */
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

  /**
   * ===========================================================================
   * [PT-BR] SELEÇÃO E NAVEGAÇÃO DO RESULTADO DA BUSCA
   * [EN] SEARCH SELECTION & GEOMETRIC ZOOM HANDLER
   * ===========================================================================
   */
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

  /**
   * ===========================================================================
   * [PT-BR] ATALHOS DE TECLADO (ACESSIBILIDADE)
   * [EN] KEYBOARD SHORTCUTS (ACCESSIBILITY)
   * ===========================================================================
   */
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        if (this.attributeTable && this.attributeTable.isOpen) this.attributeTable.close();
        if (this.exportTools) this.exportTools.closeExportModal();
        const qrModal = document.getElementById("modal-qr-code");
        if (qrModal) qrModal.classList.remove("open");
        const dd = document.getElementById("search-results-dropdown");
        if (dd) dd.style.display = "none";
      } else if (e.key === "t" && e.altKey) {
        if (this.attributeTable) this.attributeTable.toggle();
      }
    });
  }

  /**
   * ===========================================================================
   * [PT-BR] NOTIFICAÇÕES TOAST TEMPORÁRIAS
   * [EN] TEMPORARY TOAST NOTIFICATIONS
   * ===========================================================================
   */
  showToast(message) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i data-lucide="info" style="width:16px;height:16px;color:#ea580c"></i> <span>${message}</span>`;
    container.appendChild(toast);

    if (window.lucide) {
      try { window.lucide.createIcons(); } catch (e) {}
    }

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  /**
   * [PT-BR] Centraliza a visão na área de estudo da pesquisa
   * [EN] Centers the view on the research study area
   */
  zoomToCurrentFeature() {
    if (this.mapManager) {
      this.mapManager.resetToStudyArea();
    }
  }
}

/**
 * =============================================================================
 * [PT-BR] PONTO DE ENTRADA DA APLICAÇÃO (DOM READY & IMMEDIATE FALLBACK)
 * [EN] APPLICATION ENTRY POINT (DOM READY & IMMEDIATE FALLBACK)
 * =============================================================================
 */
function initializeWebGIS() {
  if (!window.App) {
    window.App = new App();
    window.App.start();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeWebGIS);
} else {
  initializeWebGIS();
}
