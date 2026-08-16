/**
 * Layer Catalog - PROJETO: ENERGIA LIMPA
 * High-performance rendering for 3 standardized SIRGAS 2000 project layers:
 * 1. Terras Indígenas (6 TIs)
 * 2. Aldeias Indígenas (15 aldeias FUNAI)
 * 3. Massa de água (ANA geoft_bho_massa_dagua_v2019 - Região Norte)
 */

class LayerCatalog {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.layers = {
      terrasIndigenas: {
        id: "terrasIndigenas",
        name: "Terras Indígenas",
        category: "indigena",
        path: "data/area_de_estudo.geojson",
        color: "#10b981",
        weight: 2,
        dashArray: "5, 5",
        fillOpacity: 0.15,
        visible: true,
        opacity: 0.85,
        geoJsonData: null,
        leafletLayer: null,
        count: 6
      },
      aldeias: {
        id: "aldeias",
        name: "Aldeias Indígenas do Projeto",
        category: "indigena",
        path: "data/Pontos_aldeias.geojson",
        color: "#fbbf24",
        visible: true,
        opacity: 1.0,
        geoJsonData: null,
        leafletLayer: null,
        count: 15
      },
      massaDeAgua: {
        id: "massaDeAgua",
        name: "Massa de água (ANA)",
        category: "hidrografia",
        path: "data/massa_de_agua.geojson",
        color: "#0ea5e9",
        weight: 1.2,
        fillOpacity: 0.4,
        visible: false,
        opacity: 0.75,
        geoJsonData: null,
        leafletLayer: null,
        count: 46
      }
    };

