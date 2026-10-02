/**
 * =============================================================================
 * [PT-BR] FERRAMENTAS DE EXPORTAÇÃO CARTOGRÁFICA (PNG / PDF)
 * [EN] CARTOGRAPHIC EXPORT TOOLS (PNG / PDF)
 * =============================================================================
 * Projeto: Energia Limpa, Vida Sustentável
 * Elaboração feita por: Jhamenson Nascimento
 * Referência Geodésica: SIRGAS 2000 (EPSG:4674)
 * 
 * [PT-BR] Gera pranchas cartográficas de alta resolução (PNG 2x e PDF A4)
 *         com cabeçalho oficial, logo institucional, carimbo SIRGAS 2000,
 *         QR Code escaneável para acesso online, rosa dos ventos e fontes.
 * [EN] Generates high-resolution cartographic prints (PNG 2x and PDF A4)
 *         featuring official header, project logo, SIRGAS 2000 stamp,
 *         scannable online QR Code, north arrow, and sources.
 * =============================================================================
 */

class ExportTools {
  constructor(mapManager, layerCatalog) {
    this.mapManager = mapManager;
    this.layerCatalog = layerCatalog;
  }

  /**
   * [PT-BR] Inicializa os manipuladores de interface de exportação
   * [EN] Initializes export interface event listeners
   */
  init() {
    this.setupUI();
  }

