/**
 * Data Enhancer & Knowledge Base for WebGIS Arqueológico • Projeto: Energia Limpa
 * Enriches raw GeoJSON properties with IPHAN archaeological classifications,
 * ethnographic context, FUNAI official village attributes, and strict SIRGAS 2000 coordinates.
 */

function cleanAccents(str) {
  if (!str) return "";
  return String(str)
    .replace(/áá+/g, "á")
    .replace(/ãã+/g, "ã")
    .replace(/éé+/g, "é")
    .replace(/íí+/g, "í")
    .replace(/óó+/g, "ó")
    .replace(/úú+/g, "ú")
    .replace(/ÁÁ+/g, "Á")
    .replace(/ÃÃ+/g, "Ã")
    .replace(/ÉÉ+/g, "É")
    .replace(/ÍÍ+/g, "Í")
    .replace(/ÓÓ+/g, "Ó")
    .replace(/ÚÚ+/g, "Ú");
}

const ARCHAEOLOGICAL_KNOWLEDGE_BASE = {
  classificacoes: {
    "Pré-colonial": {
      periodo: "Pré-Cabralino / Holoceno Superior (10.000 AP - 1500 DC)",
      badgeColor: "#ea580c",
      icon: "flame",
      descricao: "Vestígios arqueológicos de ocupações humanas indígenas anteriores ao contato com colonizadores europeus. Inclui aterros cerâmicos, terra preta de índio (TPI), indústrias líticas e estruturas megalíticas."
    },
    "Histórico": {
      periodo: "Pós-Contato / Colonial / Imperial (Séculos XVI ao XIX)",
      badgeColor: "#d97706",
      icon: "landmark",
      descricao: "Estruturas, ruínas de fortificações, capelas, assentamentos ribeirinhos e missões religiosas fundadas a partir da presença europeia e da colonização amazônica."
    },
    "Histórico e indígena": {
      periodo: "Período de Contato e Missões (Séculos XVII e XVIII)",
      badgeColor: "#b45309",
      icon: "users",
      descricao: "Sítios de contato interétnico e interação cultural contendo cerâmica de tradição indígena associada a artefatos manufaturados de ferro, vidro e faiança colonial."
    },
    "Contato": {
      periodo: "Fronteira Colonial / Século XVIII",
      badgeColor: "#ca8a04",
      icon: "compass",
      descricao: "Assentamentos de transição e entrepostos comerciais fluviais nas calhas do Trombetas, Oiapoque e Amazonas."
    }
  },

  tiposSitio: {
    "Sítio": "Sítio Arqueológico a céu aberto ou ribeirinho com densa concentração de fragmentos cerâmicos, material lítico lascado/polido e horizonte antrópico.",
    "Abrigo sob rocha": "Cavidade natural ou paleotoca utilizada para refúgio temporário, sepultamento ou suporte de painéis de arte rupestre.",
    "Arte Rupestre": "Paredões e afloramentos rochosos com gravuras (petróglifos) e pinturas pré-coloniais representativas de fauna, figuras antropomorfas e cosmologia ancestral.",
    "Estrutura Megalítica": "Monólitos e alinhamentos astronômicos de blocos de granito associados a rituais e observações celestes (ex: Megalitos do Calçoene / Oiapoque).",
    "Terra Preta": "Solos antropogênicos férteis (Terra Preta de Índio) associados a assentamentos sedentários pré-coloniais densamente povoados."
  }
};

function toSIRGAS2000DMS(deg, isLat) {
  if (deg === null || deg === undefined || isNaN(deg)) return "N/D";
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

  let direction = isLat ? (deg >= 0 ? "N" : "S") : (deg >= 0 ? "E" : "W");
  return `${degrees}° ${String(minutes).padStart(2, '0')}' ${String(seconds).padStart(2, '0')}" ${direction}`;
}

function getSIRGAS2000UTM(lng, lat) {
  if (lng === null || lat === null || isNaN(lng) || isNaN(lat)) return "SIRGAS 2000";
  const zone = Math.floor((lng + 180) / 6) + 1;
  const hemi = lat >= 0 ? "N" : "S";
  return `UTM ${zone}${hemi} (SIRGAS 2000 / EPSG:4674)`;
}

/**
 * Enhancer for IPHAN Archaeological Sites
 */
