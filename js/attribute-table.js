/**
 * =============================================================================
 * [PT-BR] TABELA DE ATRIBUTOS GEOESPACIAIS & EXPORTAÇÃO CSV
 * [EN] GEOSPATIAL ATTRIBUTE TABLE & CSV EXPORT ENGINE
 * =============================================================================
 * Projeto: Energia Limpa, Vida Sustentável
 * Elaboração feita por: Jhamenson Nascimento
 * Referência Geodésica: SIRGAS 2000 (EPSG:4674)
 * 
 * [PT-BR] Visualizador tabular interativo responsivo (modal fullscreen no celular,
 *         gaveta retrátil no desktop) com busca, ordenação de colunas,
 *         centralização direta no mapa e exportação formatada em CSV (UTF-8 BOM).
 * [EN] Responsive interactive tabular data viewer (fullscreen modal on mobile,
 *         retractable drawer on desktop) with search, column sorting,
 *         direct map zooming, and formatted CSV export (UTF-8 BOM).
 * =============================================================================
 */

class AttributeTable {
  constructor(layerCatalog, mapManager) {
    this.layerCatalog = layerCatalog;
    this.mapManager = mapManager;
    this.isOpen = false;
    this.currentLayerId = "aldeias";
    this.searchQuery = "";
    this.selectedTiFilter = "all";
    this.sortColumn = null;
    this.sortAsc = true;
    this.filteredFeatures = [];
  }

  /**
   * [PT-BR] Inicialização dos componentes da tabela
   * [EN] Initializes table components and bindings
   */
  init() {
    this.setupUI();
    this.populateLayerSelect();
    this.renderTable();
  }

