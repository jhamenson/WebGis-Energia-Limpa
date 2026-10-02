/**
 * =============================================================================
 * [PT-BR] PAINEL DE ESTATÍSTICAS TERRITORIAIS & DEMOGRÁFICAS (CHART.JS)
 * [EN] TERRITORIAL & DEMOGRAPHIC ANALYTICS DASHBOARD (CHART.JS)
 * =============================================================================
 * Projeto: Energia Limpa, Vida Sustentável
 * Elaboração feita por: Jhamenson Nascimento
 * Referência Geodésica: SIRGAS 2000 (EPSG:4674)
 * 
 * [PT-BR] Calcula indicadores-chave (KPIs) de área, população e aldeias,
 *         e renderiza gráficos interativos de etnias e distribuição territorial.
 * [EN] Calculates key performance indicators (KPIs) for area, population,
 *         and villages, and renders interactive demographic charts.
 * =============================================================================
 */

class AnalyticsPanel {
  constructor(layerCatalog) {
    this.layerCatalog = layerCatalog;
    this.chartEtnias = null;
    this.chartType = null;
    this.chartPopulation = null;
  }

  /**
   * [PT-BR] Inicializa os cálculos de KPI e renderização de gráficos
   * [EN] Initializes KPI calculations and chart rendering
   */
  init() {
    this.calculateKPIs();
    this.renderCharts();
  }

  /**
   * ===========================================================================
   * [PT-BR] CÁLCULO DOS INDICADORES TERRITORIAIS CONSOLIDADOS (KPIS)
   * [EN] CONSOLIDATED TERRITORIAL METRICS CALCULATION (KPIS)
   * ===========================================================================
   */
  calculateKPIs() {
    const tiConfig = this.layerCatalog.layers.terrasIndigenas;
    const aldConfig = this.layerCatalog.layers.aldeias;

    let totalAreaHa = 7674702;
    let totalPop = 12975;

    if (tiConfig && tiConfig.geoJsonData && tiConfig.geoJsonData.features) {
      let calcArea = 0;
      let calcPop = 0;
      tiConfig.geoJsonData.features.forEach(f => {
        if (f.properties.superficie) calcArea += Number(f.properties.superficie);
        else if (f.properties.superficie_ha) calcArea += Number(f.properties.superficie_ha);
        if (f.properties.populacao_estimada) calcPop += Number(f.properties.populacao_estimada);
      });
      if (calcArea > 0) totalAreaHa = calcArea;
      if (calcPop > 0) totalPop = calcPop;
    }

    const totalAldeias = aldConfig && aldConfig.count ? aldConfig.count : 28;
    const waterConfig = this.layerCatalog.layers.massaDeAgua;
    const totalWater = waterConfig && waterConfig.count ? waterConfig.count : 250;

    // Atualiza os elementos visuais dos cards de métricas
    // Update KPI card DOM elements
    const kpiArea = document.getElementById("kpi-total-area");
    const kpiPop = document.getElementById("kpi-total-pop");
    const kpiAld = document.getElementById("kpi-total-aldeias");
    const kpiWater = document.getElementById("kpi-total-water");

    if (kpiArea) kpiArea.textContent = (totalAreaHa / 1000000).toFixed(2) + " M ha";
    if (kpiPop) kpiPop.textContent = "~" + totalPop.toLocaleString('pt-BR') + " hab.";
    if (kpiAld) kpiAld.textContent = `${totalAldeias}`;
    if (kpiWater) kpiWater.textContent = `${totalWater} Corpos d'Água`;
  }

  /**
   * ===========================================================================
   * [PT-BR] RENDERIZAÇÃO DOS GRÁFICOS (CHART.JS)
   * [EN] CHART.JS GRAPHICAL RENDERING
   * ===========================================================================
   */
  renderCharts() {
    if (typeof Chart === "undefined") {
      console.warn("[WebGIS Analytics] Chart.js não carregado.");
      return;
    }

    this.renderEtniasChart();
    this.renderVillageTypeChart();
    this.renderPopulationChart();
  }

  /**
   * [PT-BR] Gráfico 1: Composição Demográfica por Povo / Etnia
   * [EN] Chart 1: Demographic Composition by Indigenous Ethnicity
   */
  renderEtniasChart() {
    const ctx = document.getElementById("chart-etnias") || document.getElementById("chart-etnias-dist");
    if (!ctx) return;

    if (this.chartEtnias) this.chartEtnias.destroy();

    this.chartEtnias = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Wai Wai", "Galibi-Marworno", "Palikur-Arukwayene", "Kaxuyana/Tunayana", "Hixkaryana"],
        datasets: [{
          data: [4350, 4195, 2100, 1480, 850],
          backgroundColor: ["#ea580c", "#10b981", "#38bdf8", "#fbbf24", "#34d399"],
          borderColor: "#12100e",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#d6d3d1", font: { size: 10, family: "'Plus Jakarta Sans'" } }
          }
        }
      }
    });
  }

  /**
   * [PT-BR] Gráfico 2: Classificação das Aldeias (Polos Base vs Comunidades)
   * [EN] Chart 2: Village Classification (Health Bases vs Communities)
   */
  renderVillageTypeChart() {
    const ctx = document.getElementById("chart-aldeias-type") || document.getElementById("chart-superficie");
    if (!ctx) return;

    if (this.chartType) this.chartType.destroy();

    this.chartType = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Polos Base de Saúde (DSEI)", "Aldeias e Comunidades Tradicionais"],
        datasets: [{
          data: [5, 23],
          backgroundColor: ["#ea580c", "#d97706"],
          borderColor: "#12100e",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: "#d6d3d1", font: { size: 10, family: "'Plus Jakarta Sans'" } }
          }
        }
      }
    });
  }

  /**
   * [PT-BR] Gráfico 3: População Estimada por Terra Indígena
   * [EN] Chart 3: Estimated Population by Indigenous Land
   */
  renderPopulationChart() {
    const ctx = document.getElementById("chart-population");
    if (!ctx) return;

    if (this.chartPopulation) this.chartPopulation.destroy();

    this.chartPopulation = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Trombetas/Mapuera", "Uaçá", "Nhamundá/Mapuera", "Kaxuyana-Tunayana"],
        datasets: [{
          label: "População Estimada (hab.)",
          data: [4350, 4195, 2950, 1480],
          backgroundColor: "#f59e0b",
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: "#a8a29e", font: { size: 9 } }, grid: { display: false } },
          y: { ticks: { color: "#a8a29e", font: { size: 9 } }, grid: { color: "rgba(255,255,255,0.05)" } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

if (typeof window !== "undefined") {
  window.AnalyticsPanel = AnalyticsPanel;
}
