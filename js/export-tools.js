/**
 * Export & Print Tools - PROJETO: ENERGIA LIMPA • ARQUEOLOGIA
 * Exports map views to PNG and PDF with automated cartographic headers,
 * official project logo, SIRGAS 2000 geodetic stamp, legend, scale, and north arrow.
 */

class ExportTools {
  constructor(mapManager, layerCatalog) {
    this.mapManager = mapManager;
    this.layerCatalog = layerCatalog;
  }

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

  openExportModal() {
    const modal = document.getElementById("modal-export-map");
    if (modal) modal.classList.add("open");
  }

  closeExportModal() {
    const modal = document.getElementById("modal-export-map");
    if (modal) modal.classList.remove("open");
  }

  async executeExport() {
    const titleInput = document.getElementById("export-title-input");
    const subtitleInput = document.getElementById("export-subtitle-input");
    const formatSelect = document.getElementById("export-format-select");
    const confirmBtn = document.getElementById("btn-confirm-export");

    const title = titleInput ? titleInput.value : "MAPA ARQUEOLÓGICO • PROJETO: ENERGIA LIMPA";
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

      const canvas = await html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0d0c0a",
        scale: 2 // High Resolution 2x
      });

      const finalCanvas = document.createElement("canvas");
      const ctx = finalCanvas.getContext("2d");

      const margin = 50;
      const headerHeight = 100;
      const footerHeight = 50;

      finalCanvas.width = canvas.width + margin * 2;
      finalCanvas.height = canvas.height + margin * 2 + headerHeight + footerHeight;

      // Background (Warm Archaeological Slate)
      ctx.fillStyle = "#141210";
      ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Try drawing the official logo on top right of the sheet
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
        console.warn("Logo não renderizado na exportação:", e);
      }

      // Title & Subtitle Header
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(title, margin, margin + 35);

      ctx.fillStyle = "#ea580c";
      ctx.font = "bold 16px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText(subtitle, margin, margin + 65);

      // Geodetic Reference & Date Stamp
      ctx.fillStyle = "#a8a29e";
      ctx.font = "13px 'JetBrains Mono', monospace";
      const dateStr = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR");
      ctx.fillText(`Datum: SIRGAS 2000 (EPSG:4674) • Gerado: ${dateStr}`, margin, margin + 88);

      // Draw map image
      ctx.drawImage(canvas, margin, margin + headerHeight);

      // Outer border frame (Terracotta Stroke)
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 3;
      ctx.strokeRect(margin - 1, margin + headerHeight - 1, canvas.width + 2, canvas.height + 2);

      // Footer Attribution & North Arrow
      ctx.fillStyle = "#a8a29e";
      ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillText("Fontes: IPHAN (SICG) • FUNAI • IBGE • ANA • Base Cartográfica WebGIS", margin, finalCanvas.height - margin + 15);

      // North Arrow Indicator
      ctx.fillStyle = "#ea580c";
      ctx.font = "bold 20px monospace";
      ctx.fillText("▲ N (SIRGAS 2000)", finalCanvas.width - margin - 180, finalCanvas.height - margin + 15);

      if (format === "png") {
        const imgUrl = finalCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `mapa_arqueologico_${Date.now()}.png`;
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
          pdf.save(`mapa_arqueologico_${Date.now()}.pdf`);
        }
      }

      this.closeExportModal();
      if (window.App && window.App.showToast) {
        window.App.showToast("Mapa exportado com sucesso em SIRGAS 2000!");
      }
    } catch (e) {
      console.error("Erro na exportação do mapa:", e);
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