    this.isLoaded = false;
  }

  async loadAllLayers() {
    this.renderCatalogTree(); // Render tree immediately so UI is never stuck

    try {
      const promises = Object.values(this.layers).map(layerConfig => this.loadLayer(layerConfig));
      await Promise.all(promises);
      this.isLoaded = true;

      this.renderCatalogTree();

      // Auto-fit map to study area
      if (this.mapManager && this.mapManager.map1) {
        this.mapManager.resetToStudyArea();
      }

      // Trigger updates for search, table, analytics
      if (window.AttributeTable) {
        window.AttributeTable.populateLayerSelect();
        window.AttributeTable.renderTable();
      }
      if (window.AnalyticsPanel) window.AnalyticsPanel.init();
      if (window.App) window.App.buildSearchIndex();
    } catch (err) {
      console.error("Erro ao carregar camadas:", err);
      this.renderCatalogTree();
    }
  }

  async loadLayer(config) {
    try {
      let data = null;

      // 1. Embedded data first (works 100% offline & local file://)
      if (window.EMBEDDED_DATA && window.EMBEDDED_DATA[config.id]) {
        data = window.EMBEDDED_DATA[config.id];
      }

      // 2. Fetch fallback
      if (!data && typeof fetch === "function") {
        try {
          const response = await fetch(config.path);
          if (response && response.ok) {
            data = await response.json();
          }
        } catch (err) {
          console.warn("Fetch fallback:", err);
        }
      }

      if (!data) {
        console.warn(`Dados da camada ${config.name} não encontrados.`);
        return;
      }

      config.geoJsonData = data;
      config.count = data.features ? data.features.length : 0;

      // Enhance feature properties
      if (data.features) {
        data.features.forEach((feat, idx) => {
          feat._id = `${config.id}_${idx}`;
          const coords = feat.geometry && feat.geometry.type === "Point" ? feat.geometry.coordinates : null;

          if (config.id === "terrasIndigenas") {
            if (window.enhanceTerraIndigenaFeature) {
              feat.properties = window.enhanceTerraIndigenaFeature(feat.properties);
            }
          } else if (config.id === "aldeias") {
            if (window.enhanceAldeiaFeature) {
              feat.properties = window.enhanceAldeiaFeature(feat.properties, coords);
            }
          } else if (config.id === "massaDeAgua") {
            if (window.enhanceMassaDaguaFeature) {
              feat.properties = window.enhanceMassaDaguaFeature(feat.properties);
            }
          }
        });
      }

      config.leafletLayer = this.createLayer(config);

      if (config.visible && config.leafletLayer) {
        this.mapManager.addLayer(config.leafletLayer);
      }
    } catch (err) {
      console.error(`Erro ao carregar camada ${config.id}:`, err);
    }
  }

  createLayer(config) {
    if (!config.geoJsonData) return null;

    // 1. Aldeias Indígenas (Official FUNAI Points)
    if (config.id === "aldeias") {
      return L.geoJSON(config.geoJsonData, {
        pointToLayer: (feature, latlng) => {
          const isPolo = feature.properties.e_polo_base;
          const iconHtml = `
            <div class="custom-aldeia-marker" title="${feature.properties.nome_aldei || 'Aldeia'}">
              ${isPolo ? '<div class="marker-pulse-ring"></div>' : ''}
              <div class="marker-pin ${isPolo ? 'polo' : ''}">
                <i data-lucide="${isPolo ? 'landmark' : 'home'}" style="width:14px;height:14px;"></i>
              </div>
            </div>
          `;
          const customIcon = L.divIcon({
            html: iconHtml,
            className: "aldeia-div-icon",
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -16]
          });
          return L.marker(latlng, { icon: customIcon });
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(this.createPopupContent(config.id, feature.properties));
          layer.on("mouseover", () => {
            layer.bindTooltip(`<strong>${feature.properties.nome_aldei || 'Aldeia'}</strong><br><span style="font-size:0.75em;color:#94a3b8">${feature.properties.nommunic || ''} - ${feature.properties.nomuf || ''}</span>`, {
              sticky: true,
              direction: "top"
            });
          });
        }
      });
    }

    // 2. Terras Indígenas
    if (config.id === "terrasIndigenas") {
      let currentLayerGroup = null;
      currentLayerGroup = L.geoJSON(config.geoJsonData, {
        style: () => ({
          color: "#10b981",
          weight: 2,
          opacity: 0.85,
          fillColor: "#10b981",
          fillOpacity: 0.15,
          dashArray: "5, 5"
        }),
        onEachFeature: (feature, layer) => {
          layer.bindPopup(this.createPopupContent(config.id, feature.properties));

          layer.on("mouseover", e => {
            const l = e.target;
            l.setStyle({
              weight: 3.5,
              fillOpacity: 0.35,
              color: "#34d399"
            });
            l.bringToFront();

            const label = feature.properties.nome_oficial || feature.properties.terrai_nom || "Terra Indígena";
            l.bindTooltip(`<strong>${label}</strong>`, { sticky: true });
          });

          layer.on("mouseout", e => {
            if (currentLayerGroup) {
              currentLayerGroup.resetStyle(e.target);
            }
          });
        }
      });
      return currentLayerGroup;
    }

    // 3. Massa de Água (ANA BHO 2019 - Região Norte)
    if (config.id === "massaDeAgua") {
      let currentLayerGroup = null;
      currentLayerGroup = L.geoJSON(config.geoJsonData, {
        style: () => ({
          color: "#0284c7",
          weight: 1.2,
          opacity: 0.8,
          fillColor: "#0ea5e9",
          fillOpacity: 0.35
        }),
        onEachFeature: (feature, layer) => {
          layer.bindPopup(this.createPopupContent(config.id, feature.properties));

          layer.on("mouseover", e => {
            const l = e.target;
            l.setStyle({
              weight: 2.5,
              fillOpacity: 0.65,
              color: "#38bdf8"
            });
            l.bringToFront();

            const label = feature.properties.nome_formatado || feature.properties.nmoriginal || "Massa de Água";
            l.bindTooltip(`<strong>${label}</strong><br><span style="font-size:0.75em;color:#0ea5e9">${feature.properties.tipo_formatado || ''}</span>`, { sticky: true });
          });

          layer.on("mouseout", e => {
            if (currentLayerGroup) {
              currentLayerGroup.resetStyle(e.target);
            }
          });
        }
      });
      return currentLayerGroup;
    }

    return null;
  }

  createPopupContent(layerId, p) {
    // Terras Indígenas Popup
    if (layerId === "terrasIndigenas") {
      const nome = p.nome_oficial || p.terrai_nom || "Terra Indígena";
      const etnias = p.etnia_nome || "Povos Tradicionais";
      const fase = p.fase_ti || "Regularizada";
      const pop = p.populacao_estimada ? `${p.populacao_estimada.toLocaleString('pt-BR')} habitantes` : "Sob levantamento";
      const area = p.superficie_ha_formatada || (p.superficie ? `${Number(p.superficie).toLocaleString('pt-BR')} ha` : "N/D");
      const mun = p.municipios_lista || p.municipio_ || "Norte do Brasil";
      const uf = p.uf_sigla || "PA / AM / AP";
      const bacia = p.bacia_principal || "Bacia Amazônica";
      const desc = p.descricao_etnoambiental || "Território indígena demarcado de alta relevância socioambiental e biológica.";
      const decreto = p.decreto_homologacao || "Homologado pelo Governo Federal";
      const bioma = p.bioma || "Amazônia";

      return `
        <div class="popup-card">
          <div class="popup-header ti-header">
            <div class="popup-category">
              <i data-lucide="shield-check" style="width:12px;height:12px"></i>
              TERRA INDÍGENA • ${fase.toUpperCase()}
            </div>
            <div class="popup-title">${nome}</div>
          </div>
          <div class="popup-body">
            <div class="popup-desc">${desc}</div>
            <div class="popup-data-grid">
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Povos e Etnias</span>
                <span class="popup-data-val" style="color:#10b981">${etnias}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Superfície Total</span>
                <span class="popup-data-val">${area}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">População Estimada</span>
                <span class="popup-data-val">${pop}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Localização / UF</span>
                <span class="popup-data-val">${mun} (${uf})</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Datum</span>
                <span class="popup-data-val" style="color:#ea580c">SIRGAS 2000</span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Bacia Hidrográfica</span>
                <span class="popup-data-val" style="color:#0ea5e9">${bacia}</span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Ato Legal de Homologação</span>
                <span class="popup-data-val" style="font-size:0.75rem">${decreto}</span>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <span class="badge badge-emerald"><i data-lucide="trees" style="width:12px;height:12px"></i> ${bioma}</span>
            <button class="popup-btn" onclick="window.App.zoomToCurrentFeature()"><i data-lucide="maximize-2" style="width:12px;height:12px"></i> Centralizar</button>
          </div>
        </div>
      `;
    }

    // Aldeias Popup
    if (layerId === "aldeias") {
      const nome = p.nome_aldei || p.nome_formatado || "Aldeia Indígena";
      const ti = p.terra_indigena || "Território Tradicional Indígena";
      const etnia = p.etnia_predominante || "Povos Indígenas Regionais";
      const rio = p.rio_proximo || "Rio de Acesso Local";
      const mun = p.nommunic || "Oriximiná";
      const uf = p.nomuf || "Pará";
      const pop = p.populacao_estimada ? `${p.populacao_estimada} habitantes` : "Comunidade tradicional";
      const saude = p.unidade_saude || "Atendimento DSEI";
      const desc = p.descricao_detalhada || "Aldeia atendida pelo Projeto Energia Limpa.";
      const latDeg = p.coord_lat_deg || "";
      const longDeg = p.coord_long_deg || "";
      const latDms = p.coord_lat_dms || "";
      const longDms = p.coord_long_dms || "";
      const utm = p.utm_sirgas || "SIRGAS 2000";
      const isPolo = p.e_polo_base;

      return `
        <div class="popup-card">
          <div class="popup-header aldeia-header">
            <div class="popup-category" style="color:#fbbf24">
              <i data-lucide="${isPolo ? 'landmark' : 'home'}" style="width:12px;height:12px"></i>
              ALDEIA INDÍGENA ${isPolo ? '• POLO BASE' : ''}
            </div>
            <div class="popup-title">${nome}</div>
          </div>
          <div class="popup-body">
            <div class="popup-desc">${desc}</div>
            <div class="popup-data-grid">
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Terra Indígena</span>
                <span class="popup-data-val" style="color:#10b981">${ti}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Etnia / Povo</span>
                <span class="popup-data-val" style="color:#fbbf24">${etnia}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">População</span>
                <span class="popup-data-val">${pop}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Curso Hídrico Principal</span>
                <span class="popup-data-val" style="color:#0ea5e9">${rio}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Município / UF</span>
                <span class="popup-data-val">${mun} - ${uf}</span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Atenção à Saúde Indígena</span>
                <span class="popup-data-val" style="color:#f59e0b">${saude}</span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Coordenadas Oficiais (SIRGAS 2000)</span>
                <span class="popup-data-val" style="font-family:var(--font-mono);font-size:0.72rem">
                  Lat: ${latDeg} • Long: ${longDeg}<br>
                  <span style="color:#a8a29e">${latDms} • ${longDms}</span>
                </span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Referência Geodésica</span>
                <span class="popup-data-val" style="font-size:0.7rem;color:#10b981">${utm}</span>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <span class="badge badge-amber"><i data-lucide="sun" style="width:12px;height:12px"></i> Projeto Energia Limpa</span>
            <button class="popup-btn" onclick="window.App.zoomToCurrentFeature()"><i data-lucide="maximize-2" style="width:12px;height:12px"></i> Centralizar</button>
          </div>
        </div>
      `;
    }

    // Massa de Água Popup
    if (layerId === "massaDeAgua") {
      const nome = p.nome_formatado || "Corpo Hídrico";
      const tipo = p.tipo_formatado || "Curso d'Água";
      const dominio = p.dominio_formatado || "Domínio Público";
      const mun = p.municipio_formatado || "Norte do Brasil";
      const uf = p.uf_formatada || "PA / AM / AP";
      const area = p.area_km2_formatada || "-";
      const perim = p.perimetro_km_formatado || "-";

      return `
        <div class="popup-card">
          <div class="popup-header hydro-header">
            <div class="popup-category" style="color:#0ea5e9">
              <i data-lucide="droplets" style="width:12px;height:12px"></i>
              RECURSO HÍDRICO • ANA (BHO)
            </div>
            <div class="popup-title">${nome}</div>
          </div>
          <div class="popup-body">
            <div class="popup-data-grid">
              <div class="popup-data-cell">
                <span class="popup-data-label">Tipologia</span>
                <span class="popup-data-val">${tipo}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Domínio</span>
                <span class="popup-data-val">${dominio}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Área Superficial</span>
                <span class="popup-data-val" style="color:#0ea5e9">${area}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Perímetro</span>
                <span class="popup-data-val">${perim}</span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Localização</span>
                <span class="popup-data-val">${mun} (${uf})</span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Base Cartográfica</span>
                <span class="popup-data-val" style="font-size:0.7rem;color:#10b981">Agência Nacional de Águas • SIRGAS 2000</span>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <span class="badge badge-blue"><i data-lucide="waves" style="width:12px;height:12px"></i> BHO 2019</span>
            <button class="popup-btn" onclick="window.App.zoomToCurrentFeature()"><i data-lucide="maximize-2" style="width:12px;height:12px"></i> Centralizar</button>
          </div>
        </div>
      `;
    }

    return `<div>Sem detalhes adicionais.</div>`;
  }

  renderCatalogTree() {
    const container = document.getElementById("layer-catalog-tree");
    if (!container) return;

    const groups = [
      {
        name: "Territórios tradicionais e aldeias do projeto",
        icon: "shield",
        layers: ["terrasIndigenas", "aldeias"]
      },
      {
        name: "Recursos Hídricos da Região Norte",
        icon: "waves",
        layers: ["massaDeAgua"]
      }
    ];

    let html = "";
    groups.forEach(g => {
      html += `
        <div class="layer-catalog-group">
          <div class="layer-group-header" onclick="this.parentElement.classList.toggle('collapsed')">
            <div class="layer-group-title">
              <i data-lucide="${g.icon}" style="width:14px;height:14px;color:#ea580c"></i>
              ${g.name}
            </div>
            <i data-lucide="chevron-down" class="layer-group-collapse-icon"></i>
          </div>
          <div class="layer-group-items">
      `;

      g.layers.forEach(layerId => {
        const layer = this.layers[layerId];
        if (!layer) return;

        html += `
          <div class="layer-item-card" data-layer-id="${layer.id}">
            <div class="layer-card-top">
              <label class="layer-check-label" for="chk-${layer.id}">
                <input type="checkbox" id="chk-${layer.id}" class="layer-checkbox" ${layer.visible ? 'checked' : ''} onchange="window.LayerCatalog.toggleLayer('${layer.id}', this.checked)">
                <span class="layer-legend-swatch" style="background:${layer.color}"></span>
                <span class="layer-title-text">${layer.name}</span>
                <span class="layer-badge-count">${layer.count || 0}</span>
              </label>
              <div class="layer-card-actions">
                <button class="layer-mini-btn" title="Centralizar camada no mapa" onclick="window.LayerCatalog.zoomToLayer('${layer.id}')">
                  <i data-lucide="maximize-2" style="width:13px;height:13px"></i>
                </button>
                <button class="layer-mini-btn" title="Abrir Tabela de Atributos" onclick="window.AttributeTable.openLayerTable('${layer.id}')">
                  <i data-lucide="table-2" style="width:13px;height:13px"></i>
                </button>
              </div>
            </div>
            <div class="layer-controls-row">
              <div class="layer-slider-wrapper">
                <span class="layer-slider-label">Opacidade</span>
                <input type="range" min="0" max="1" step="0.05" value="${layer.opacity}" class="layer-opacity-slider" oninput="window.LayerCatalog.setOpacity('${layer.id}', this.value)">
              </div>
            </div>
          </div>
        `;
      });

      html += `</div></div>`;
    });

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }

  toggleLayer(layerId, isVisible) {
    const layer = this.layers[layerId];
    if (!layer) return;

    layer.visible = isVisible;
    if (layer.leafletLayer) {
      if (isVisible) {
        this.mapManager.addLayer(layer.leafletLayer);
      } else {
        this.mapManager.removeLayer(layer.leafletLayer);
      }
    }
  }

  setOpacity(layerId, opacityVal) {
    const layer = this.layers[layerId];
    if (!layer || !layer.leafletLayer) return;

    layer.opacity = parseFloat(opacityVal);
    if (typeof layer.leafletLayer.setStyle === "function") {
      layer.leafletLayer.setStyle({
        opacity: layer.opacity,
        fillOpacity: layer.opacity * 0.35
      });
    } else if (typeof layer.leafletLayer.eachLayer === "function") {
      layer.leafletLayer.eachLayer(l => {
        if (typeof l.setOpacity === "function") l.setOpacity(layer.opacity);
        if (typeof l.setStyle === "function") l.setStyle({ opacity: layer.opacity });
      });
    }
  }

  zoomToLayer(layerId) {
    const layer = this.layers[layerId];
    if (!layer || !layer.leafletLayer) return;

    if (typeof layer.leafletLayer.getBounds === "function") {
      const bounds = layer.leafletLayer.getBounds();
      if (bounds && bounds.isValid()) {
        this.mapManager.fitBounds(bounds);
      }
    }
  }
}

if (typeof window !== "undefined") {
  window.LayerCatalog = LayerCatalog;
}