  /**
   * ===========================================================================
   * [PT-BR] CONFIGURAÇÃO DOS EVENTOS DE INTERFACE DA TABELA
   * [EN] ATTRIBUTE TABLE UI EVENT BINDINGS
   * ===========================================================================
   */
  setupUI() {
    const toggleBtn = document.getElementById("btn-toggle-table");
    const closeBtn = document.getElementById("btn-close-table");
    const layerSelect = document.getElementById("attr-layer-select");
    const tiFilterSelect = document.getElementById("attr-ti-filter");
    const searchInput = document.getElementById("attr-table-search");
    const exportCsvBtn = document.getElementById("btn-export-csv");

    if (toggleBtn) {
      toggleBtn.onclick = (e) => {
        e.preventDefault();
        this.toggle();
      };
    }

    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.preventDefault();
        this.close();
      };
    }

    if (layerSelect) {
      layerSelect.onchange = e => {
        this.currentLayerId = e.target.value;
        this.searchQuery = "";
        if (searchInput) searchInput.value = "";
        this.renderTable();
      };
    }

    if (tiFilterSelect) {
      tiFilterSelect.onchange = e => {
        this.selectedTiFilter = e.target.value;
        this.renderTable();
      };
    }

    if (searchInput) {
      searchInput.oninput = e => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderTable();
      };
    }

    if (exportCsvBtn) {
      exportCsvBtn.onclick = (e) => {
        e.preventDefault();
        this.exportCurrentTableToCSV();
      };
    }

    // Atalho de teclado ESC para fechar a tabela
    // Keyboard ESC shortcut to close table
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });
  }

  /**
   * [PT-BR] Atualiza as opções do seletor de camadas na tabela
   * [EN] Populates layer selector options in attribute table
   */
  populateLayerSelect() {
    const layerSelect = document.getElementById("attr-layer-select");
    if (!layerSelect) return;

    const layers = this.layerCatalog.layers;
    layerSelect.innerHTML = `
      <option value="aldeias" ${this.currentLayerId === 'aldeias' ? 'selected' : ''}>Aldeias Indígenas Participantes do Projetos (${layers.aldeias ? layers.aldeias.count : 28})</option>
      <option value="massaDeAgua" ${this.currentLayerId === 'massaDeAgua' ? 'selected' : ''}>Recursos Hídricos que Banham a Área de Estudo (${layers.massaDeAgua ? layers.massaDeAgua.count : 238})</option>
      <option value="terrasIndigenas" ${this.currentLayerId === 'terrasIndigenas' ? 'selected' : ''}>Territórios Indígenas (${layers.terrasIndigenas ? layers.terrasIndigenas.count : 4})</option>
    `;
  }

  /**
   * [PT-BR] Abre a tabela focando em uma camada específica
   * [EN] Opens table focused on a specific layer ID
   */
  openLayerTable(layerId) {
    this.currentLayerId = layerId;
    const layerSelect = document.getElementById("attr-layer-select");
    if (layerSelect) layerSelect.value = layerId;
    this.open();
    this.renderTable();
  }

  open() {
    this.isOpen = true;
    const drawer = document.getElementById("attribute-table-drawer");
    if (drawer) drawer.classList.add("open");
    const btn = document.getElementById("btn-toggle-table");
    if (btn) btn.classList.add("active");
    this.renderTable();
  }

  close() {
    this.isOpen = false;
    const drawer = document.getElementById("attribute-table-drawer");
    if (drawer) drawer.classList.remove("open");
    const btn = document.getElementById("btn-toggle-table");
    if (btn) btn.classList.remove("active");
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  /**
   * ===========================================================================
   * [PT-BR] RENDERIZAÇÃO DA TABELA, FILTROS E ORDENAÇÃO
   * [EN] TABLE RENDERING, FILTERING & SORTING LOGIC
   * ===========================================================================
   */
  renderTable() {
    const container = document.getElementById("attr-table-content");
    if (!container) return;

    const layerConfig = this.layerCatalog.layers[this.currentLayerId];
    if (!layerConfig || !layerConfig.geoJsonData || !layerConfig.geoJsonData.features || layerConfig.geoJsonData.features.length === 0) {
      container.innerHTML = `<div style="padding:2rem;text-align:center;color:#a8a29e">Camada sem dados carregados.</div>`;
      return;
    }

    const allFeatures = layerConfig.geoJsonData.features;

    // Aplica filtro por busca textual e por Terra Indígena
    // Apply text search filter and Indigenous Land filter
    this.filteredFeatures = allFeatures.filter(f => {
      // Filtro por TI / Indigenous Land filter
      if (this.selectedTiFilter && this.selectedTiFilter !== "all") {
        const tiName = f.properties.terra_indigena || f.properties.terrai_nom || f.properties.nome_oficial || "";
        if (!tiName.includes(this.selectedTiFilter)) return false;
      }

      // Filtro por texto / Text search query
      if (!this.searchQuery) return true;
      const str = Object.values(f.properties).join(" ").toLowerCase();
      return str.includes(this.searchQuery);
    });

    const columns = this.getColumnsForLayer(this.currentLayerId);

    // Aplica ordenação de colunas
    // Apply column sorting
    if (this.sortColumn) {
      this.filteredFeatures.sort((a, b) => {
        let valA = a.properties[this.sortColumn];
        let valB = b.properties[this.sortColumn];
        if (valA == null) valA = "";
        if (valB == null) valB = "";
        if (typeof valA === "number" && typeof valB === "number") {
          return this.sortAsc ? valA - valB : valB - valA;
        }
        return this.sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }

    const displayFeatures = this.filteredFeatures.slice(0, 150);

    let html = `
      <table class="data-table">
        <thead>
          <tr>
            <th style="width:35px">#</th>
            ${columns.map(c => `<th onclick="window.AttributeTable.sortBy('${c.key}')" title="Clique para ordenar • Click to sort">${c.label} ${this.sortColumn === c.key ? (this.sortAsc ? '▲' : '▼') : ''}</th>`).join("")}
            <th style="width:75px">Ações</th>
          </tr>
        </thead>
        <tbody>
    `;

    displayFeatures.forEach((f, idx) => {
      html += `
        <tr data-feature-id="${f._id}" onclick="window.AttributeTable.selectRow(this, '${f._id}')">
          <td style="color:#a8a29e;font-family:var(--font-mono)">${idx + 1}</td>
          ${columns.map(c => `<td>${this.formatCellValue(f.properties[c.key])}</td>`).join("")}
          <td>
            <button class="layer-mini-btn" style="background:#ea580c;color:#fff;padding:2px 8px;font-weight:700;border-radius:4px" title="Zoom na feição • Zoom to feature" onclick="event.stopPropagation(); window.AttributeTable.zoomToFeature('${this.currentLayerId}', ${idx})">
              Zoom
            </button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    if (this.filteredFeatures.length > 150) {
      html += `<div style="padding:0.75rem;text-align:center;font-size:0.75rem;color:#d97706;background:#1a1715">Mostrando os primeiros 150 registros. Utilize a busca acima para filtrar.</div>`;
    }

    container.innerHTML = html;
  }

  /**
   * [PT-BR] Retorna as colunas estruturadas para cada camada
   * [EN] Returns structured table columns for each layer
   */
  getColumnsForLayer(layerId) {
    if (layerId === "aldeias") {
      return [
        { key: "nome_aldei", label: "Aldeia Indígena" },
        { key: "terra_indigena", label: "Terra Indígena" },
        { key: "etnia_predominante", label: "Etnia Predominante" },
        { key: "rio_proximo", label: "Rio Principal" },
        { key: "nommunic", label: "Município" },
        { key: "nomuf", label: "UF" },
        { key: "populacao_estimada", label: "População" },
        { key: "coord_lat_deg", label: "Latitude" },
        { key: "coord_long_deg", label: "Longitude" },
        { key: "datum_oficial", label: "Datum" }
      ];
    }
    if (layerId === "terrasIndigenas") {
      return [
        { key: "nome_oficial", label: "Terra Indígena" },
        { key: "etnia_nome", label: "Etnias / Povos" },
        { key: "fase_ti", label: "Fase" },
        { key: "superficie_ha_formatada", label: "Superfície (ha)" },
        { key: "populacao_estimada", label: "População Est." },
        { key: "municipios_lista", label: "Municípios" },
        { key: "uf_sigla", label: "UF" },
        { key: "datum_oficial", label: "Datum" }
      ];
    }
    if (layerId === "massaDeAgua") {
      return [
        { key: "nome_formatado", label: "Nome / Rio" },
        { key: "tipo_formatado", label: "Tipologia" },
        { key: "municipio_formatado", label: "Município" },
        { key: "uf_formatada", label: "UF" },
        { key: "area_km2_formatada", label: "Área Superficial" },
        { key: "perimetro_km_formatado", label: "Perímetro" },
        { key: "dominio_formatado", label: "Domínio" },
        { key: "datum_oficial", label: "Datum" }
      ];
    }
    return [{ key: "gid", label: "ID" }];
  }

  /**
   * [PT-BR] Formata o valor exibido na célula da tabela
   * [EN] Formats value displayed in table cell
   */
  formatCellValue(val) {
    if (val === null || val === undefined) return '<span style="color:#78716c">-</span>';
    if (typeof val === "boolean") return val ? '<span style="color:#ea580c;font-weight:700">Sim</span>' : '<span style="color:#a8a29e">Não</span>';
    return String(val);
  }

  sortBy(col) {
    if (this.sortColumn === col) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortColumn = col;
      this.sortAsc = true;
    }
    this.renderTable();
  }

  selectRow(rowElement, featureId) {
    document.querySelectorAll(".data-table tr").forEach(r => r.classList.remove("selected"));
    rowElement.classList.add("selected");
  }

  /**
   * [PT-BR] Aproxima o mapa e centraliza na feição selecionada
   * [EN] Zooms and centers map on selected feature
   */
  zoomToFeature(layerId, featureIndex) {
    const feat = this.filteredFeatures[featureIndex];
    if (!feat) return;

    this.close();

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

    if (window.App && window.App.showToast) {
      const label = feat.properties.nome_formatado || feat.properties.nome_aldei || feat.properties.terrai_nom || "Feição";
      window.App.showToast(`Localizado: ${label}`);
    }
  }

  /**
   * ===========================================================================
   * [PT-BR] EXPORTAÇÃO DA TABELA DE ATRIBUTOS PARA FORMATO CSV
   * [EN] EXPORT ATTRIBUTE TABLE TO FORMATTED CSV (UTF-8 BOM)
   * ===========================================================================
   */
  exportCurrentTableToCSV() {
    if (!this.filteredFeatures || this.filteredFeatures.length === 0) return;
    const columns = this.getColumnsForLayer(this.currentLayerId);

    let csv = "\uFEFF"; // UTF-8 BOM para compatibilidade com Microsoft Excel
    csv += columns.map(c => `"${c.label}"`).join(",") + "\n";

    this.filteredFeatures.forEach(f => {
      const row = columns.map(c => {
        let val = f.properties[c.key];
        if (val == null) val = "";
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dados_${this.currentLayerId}_SIRGAS2000_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.App && window.App.showToast) {
      window.App.showToast("Tabela exportada em CSV com sucesso!");
    }
  }
}

if (typeof window !== "undefined") {
  window.AttributeTable = AttributeTable;
}