  setupUI() {
    const printBtn = document.getElementById("btn-print-map");
    const modal = document.getElementById("modal-export-map");
    const closeBtn = document.getElementById("btn-close-export-modal");
    const cancelBtn = document.getElementById("btn-cancel-export");
    const confirmBtn = document.getElementById("btn-confirm-export");

    if (printBtn) {
      printBtn.addEventListener("click", () => this.openExportModal());
    }

    if (closeBtn) closeBtn.addEventListener("click", () => this.closeExportModal());
    if (cancelBtn) cancelBtn.addEventListener("click", () => this.closeExportModal());

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => this.executeExport());
    }
  }

  /**
   * [PT-BR] Abre o modal de configuração de exportação
   * [EN] Opens the export configuration modal
   */
  openExportModal() {
    const modal = document.getElementById("modal-export-map");
    if (modal) modal.classList.add("open");
  }

  /**
   * [PT-BR] Fecha o modal de exportação
   * [EN] Closes the export modal
   */
  closeExportModal() {
    const modal = document.getElementById("modal-export-map");
    if (modal) modal.classList.remove("open");
  }

  /**
   * ===========================================================================
   * [PT-BR] EXECUÇÃO DA RENDERIZAÇÃO E GERAÇÃO DA PRANCHA CARTOGRÁFICA
   * [EN] EXECUTION OF CARTOGRAPHIC RENDERING & SHEET COMPOSITION
   * ===========================================================================
   */
  async executeExport() {
    const titleInput = document.getElementById("export-title-input");
    const subtitleInput = document.getElementById("export-subtitle-input");
    const formatSelect = document.getElementById("export-format-select");
    const confirmBtn = document.getElementById("btn-confirm-export");

    const title = titleInput ? titleInput.value : "Projeto: Energia Limpa, Vida Sustentável";
    const subtitle = subtitleInput ? subtitleInput.value : "Calha Norte do Pará • Complexo do Oiapoque (SIRGAS 2000)";
    const format = formatSelect ? formatSelect.value : "png";

    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> Gerando mapa cartográfico...`;
      if (window.lucide) window.lucide.createIcons();
    }

    try {
      const mapContainer = document.getElementById("map1");
      if (!mapContainer) return;

      if (typeof html2canvas === "undefined") {
        alert("Biblioteca html2canvas não disponível.");
        return;
      }

      // Captura a tela do mapa Leaflet em Alta Resolução (Escala 2x)
      // Capture Leaflet map canvas in High Resolution (2x Scale)
      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0d0c0a",
        scale: 2
      });

      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d");

      const margin = 50;
      const headerHeight = 100;
      const footerHeight = 60;

      finalCanvas.width = canvas.width + margin * 2;
      finalCanvas.height = canvas.height + margin * 2 + headerHeight + footerHeight;

      // Fundo escuro elegante da prancha cartográfica
      // Warm dark cartographic background
      ctx.fillStyle = "#141210";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // 1. Renderiza o Logotipo Oficial no canto superior direito
      //    Render Official Project Logo in top right corner
      try {
        const logoImg = new Image();
        logoImg.src = "assets/logo.png";
        await new Promise(r => {
          logoImg.onload = r;
          logoImg.onerror = r;
        });
        if (logoImg.width > 0) {
          const logoH = 65;
          const logoW = (logoImg.width / logoImg.height) * logoH;
          ctx.drawImage(logoImg, finalCanvas.width - margin - logoW, margin + 5, logoW, logoH);
        }
      } catch (e) {
        console.warn("[WebGIS Export] Logo não renderizado na exportação:", e);
      }

      // 2. Título e Subtítulo Cartográfico
      //    Title & Subtitle Typography
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(title, margin, margin + 35);

      ctx.fillStyle = "#ea580c";
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(subtitle, margin, margin + 65);

      // 3. Carimbo Geodésico SIRGAS 2000 e Data de Geração
      //    Geodetic Reference SIRGAS 2000 & Timestamp
      ctx.fillStyle = "#a8a29e";
      ctx.font = "13px 'JetBrains Mono', monospace";
      const dateStr = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR");
      ctx.fillText(`Datum: SIRGAS 2000 (EPSG:4674) • Gerado em: ${dateStr}`, margin, margin + 88);

      // 4. Desenha a Imagem do Mapa Capturado
      //    Draw Captured Map Image
      ctx.drawImage(canvas, margin, margin + headerHeight);

      // Moldura externa em terracota
      // Outer border frame in terracotta
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 3;
      ctx.strokeRect(margin - 1, margin + headerHeight - 1, canvas.width + 2, canvas.height + 2);

      // 5. Renderiza o QR Code no rodapé para acesso online de pranchas impressas
      //    Render Scannable QR Code in footer for instant mobile access from printed maps
      try {
        const qrImg = new Image();
        qrImg.src = "assets/qrcode_webgis.png";
        await new Promise(r => {
          qrImg.onload = r;
          qrImg.onerror = r;
        });
        if (qrImg.width > 0) {
          const qrSize = 48;
          ctx.drawImage(qrImg, finalCanvas.width - margin - 230, finalCanvas.height - margin + 2, qrSize, qrSize);
        }
      } catch (e) {
        console.warn("[WebGIS Export] QR Code não embutido:", e);
      }

      // 6. Rodapé de Autoria e Fontes Oficiais
      //    Footer Authorship & Official Data Sources
      ctx.fillStyle = "#a8a29e";
      ctx.font = "13px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("Elaboração feita por Jhamenson Nascimento • Fontes: FUNAI • IBGE • ANA • Base Cartográfica WebGIS", margin, finalCanvas.height - margin + 22);

      // 7. Rosa dos Ventos / Indicador do Norte Cartográfico
      //    North Arrow Cartographic Indicator
      ctx.fillStyle = "#ea580c";
      ctx.font = "bold 18px monospace";
      ctx.fillText("▲ N (SIRGAS 2000)", finalCanvas.width - margin - 170, finalCanvas.height - margin + 30);

      // 8. Exportação no Formato Selecionado (PNG / PDF)
      //    Export in Selected Format (PNG / PDF)
      if (format === "png") {
        const imgUrl = finalCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `mapa_energia_limpa_${Date.now()}.png`;
        link.href = imgUrl;
        link.click();
      } else if (format === "pdf") {
        if (typeof jspdf !== "undefined") {
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF({
            orientation: finalCanvas.width > finalCanvas.height ? "landscape" : "portrait",
            unit: "px",
            format: [finalCanvas.width, finalCanvas.height]
          });
          pdf.addImage(finalCanvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, finalCanvas.width, finalCanvas.height);
          pdf.save(`mapa_energia_limpa_${Date.now()}.pdf`);
        }
      }

      this.closeExportModal();
      if (window.App && window.App.showToast) {
        window.App.showToast("Mapa exportado com sucesso em SIRGAS 2000!");
      }
    } catch (e) {
      console.error("[WebGIS] Erro na exportação do mapa:", e);
      alert("Houve um erro ao processar o mapa para exportação.");
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<i data-lucide="download"></i> Exportar Arquivo`;
        if (window.lucide) window.lucide.createIcons();
      }
    }
  }
}

if (typeof window !== "undefined") {
  window.ExportTools = ExportTools;
}