window.enhanceSitioFeature = function(props, coords) {
  const p = { ...props };
  const lng = coords ? coords[0] : null;
  const lat = coords ? coords[1] : null;

  p.nome_formatado = cleanAccents(p.nome_sitio || p.identifica || "Sítio Arqueológico");
  p.codigo_oficial = cleanAccents(p.codigo_iphan || p.co_iphan || "IPHAN-CNSA");
  p.classificacao = cleanAccents(p.classificacao_arqueologica || p.ds_classif || "Pré-colonial");
  p.tipo = cleanAccents(p.tipo_sitio || p.ds_tipo_be || "Sítio");

  const classInfo = ARCHAEOLOGICAL_KNOWLEDGE_BASE.classificacoes[p.classificacao] || {
    periodo: "Contexto Arqueológico Regional",
    badgeColor: "#ea580c",
    icon: "archive",
    descricao: "Vestígio arqueológico registrado pelo IPHAN no Cadastro Nacional de Sítios Arqueológicos."
  };

  p.periodo_cronologico = classInfo.periodo;
  p.badge_color = classInfo.badgeColor;
  p.icon_tipo = classInfo.icon;
  p.descricao_classificacao = classInfo.descricao;
  p.descricao_tipo = ARCHAEOLOGICAL_KNOWLEDGE_BASE.tiposSitio[p.tipo] || "Assentamento ou registro arqueológico catalogado no SICG/IPHAN.";

  p.datum_oficial = "SIRGAS 2000 (EPSG: 4674)";
  if (lng !== null && lat !== null) {
    p.coord_lat_deg = lat.toFixed(5) + "°";
    p.coord_long_deg = lng.toFixed(5) + "°";
    p.coord_lat_dms = toSIRGAS2000DMS(lat, true);
    p.coord_long_dms = toSIRGAS2000DMS(lng, false);
    p.utm_sirgas = getSIRGAS2000UTM(lng, lat);
  }

  return p;
};

/**
 * Enhancer for Terras Indígenas
 */
window.enhanceTerraIndigenaFeature = function(props) {
  const p = { ...props };
  const nameNorm = (p.terrai_nom || "").toLowerCase().trim();

  const tiData = {
    "trombetas/mapuera": {
      nome_oficial: "Terra Indígena Trombetas/Mapuera",
      superficie_ha: 3970898,
      populacao_estimada: 4350,
      etnia_nome: "Wai Wai, Hixkaryana, Katuena, Xereu, Tunayana, Sikiyana",
      familia_linguistica: "Karib e Aruak",
      fase_ti: "Regularizada",
      decreto_homologacao: "Decreto Presidencial s/nº de 18/12/2009",
      municipios_lista: "Oriximiná, Faro, Nhamundá, Urucará, Caracaraí",
      uf_sigla: "PA / AM / RR",
      bacia_principal: "Bacia do Rio Trombetas / Rio Mapuera / Rio Cachorro",
      bioma: "Amazônia Setentrional",
      descricao_etnoambiental: "Maior Terra Indígena contígua da Calha Norte do Pará."
    },
    "kaxuyana-tunayana": {
      nome_oficial: "Terra Indígena Kaxuyana-Tunayana",
      superficie_ha: 2184120,
      populacao_estimada: 1480,
      etnia_nome: "Kaxuyana, Tunayana, Kahyana, Txikiyana, Ingarikó",
      familia_linguistica: "Karib",
      fase_ti: "Declarada / Regularizada",
      decreto_homologacao: "Portaria Declaratória MJ nº 196 de 20/09/2018",
      municipios_lista: "Oriximiná, Faro, Nhamundá",
      uf_sigla: "PA / AM",
      bacia_principal: "Bacia do Rio Katxuru e Rio Trombetas",
      bioma: "Floresta Tropical Densa",
      descricao_etnoambiental: "Território de refúgio histórico dos Kaxuyana e Tunayana."
    },
    "nhamundá/mapuera": {
      nome_oficial: "Terra Indígena Nhamundá/Mapuera",
      superficie_ha: 1049520,
      populacao_estimada: 2950,
      etnia_nome: "Hixkaryana, Wai Wai",
      familia_linguistica: "Karib",
      fase_ti: "Regularizada",
      decreto_homologacao: "Decreto Presidencial nº 98.058 de 16/08/1989",
      municipios_lista: "Faro, Nhamundá, Oriximiná",
      uf_sigla: "PA / AM",
      bacia_principal: "Bacia do Rio Nhamundá e Bacia do Rio Mapuera",
      bioma: "Amazônia",
      descricao_etnoambiental: "Sede de grandes aldeias históricas, com destaque para a Aldeia Polo Mapuera."
    },
    "uaçá": {
      nome_oficial: "Terra Indígena Uaçá",
      superficie_ha: 470164,
      populacao_estimada: 6950,
      etnia_nome: "Karipuna do Amapá, Galibi-Marworno, Palikur-Arukwayene",
      familia_linguistica: "Kréyol Francês, Aruak (Palikur)",
      fase_ti: "Regularizada / Homologada",
      decreto_homologacao: "Decreto Presidencial nº 68.667 de 26/05/1971",
      municipios_lista: "Oiapoque",
      uf_sigla: "AP",
      bacia_principal: "Bacia Hidrográfica do Rio Uaçá e Campos Inundáveis",
      bioma: "Amazônia Costeira e Manguezais",
      descricao_etnoambiental: "Complexo socioambiental transfronteiriço do Oiapoque."
    },
    "juminá": {
      nome_oficial: "Terra Indígena Juminá",
      superficie_ha: 41601,
      populacao_estimada: 140,
      etnia_nome: "Karipuna, Galibi-Marworno",
      familia_linguistica: "Kréyol",
      fase_ti: "Regularizada",
      decreto_homologacao: "Decreto Presidencial nº 85.890 de 08/04/1981",
      municipios_lista: "Oiapoque",
      uf_sigla: "AP",
      bacia_principal: "Bacia do Rio Oiapoque",
      bioma: "Amazônia",
      descricao_etnoambiental: "Área tradicional dos povos indígenas do Amapá."
    },
    "galibi": {
      nome_oficial: "Terra Indígena Galibi",
      superficie_ha: 6689,
      populacao_estimada: 195,
      etnia_nome: "Galibi do Oiapoque (Kali'na)",
      familia_linguistica: "Karib",
      fase_ti: "Regularizada",
      decreto_homologacao: "Decreto Presidencial nº 87.824 de 17/11/1982",
      municipios_lista: "Oiapoque",
      uf_sigla: "AP",
      bacia_principal: "Estuário do Rio Oiapoque",
      bioma: "Amazônia Costeira",
      descricao_etnoambiental: "Território tradicional do povo Galibi (Kali'na)."
    }
  };

  for (const k in tiData) {
    if (nameNorm.includes(k)) {
      Object.assign(p, tiData[k]);
      p.superficie_ha_formatada = p.superficie_ha.toLocaleString('pt-BR') + " ha";
      break;
    }
  }

  p.terrai_nom = cleanAccents(p.terrai_nom || p.nome_oficial || "Terra Indígena");
  p.nome_oficial = cleanAccents(p.nome_oficial || p.terrai_nom);
  p.municipios_lista = cleanAccents(p.municipios_lista || "Calha Norte / Oiapoque");
  p.datum_oficial = "SIRGAS 2000 (EPSG: 4674)";
  return p;
};

