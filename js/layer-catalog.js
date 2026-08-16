/**
 * Layer Catalog - PROJETO: ENERGIA LIMPA • ARQUEOLOGIA
 * High-performance rendering for 4 standardized SIRGAS 2000 layers:
 * 1. Sítios Arqueologicos (IPHAN 2.670 pontos)
 * 2. Terras Indígenas (6 TIs)
 * 3. Aldeias Indígenas (275 aldeias FUNAI)
 * 4. Massa de água (ANA geoft_bho_massa_dagua_v2019 - Região Norte, desativada por padrão)
 */

class LayerCatalog {
  constructor(mapManager) {
    this.mapManager = mapManager;
    this.layers = {
      sitiosArqueologicos: {
        id: "sitiosArqueologicos",
        name: "Sítios Arqueologicos (IPHAN)",
        category: "arqueologia",
        path: "data/sitios_arqueologicos.geojson",
        color: "#ea580c",
        visible: true,
        opacity: 1.0,
        geoJsonData: null,
        leafletLayer: null,
        count: 2670
      },
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
        name: "Aldeias Indígenas",
        category: "indigena",
        path: "data/pontos_aldeias.geojson",
        color: "#fbbf24",
        visible: true,
        opacity: 1.0,
        geoJsonData: null,
        leafletLayer: null,
        count: 15
      },
      massaDeAgua: {
        id: "massaDeAgua",
        name: "Massa de água",
        category: "hidrografia",
        path: "data/massa_de_agua.geojson",
        color: "#0ea5e9",
        weight: 1.2,
        fillOpacity: 0.4,
        visible: false, // Desativada por padrão para não sobrecarregar a visualização
        opacity: 0.75,
        geoJsonData: null,
        leafletLayer: null,
        count: 46
      }
    };

