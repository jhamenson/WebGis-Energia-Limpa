/**
 * Analytics Panel - PROJETO: ENERGIA LIMPA • ARQUEOLOGIA
 * Interactive charts & KPIs for Archaeological Heritage (IPHAN) and Indigenous Lands.
 */

class AnalyticsPanel {
  constructor(layerCatalog) {
    this.layerCatalog = layerCatalog;
    this.chartSitios = null;
    this.chartSuperficie = null;
    this.chartPopulation = null;
  }

  init() {
    this.calculateKPIs();
    this.renderCharts();
  }

  calculateKPIs() {
    const sitiosConfig = this.layerCatalog.layers.sitiosArqueologicos;
    const tiConfig = this.layerCatalog.layers.terrasIndigenas;
    const aldConfig = this.layerCatalog.layers.aldeias;

    let totalSitios = sitiosConfig && sitiosConfig.geoJsonData && sitiosConfig.geoJsonData.features ? sitiosConfig.geoJsonData.features.length : 2670;
    let totalAreaHa = 7732454;
    let totalPop = 15870;

    if (tiConfig && tiConfig.geoJsonData && tiConfig.geoJsonData.features) {
      totalAreaHa = 0;
      totalPop = 0;
      tiConfig.geoJsonData.features.forEach(f => {
        if (f.properties.superficie) totalAreaHa += Number(f.properties.superficie);
        else if (f.properties.superficie_ha) totalAreaHa += Number(f.properties.superficie_ha);
        if (f.properties.populacao_estimada) totalPop += Number(f.properties.populacao_estimada);
      });
    }

    const totalAldeias = aldConfig ? aldConfig.count : 15;

    // Update KPI card elements
    const kpiSitios = document.getElementById("kpi-total-sitios");
    const kpiArea = document.getElementById("kpi-total-area");
    const kpiPop = document.getElementById("kpi-total-pop");
    const kpiAld = document.getElementById("kpi-total-aldeias");

    if (kpiSitios) kpiSitios.textContent = totalSitios.toLocaleString('pt-BR');
    if (kpiArea) kpiArea.textContent = (totalAreaHa / 1000000).toFixed(2) + " M ha";
    if (kpiPop) kpiPop.textContent = "~" + totalPop.toLocaleString('pt-BR');
    if (kpiAld) kpiAld.textContent = `${totalAldeias} Aldeias`;
  }

  renderCharts() {
    if (typeof Chart === "undefined") {
      console.warn("Chart.js não carregado.");
      return;
    }

    this.renderSitiosChart();
    this.renderSuperficieChart();
    this.renderPopulationChart();
  }

  renderSitiosChart() {
    const ctx = document.getElementById("chart-sitios-classif");
    if (!ctx) return;

    if (this.chartSitios) this.chartSitios.destroy();

    this.chartSitios = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Pré-colonial", "Histórico", "Contato", "Sem Classificação"],
        datasets: [{
          data: [2140, 310, 85, 135],
          backgroundColor: ["#ea580c", "#d97706", "#ca8a04", "#78716c"],
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

  renderSuperficieChart() {
    const ctx = document.getElementById("chart-superficie");
    if (!ctx) return;

    if (this.chartSuperficie) this.chartSuperficie.destroy();

    this.chartSuperficie = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Trombetas/Mapuera", "Kaxuyana-Tunayana", "Nhamundá/Mapuera", "Uaçá", "Juminá", "Galibi"],
        datasets: [{
          label: "Área (mil hectares)",
          data: [3970.8, 2184.1, 1049.5, 470.1, 41.6, 6.6],
          backgroundColor: "#10b981",
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

  renderPopulationChart() {
    const ctx = document.getElementById("chart-population");
    if (!ctx) return;

    if (this.chartPopulation) this.chartPopulation.destroy();

    this.chartPopulation = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Uaçá", "Trombetas/Mapuera", "Nhamundá/Mapuera", "Kaxuyana", "Galibi", "Juminá"],
        datasets: [{
          label: "Habitantes",
          data: [6950, 4350, 2950, 1480, 195, 140],
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