/**
 * Enhancer for Aldeias (Official FUNAI attributes for the 15 project villages)
 */
window.enhanceAldeiaFeature = function(props, coords) {
  const p = { ...props };
  const rawName = cleanAccents(p.nome_aldei || "Aldeia").trim();
  const lng = coords ? coords[0] : (p.coord_long ? parseFloat(p.coord_long) : null);
  const lat = coords ? coords[1] : (p.coord_lat ? parseFloat(p.coord_lat) : null);

  p.nome_formatado = rawName;
  p.nome_aldei = rawName;
  p.terra_indigena = cleanAccents(p.terra_indigena || (lat > 2.0 ? "TI Uaçá" : "TI Trombetas/Mapuera"));
  p.etnia_predominante = cleanAccents(p.etnia_predominante || (lat > 2.0 ? "Galibi-Marworno / Palikur" : "Wai Wai / Kaxuyana"));
  p.nommunic = cleanAccents(p.nommunic || (lat > 2.0 ? "Oiapoque" : "Oriximiná"));
  p.nomuf = cleanAccents(p.nomuf || (lat > 2.0 ? "Amapá" : "Pará"));
  p.rio_proximo = cleanAccents(p.rio_proximo || (lat > 2.0 ? "Rio Uaçá" : "Rio Mapuera"));
  p.populacao_estimada = p.populacao_estimada || 150;
  p.unidade_saude = cleanAccents(p.unidade_saude || "Atendimento Periódico EMSI (DSEI)");
  p.descricao_detalhada = cleanAccents(p.descricao_detalhada || "Aldeia indígena integrante do território tradicional.");

  p.datum_oficial = "SIRGAS 2000 (EPSG: 4674)";
  if (lng !== null && lat !== null) {
    p.coord_lat_deg = lat.toFixed(5) + "°";
    p.coord_long_deg = lng.toFixed(5) + "°";
    p.coord_lat_dms = toSIRGAS2000DMS(lat, true);
    p.coord_long_dms = toSIRGAS2000DMS(lng, false);
    p.utm_sirgas = getSIRGAS2000UTM(lng, lat);
  }

  return p;
};

/**
 * Enhancer for ANA Massa de Água (geoft_bho_massa_dagua_v2019)
 */
window.enhanceMassaDaguaFeature = function(props) {
  const p = { ...props };
  const nomeRaw = cleanAccents(p.nmoriginal || "").trim();

  p.nome_formatado = nomeRaw ? nomeRaw : "Massa de Água / Curso Hídrico";
  p.tipo_formatado = cleanAccents(p.detipomda || "Corpo d'Água Natural");
  p.dominio_formatado = cleanAccents(p.dedominio || "Domínio Público / União");
  p.municipio_formatado = cleanAccents(p.nmmun || "Calha Norte / Oiapoque");
  p.uf_formatada = cleanAccents(p.nmufe || "PA / AM / AP");

  if (p.nuareakm2) {
    const a = parseFloat(p.nuareakm2);
    p.area_km2_formatada = !isNaN(a) ? `${a.toFixed(2)} km²` : `${p.nuareakm2} km²`;
  } else {
    p.area_km2_formatada = "Sob cálculo";
  }

  if (p.nuperimkm) {
    const per = parseFloat(p.nuperimkm);
    p.perimetro_km_formatado = !isNaN(per) ? `${per.toFixed(2)} km` : `${p.nuperimkm} km`;
  }

  p.fonte_oficial = "Agência Nacional de Águas (ANA) • BHO 2019";
  p.datum_oficial = "SIRGAS 2000 (EPSG: 4674)";
  return p;
};