    this.isLoaded = false;
  }

  async loadAllLayers() {
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
  }

  async loadLayer(config) {
    try {
      let data = null;

      // 1. Embedded data first
      if (window.EMBEDDED_DATA && window.EMBEDDED_DATA[config.id]) {
        data = window.EMBEDDED_DATA[config.id];
      }

      // 2. Fetch fallback
      if (!data) {
        let response;
        try {
          response = await fetch(config.path);
        } catch (err) {
          console.warn("Fetch fallback:", err);
        }
        if (response && response.ok) {
          data = await response.json();
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

          if (config.id === "sitiosArqueologicos") {
            if (window.enhanceSitioFeature) {
              feat.properties = window.enhanceSitioFeature(feat.properties, coords);
            }
          } else if (config.id === "terrasIndigenas") {
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

      // Create Leaflet Layer
      config.leafletLayer = this.createLeafletLayer(config);

      if (config.visible && this.mapManager && this.mapManager.map1 && config.leafletLayer) {
        config.leafletLayer.addTo(this.mapManager.map1);
      }
    } catch (e) {
      console.error(`Erro ao carregar camada ${config.name}:`, e);
    }
  }

  createLeafletLayer(config) {
    // 1. Sítios Arqueológicos (High-Performance CircleMarkers)
    if (config.id === "sitiosArqueologicos") {
      return L.geoJSON(config.geoJsonData, {
        pointToLayer: (feature, latlng) => {
          const classif = (feature.properties.classificacao || "").toLowerCase();
          let dotColor = "#ea580c";
          if (classif.includes("histórico") || classif.includes("historico")) dotColor = "#d97706";
          else if (classif.includes("contato")) dotColor = "#ca8a04";

          return L.circleMarker(latlng, {
            radius: 5,
            fillColor: dotColor,
            color: "#ffffff",
            weight: 1.5,
            opacity: 1.0,
            fillOpacity: 0.85
          });
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(this.createPopupContent(config.id, feature.properties));
          layer.on("mouseover", () => {
            const p = feature.properties;
            layer.setRadius(8);
            layer.setStyle({ fillColor: "#ffffff", color: "#ea580c", weight: 2.5 });
            layer.bindTooltip(`
              <strong>${p.nome_formatado || 'Sítio Arqueológico'}</strong><br>
              <span style="color:#ea580c">${p.classificacao} • ${p.codigo_oficial}</span>
            `, { sticky: true, direction: "top" }).openTooltip();
          });
          layer.on("mouseout", () => {
            const classif = (feature.properties.classificacao || "").toLowerCase();
            let dotColor = "#ea580c";
            if (classif.includes("histórico") || classif.includes("historico")) dotColor = "#d97706";
            else if (classif.includes("contato")) dotColor = "#ca8a04";

            layer.setRadius(5);
            layer.setStyle({ fillColor: dotColor, color: "#ffffff", weight: 1.5 });
          });
        }
      });
    }

    // 2. Aldeias Indígenas (Official FUNAI Points)
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

    // 3. Terras Indígenas
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

    // 4. Massa de Água (ANA BHO 2019 - Região Norte)
    if (config.id === "massaDeAgua") {
      let currentLayerGroup = null;
      currentLayerGroup = L.geoJSON(config.geoJsonData, {
        style: () => ({
          color: "#0284c7",
          weight: 1.2,
          opacity: 0.75,
          fillColor: "#0ea5e9",
          fillOpacity: 0.35
        }),
        onEachFeature: (feature, layer) => {
          layer.bindPopup(this.createPopupContent(config.id, feature.properties));

          layer.on("mouseover", e => {
            const l = e.target;
            l.setStyle({
              weight: 2.5,
              color: "#38bdf8",
              fillOpacity: 0.65
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
    // Sítio Arqueológico Popup
    if (layerId === "sitiosArqueologicos") {
      const nome = p.nome_formatado || "Sítio Arqueológico";
      const cod = p.codigo_oficial || "IPHAN";
      const classif = p.classificacao || "Pré-colonial";
      const tipo = p.tipo || "Sítio Arqueológico";
      const periodo = p.periodo_cronologico || "Pré-Cabralino";
      const sintese = p.sintese_arqueologica || p.sintese_be || "Vestígio de ocupação humana ancestral catalogado pelo IPHAN.";
      const latDeg = p.coord_lat_deg || "";
      const longDeg = p.coord_long_deg || "";
      const latDms = p.coord_lat_dms || "";
      const longDms = p.coord_long_dms || "";
      const utm = p.utm_sirgas || "SIRGAS 2000";

      return `
        <div class="popup-card">
          <div class="popup-header sitio-header">
            <div class="popup-category" style="color:#ea580c">
              <i data-lucide="flame" style="width:13px;height:13px"></i>
              SÍTIOS ARQUEOLÓGICOS (IPHAN) • ${classif.toUpperCase()}
            </div>
            <div class="popup-title">${nome}</div>
          </div>
          <div class="popup-body">
            <div class="popup-desc">${sintese}</div>
            <div class="popup-data-grid">
              <div class="popup-data-cell">
                <span class="popup-data-label">Código IPHAN</span>
                <span class="popup-data-val" style="color:#ea580c;font-family:var(--font-mono)">${cod}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Tipologia</span>
                <span class="popup-data-val">${tipo}</span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Horizonte Cronológico</span>
                <span class="popup-data-val" style="color:#d97706">${periodo}</span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Coordenadas (SIRGAS 2000)</span>
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
            <span class="badge badge-terracotta"><i data-lucide="shield" style="width:12px;height:12px"></i> IPHAN / SICG</span>
            <button class="popup-btn" onclick="window.App.zoomToCurrentFeature()"><i data-lucide="maximize-2" style="width:12px;height:12px"></i> Centralizar</button>
          </div>
        </div>
      `;
    }

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
      const pop = p.populacao_estimada ? `${p.populacao_estimada} hab.` : "Comunidade tradicional";
      const isPolo = p.e_polo_base ? "POLO DE ATENDIMENTO BASE" : "ALDEIA TRADICIONAL";
      const saude = p.unidade_saude || "Atendimento Periódico EMSI";
      const desc = p.descricao_detalhada || "Aldeia integrante do território tradicional indígena.";
      const latDeg = p.coord_lat_deg || (p.coord_lat ? `${Number(p.coord_lat).toFixed(5)}°` : "");
      const longDeg = p.coord_long_deg || (p.coord_long ? `${Number(p.coord_long).toFixed(5)}°` : "");

      return `
        <div class="popup-card">
          <div class="popup-header">
            <div class="popup-category" style="color:#f59e0b">
              <i data-lucide="${p.e_polo_base ? 'landmark' : 'home'}" style="width:12px;height:12px"></i>
              ${isPolo}
            </div>
            <div class="popup-title">${nome}</div>
          </div>
          <div class="popup-body">
            <div class="popup-desc">${desc}</div>
            <div class="popup-data-grid">
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Terra Indígena / Região</span>
                <span class="popup-data-val" style="color:#10b981">${ti}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Etnia Predominante</span>
                <span class="popup-data-val" style="color:#fbbf24">${etnia}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">População Estimada</span>
                <span class="popup-data-val">${pop}</span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Rio / Eixo de Acesso</span>
                <span class="popup-data-val" style="color:#0ea5e9"><i data-lucide="waves" style="width:12px;height:12px"></i> ${rio}</span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Coordenadas (SIRGAS 2000)</span>
                <span class="popup-data-val" style="font-family:var(--font-mono);font-size:0.72rem">
                  Lat: ${latDeg} • Long: ${longDeg}
                </span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Município e UF</span>
                <span class="popup-data-val">${mun} – ${uf}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Saúde (DSEI)</span>
                <span class="popup-data-val" style="font-size:0.7rem">${saude}</span>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <span class="badge badge-amber"><i data-lucide="map-pin" style="width:12px;height:12px"></i> FUNAI • SIRGAS 2000</span>
            <button class="popup-btn" onclick="window.App.zoomToCurrentFeature()"><i data-lucide="maximize-2" style="width:12px;height:12px"></i> Centralizar</button>
          </div>
        </div>
      `;
    }

    // Massa de Água Popup
    if (layerId === "massaDeAgua") {
      const nome = p.nome_formatado || p.nmoriginal || "Massa de Água";
      const tipo = p.tipo_formatado || p.detipomda || "Corpo d'Água";
      const mun = p.municipio_formatado || p.nmmun || "Região Norte";
      const uf = p.uf_formatada || p.nmufe || "PA / AM / AP";
      const area = p.area_km2_formatada || (p.nuareakm2 ? `${Number(p.nuareakm2).toFixed(2)} km²` : "N/D");
      const perim = p.perimetro_km_formatado || (p.nuperimkm ? `${Number(p.nuperimkm).toFixed(2)} km` : "N/D");
      const dominio = p.dominio_formatado || p.dedominio || "Domínio Público";

      return `
        <div class="popup-card">
          <div class="popup-header rio-header">
            <div class="popup-category" style="color:#0ea5e9">
              <i data-lucide="waves" style="width:12px;height:12px"></i>
              MASSA DE ÁGUA • ${tipo.toUpperCase()}
            </div>
            <div class="popup-title">${nome}</div>
          </div>
          <div class="popup-body">
            <div class="popup-desc">Massa de água da Região Norte catalogada pela Agência Nacional de Águas (Base Hidrográfica Ottocodificada - BHO).</div>
            <div class="popup-data-grid">
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Tipologia Hídrica</span>
                <span class="popup-data-val" style="color:#0ea5e9">${tipo}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Área Superficial</span>
                <span class="popup-data-val">${area}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Perímetro</span>
                <span class="popup-data-val">${perim}</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Município / UF</span>
                <span class="popup-data-val">${mun} (${uf})</span>
              </div>
              <div class="popup-data-cell">
                <span class="popup-data-label">Datum</span>
                <span class="popup-data-val" style="color:#ea580c">SIRGAS 2000</span>
              </div>
              <div class="popup-data-cell full-width">
                <span class="popup-data-label">Domínio</span>
                <span class="popup-data-val" style="font-size:0.75rem">${dominio}</span>
              </div>
            </div>
          </div>
          <div class="popup-footer">
            <span class="badge badge-cyan"><i data-lucide="droplet" style="width:12px;height:12px"></i> ANA • Região Norte</span>
            <button class="popup-btn" onclick="window.App.zoomToCurrentFeature()"><i data-lucide="maximize-2" style="width:12px;height:12px"></i> Centralizar</button>
          </div>
        </div>
      `;
    }

    return `<div>${JSON.stringify(p)}</div>`;
  }

  renderCatalogTree() {
    const container = document.getElementById("layer-catalog-tree");
    if (!container) return;

    let html = "";

    // 1. Sítios Arqueológicos (IPHAN)
    html += `
      <div class="layer-catalog-group" id="group-arqueologia">
        <div class="layer-group-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="layer-group-title" style="color:#f97316">
            <i data-lucide="flame"></i> Sítios Arqueologicos (IPHAN)
          </span>
          <i data-lucide="chevron-down" class="layer-group-collapse-icon"></i>
        </div>
        <div class="layer-group-items">
          ${this.renderLayerCard(this.layers.sitiosArqueologicos)}
        </div>
      </div>
    `;

    // 2. Territorios tradicionais e aldeias do projeto
    html += `
      <div class="layer-catalog-group" id="group-indigena">
        <div class="layer-group-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="layer-group-title">
            <i data-lucide="shield-check"></i> Territorios tradicionais e aldeias do projeto
          </span>
          <i data-lucide="chevron-down" class="layer-group-collapse-icon"></i>
        </div>
        <div class="layer-group-items">
          ${this.renderLayerCard(this.layers.terrasIndigenas)}
          ${this.renderLayerCard(this.layers.aldeias)}
        </div>
      </div>
    `;

    // 3. Recursos Hídricos da Região Norte
    html += `
      <div class="layer-catalog-group" id="group-hidrografia">
        <div class="layer-group-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="layer-group-title">
            <i data-lucide="waves"></i> Recursos Hídricos da Região Norte
          </span>
          <i data-lucide="chevron-down" class="layer-group-collapse-icon"></i>
        </div>
        <div class="layer-group-items">
          ${this.renderLayerCard(this.layers.massaDeAgua)}
        </div>
      </div>
    `;

    container.innerHTML = html;
    if (window.lucide) {
      try { window.lucide.createIcons(); } catch(e) {}
    }

    this.attachCatalogEventListeners();
  }

  renderLayerCard(layer) {
    return `
      <div class="layer-item-card" data-layer-id="${layer.id}">
        <div class="layer-card-top">
          <label class="layer-check-label">
            <input type="checkbox" class="layer-toggle-check" data-layer="${layer.id}" ${layer.visible ? 'checked' : ''}>
            <span class="layer-legend-swatch" style="background-color:${layer.color}"></span>
            <span>${layer.name}</span>
          </label>
          <div class="layer-card-actions">
            <span class="count-badge">${layer.count}</span>
            <button class="layer-mini-btn" title="Zoom para a camada" onclick="window.LayerCatalog.zoomToLayer('${layer.id}')">
              <i data-lucide="maximize" style="width:13px;height:13px"></i>
            </button>
            <button class="layer-mini-btn" title="Abrir tabela de atributos" onclick="window.AttributeTable.openLayerTable('${layer.id}')">
              <i data-lucide="table" style="width:13px;height:13px"></i>
            </button>
          </div>
        </div>

        <div class="layer-controls-row">
          <div class="layer-slider-wrapper">
            <span>Opacidade</span>
            <input type="range" class="layer-opacity-slider" min="0" max="1" step="0.05" value="${layer.opacity}" data-layer="${layer.id}">
          </div>
        </div>
      </div>
    `;
  }

  attachCatalogEventListeners() {
    document.querySelectorAll(".layer-toggle-check").forEach(chk => {
      chk.addEventListener("change", e => {
        const id = e.target.dataset.layer;
        this.toggleLayerVisibility(id, e.target.checked);
      });
    });

    document.querySelectorAll(".layer-opacity-slider").forEach(sld => {
      sld.addEventListener("input", e => {
        const id = e.target.dataset.layer;
        const val = parseFloat(e.target.value);
        this.setLayerOpacity(id, val);
      });
    });
  }

  toggleLayerVisibility(layerId, isVisible) {
    const config = this.layers[layerId];
    if (!config) return;

    config.visible = isVisible;
    if (this.mapManager && this.mapManager.map1 && config.leafletLayer) {
      if (isVisible) config.leafletLayer.addTo(this.mapManager.map1);
      else this.mapManager.map1.removeLayer(config.leafletLayer);
    }

    if (window.App && window.App.showToast) {
      window.App.showToast(`${config.name}: ${isVisible ? 'Visível' : 'Oculta'}`);
    }
  }

  setLayerOpacity(layerId, opacity) {
    const config = this.layers[layerId];
    if (!config) return;
    config.opacity = opacity;

    if (config.leafletLayer) {
      if (config.leafletLayer.eachLayer) {
        config.leafletLayer.eachLayer(l => {
          if (l.setOpacity) l.setOpacity(opacity);
          if (l.setStyle) {
            l.setStyle({
              opacity: opacity,
              fillOpacity: (config.fillOpacity || 0.45) * opacity
            });
          }
        });
      }
    }
  }

  zoomToLayer(layerId) {
    const config = this.layers[layerId];
    if (!config || !config.leafletLayer) return;
    const b = config.leafletLayer.getBounds();
    if (b && b.isValid()) {
      this.mapManager.fitBounds(b);
    }
  }
}

if (typeof window !== "undefined") {
  window.LayerCatalog = LayerCatalog;
}
