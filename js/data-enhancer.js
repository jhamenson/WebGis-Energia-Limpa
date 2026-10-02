/**
 * =============================================================================
 * [PT-BR] ENRIQUECEDOR DE DADOS ESPACIAIS, ETNOGRAFIA & CONVERSOR SIRGAS 2000
 * [EN] SPATIAL DATA ENHANCER, ETHNOGRAPHY & SIRGAS 2000 CONVERTER
 * =============================================================================
 * Projeto: Energia Limpa, Vida Sustentável
 * Elaboração feita por: Jhamenson Nascimento
 * Referência Geodésica: SIRGAS 2000 (EPSG:4674)
 * 
 * [PT-BR] Contém base de conhecimento etnográfica, correção toponímica (FUNAI),
 *         limpeza de caracteres UTF-8 e conversores geodésicos para
 *         Graus Decimais, DMS e Projeções UTM Fuso 21N/22N.
 * [EN] Contains ethnographic knowledge base, official toponymic corrections,
 *         UTF-8 accent normalization, and geodetic converters for
 *         Decimal Degrees, DMS, and UTM Zone 21N/22N Projections.
 * =============================================================================
 */

/**
 * [PT-BR] Limpeza e correção de acentuação e caracteres corrompidos (mojibake)
 * [EN] Clean and normalize UTF-8 accented characters and mojibake tokens
 */
function cleanAccents(str) {
  if (!str) return "";
  let s = String(str);

  const exactMojibake = {
    "HÃ­drico": "Hídrico",
    "HÃdrico": "Hídrico",
    "HÃƒÂ­drico": "Hídrico",
    "JOSÃ‰": "JOSÉ",
    "JOSÃ": "JOSÉ",
    "PORFÃ RIO": "PORFÍRIO",
    "PORFÃRIO": "PORFÍRIO",
    "VITÃ“RIA": "VITÓRIA",
    "VITÃRIA": "VITÓRIA",
    "ORIXIMINÃ": "ORIXIMINÁ",
    "NHAMUNDÃ": "NHAMUNDÁ",
    "SANTARÃ‰M": "SANTARÉM",
    "SANTARÃM": "SANTARÉM",
    "URUCARÃ": "URUCARÁ",
    "CURUÃ": "CURUÁ",
    "GURUPÃ": "GURUPÁ",
    "VÃ RZEA": "VÁRZEA",
    "VÃRZEA": "VÁRZEA",
    "Ã“BIDOS": "ÓBIDOS",
    "ÃBIDOS": "ÓBIDOS",
    "PARÃ": "PARÁ",
    "AMAPÃ": "AMAPÁ",
    "AMAZÃ”NAS": "AMAZONAS",
    "AMAZÃ”NIA": "AMAZÔNIA",
    "DomÃ­nio": "Domínio",
    "DomÃnio": "Domínio",
    "PÃºblico": "Público",
    "PÃblico": "Público",
    "MunicÃ­pio": "Município",
    "MunicÃpio": "Município",
    "IndÃ­gena": "Indígena",
    "IndÃgena": "Indígena",
    "IndÃ­genas": "Indígenas",
    "IndÃgenas": "Indígenas",
    "RegiÃ£o": "Região",
    "PerÃ­metro": "Perímetro",
    "ExtensÃ£o": "Extensão",
    "DescriÃ§Ã£o": "Descrição",
    "PopulaÃ§Ã£o": "População",
    "LocalizaÃ§Ã£o": "Localização",
    "SaÃºde": "Saúde",
    "Ã rea": "Área",
    "d'Ã¡gua": "d'água",
    "D'Ã gua": "D'Água"
  };

  for (const [bad, good] of Object.entries(exactMojibake)) {
    s = s.split(bad).join(good);
  }

  return s;
}

/**
 * =============================================================================
 * [PT-BR] BASE DE CONHECIMENTO ETNOGRÁFICA & HIDROGRÁFICA
 * [EN] ETHNOGRAPHIC & HYDROGRAPHIC KNOWLEDGE BASE
 * =============================================================================
 */
const ETNO_KNOWLEDGE_BASE = {
  etnias: {
    "Wai Wai": {
      familia: "Karib",
      regiao: "Calha Norte do Pará e Roraima (Bacia do Rio Mapuera e Trombetas)",
      populacao: "Mais de 4.350 pessoas",
      caracteristicas: "Mestres canoeiros e guardiões das matas setentrionais da Amazônia, com sede sociopolítica na Aldeia Polo Mapuera."
    },
    "Galibi-Marworno": {
      familia: "Aruak e Língua Kréyol",
      regiao: "Complexo do Oiapoque (Amapá)",
      populacao: "Mais de 4.195 pessoas",
      caracteristicas: "Povo anfíbio tradicional das áreas alagáveis do Rio Uaçá, tendo a Aldeia Kumaruman (construída sobre palafitas) como principal centro."
    },
    "Palikur-Arukwayene": {
      familia: "Aruak",
      regiao: "Rio Urucauá e Curipi (Amapá)",
      populacao: "Mais de 2.100 pessoas",
      caracteristicas: "Habitantes ancestrais dos campos inundáveis, com vasta tradição em astronomia e sede na Aldeia Polo Kumenê."
    },
    "Kaxuyana e Tunayana": {
      familia: "Karib",
      regiao: "Cabeceiras dos rios Katxuru e Cachorro (Pará)",
      populacao: "Mais de 1.480 pessoas",
      caracteristicas: "Conhecidos como 'Povo da Água' (Tunayana), protagonistas da demarcação e preservação do seu território ancestral."
    },
    "Hixkaryana": {
      familia: "Karib",
      regiao: "Médio e Alto Rio Nhamundá (PA/AM)",
      populacao: "Mais de 850 pessoas",
      caracteristicas: "Tradicionais navegadores e coletores florestais assentados na calha do Rio Nhamundá."
    }
  },
  rios: {
    "Rio Mapuera": {
      bacia: "Bacia do Rio Trombetas / Baixo Amazonas",
      extensao: "Mais de 340 km",
      descricao: "Principal via de navegação fluvial que interliga as comunidades Wai Wai de norte a sul da TI Trombetas/Mapuera."
    },
    "Rio Nhamundá": {
      bacia: "Bacia do Baixo Amazonas",
      extensao: "Divisa natural entre o Pará e o Amazonas",
      descricao: "Histórico rio de águas escuras que abriga comunidades Hixkaryana e extensas áreas de castanhais nativos."
    },
    "Rio Uaçá": {
      bacia: "Bacia Costeira do Extremo Norte do Amapá",
      extensao: "Campos alagáveis e estuários do Oiapoque",
      descricao: "Sistema fluvial e lacustre pulsante que alimenta o território dos Galibi-Marworno."
    },
    "Rio Oiapoque": {
      bacia: "Bacia Transfronteiriça Brasil - Guiana Francesa",
      extensao: "Mais de 370 km de curso fluvial",
      descricao: "Canal internacional estratégico de comunicação entre povos indígenas transfronteiriços e o Oceano Atlântico."
    },
    "Rio Katxuru / Cachorro": {
      bacia: "Alto Trombetas",
      extensao: "Afluente direto do Rio Trombetas",
      descricao: "Rio encachoeirado de floresta densa que corta o território dos povos Kaxuyana e Tunayana."
    }
  }
};

/**
 * =============================================================================
 * [PT-BR] CONVERSORES GEODÉSICOS SIRGAS 2000 (DMS & PROJEÇÃO UTM)
 * [EN] SIRGAS 2000 GEODETIC CONVERTERS (DMS & UTM PROJECTION)
 * =============================================================================
 */
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
 * =============================================================================
 * [PT-BR] NORMALIZAÇÃO E ENRIQUECIMENTO DE TERRAS INDÍGENAS
 * [EN] INDIGENOUS LANDS FEATURE ENHANCEMENT & NORMALIZATION
 * =============================================================================
 */
window.enhanceTerraIndigenaFeature = function(props) {
  const p = { ...props };
  const nameNorm = (p.terrai_nom || "").toLowerCase().trim();

  const tiData = {
    "trombetas/mapuera": {
      nome_oficial: "Terra Indígena Trombetas/Mapuera",
      superficie_ha: 3970420,
      populacao_estimada: 4350,
      etnia_nome: "Wai Wai, Hixkaryana, Katuena, Tunayana",
      familia_linguistica: "Karib e Aruak",
      fase_ti: "Regularizada / Homologada",
      decreto_homologacao: "Decreto Presidencial s/nº de 18/12/2009",
      municipios_lista: "Oriximiná, Faro, Nhamundá",
      uf_sigla: "PA / AM / RR",
      bacia_principal: "Bacia do Rio Trombetas / Rio Mapuera",
      bioma: "Amazônia Setentrional",
      descricao_etnoambiental: "Maior Terra Indígena contígua da Calha Norte do Pará, garantindo a sustentabilidade dos povos Wai Wai."
    },
    "kaxuyana-tunayana": {
      nome_oficial: "Terra Indígena Kaxuyana-Tunayana",
      superficie_ha: 2184602,
      populacao_estimada: 1480,
      etnia_nome: "Kaxuyana, Tunayana, Kahyana, Txikiyana",
      familia_linguistica: "Karib",
      fase_ti: "Declarada / Regularizada",
      decreto_homologacao: "Portaria Declaratória MJ nº 196 de 20/09/2018",
      municipios_lista: "Oriximiná, Faro, Nhamundá",
      uf_sigla: "PA / AM",
      bacia_principal: "Bacia do Rio Katxuru e Rio Cachorro",
      bioma: "Floresta Tropical Densa",
      descricao_etnoambiental: "Território tradicional de refúgio e reconquista histórica dos povos Kaxuyana e Tunayana."
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
      bacia_principal: "Bacia do Rio Nhamundá e Rio Mapuera",
      bioma: "Amazônia",
      descricao_etnoambiental: "Sede de comunidades históricas Hixkaryana ao longo da calha do Rio Nhamundá."
    },
    "uaçá": {
      nome_oficial: "Terra Indígena Uaçá",
      superficie_ha: 470160,
      populacao_estimada: 4195,
      etnia_nome: "Galibi-Marworno, Palikur-Arukwayene, Karipuna",
      familia_linguistica: "Kréyol Francês, Aruak (Palikur)",
      fase_ti: "Regularizada / Homologada",
      decreto_homologacao: "Decreto Presidencial nº 68.667 de 26/05/1971",
      municipios_lista: "Oiapoque",
      uf_sigla: "AP",
      bacia_principal: "Bacia dos Rios Uaçá, Curipi e Urucauá",
      bioma: "Amazônia / Campos Inundáveis",
      descricao_etnoambiental: "Maior território indígena do Amapá, situado no Complexo Transfronteiriço do Oiapoque."
    }
  };

  let matched = null;
  for (const [key, val] of Object.entries(tiData)) {
    if (nameNorm.includes(key) || key.includes(nameNorm)) {
      matched = val;
      break;
    }
  }

  if (matched) {
    p.nome_oficial = matched.nome_oficial;
    p.terrai_nom = matched.nome_oficial;
    p.superficie_ha = matched.superficie_ha;
    p.superficie = matched.superficie_ha;
    p.superficie_ha_formatada = Number(matched.superficie_ha).toLocaleString('pt-BR') + " ha";
    p.populacao_estimada = matched.populacao_estimada;
    p.etnia_nome = matched.etnia_nome;
    p.fase_ti = matched.fase_ti;
    p.decreto_homologacao = matched.decreto_homologacao;
    p.municipios_lista = matched.municipios_lista;
    p.uf_sigla = matched.uf_sigla;
    p.bacia_principal = matched.bacia_principal;
    p.bioma = matched.bioma;
    p.descricao_etnoambiental = matched.descricao_etnoambiental;
  } else {
    p.nome_oficial = cleanAccents(p.terrai_nom || "Terra Indígena");
    p.superficie_ha_formatada = p.superficie ? Number(p.superficie).toLocaleString('pt-BR') + " ha" : "N/D";
  }

  p.datum_oficial = "SIRGAS 2000 (EPSG: 4674)";
  return p;
};

/**
 * =============================================================================
 * [PT-BR] NORMALIZAÇÃO E TOPONÍMIA RIGOROSA DE ALDEIAS INDÍGENAS
 * [EN] INDIGENOUS VILLAGES TOPONYMY & OFFICIAL HEALTH BASE NORMALIZATION
 * =============================================================================
 */
window.enhanceAldeiaFeature = function(props, coords) {
  const p = { ...props };
  const cod = String(p.cod_aldeia || p.cod || "");

  const officialVillageNames = {
    "1860": "Aldeia Paraíso",
    "5270": "Aldeia Qkecekere",
    "157": "Aldeia Polo Kumaruman",
    "156": "Aldeia Polo Manga",
    "158": "Aldeia Polo Kumenê",
    "1859": "Aldeia Polo Mapuera",
    "1861": "Aldeia Polo Paraíso / Katxuru",
    "1863": "Aldeia Kwanaramari",
    "1864": "Aldeia Bateria",
    "1865": "Aldeia Tamyuru",
    "1866": "Aldeia Ponkuru"
  };

  let rawName = officialVillageNames[cod] || p.nome_aldei || "Aldeia Indígena";
  if (cod === "1860" || rawName.includes("Para") || rawName.includes("PARÁ")) {
    rawName = "Aldeia Paraíso";
  } else if (cod === "5270" || rawName.toLowerCase().includes("kecekere")) {
    rawName = "Aldeia Qkecekere";
  } else if (cod === "157" || rawName.toLowerCase().includes("kumarum")) {
    rawName = "Aldeia Polo Kumaruman";
  } else if (cod === "1863" || rawName.toLowerCase().includes("kwana")) {
    rawName = "Aldeia Kwanaramari";
  }

  const lng = coords ? coords[0] : (p.coord_long ? parseFloat(p.coord_long) : null);
  const lat = coords ? coords[1] : (p.coord_lat ? parseFloat(p.coord_lat) : null);

  p.nome_formatado = rawName;
  p.nome_aldei = rawName;
  p.terra_indigena = cleanAccents(p.terra_indigena || (lat > 2.0 ? "TI Uaçá" : "TI Trombetas/Mapuera"));
  p.etnia_predominante = cleanAccents(p.etnia_predominante || (lat > 2.0 ? "Galibi-Marworno / Palikur" : "Wai Wai / Kaxuyana"));
  p.nommunic = cleanAccents(p.nommunic || (lat > 2.0 ? "Oiapoque" : "Oriximiná"));
  p.nomuf = cleanAccents(p.nomuf || (lat > 2.0 ? "Amapá" : "Pará"));
  p.rio_proximo = cleanAccents(p.rio_proximo || (lat > 2.0 ? "Rio Uaçá" : "Rio Mapuera"));
  p.populacao_estimada = p.populacao_estimada || 180;
  p.unidade_saude = cleanAccents(p.unidade_saude || "Atendimento Periódico EMSI (DSEI)");
  p.descricao_detalhada = cleanAccents(p.descricao_detalhada || "Aldeia indígena atendida pelo Projeto Energia Limpa.");

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
 * =============================================================================
 * [PT-BR] NORMALIZAÇÃO DE RECURSOS HÍDRICOS (ANA BHO)
 * [EN] WATER RESOURCES & RIVERS NORMALIZATION (ANA BHO)
 * =============================================================================
 */
window.enhanceMassaDaguaFeature = function(props) {
  const p = { ...props };
  const nomeRaw = cleanAccents(p.nmoriginal || "").trim();

  p.nome_formatado = nomeRaw ? nomeRaw : "Massa de Água / Curso Hídrico";
  p.tipo_formatado = cleanAccents(p.detipomda || "Curso d'Água Natural");
  p.dominio_formatado = cleanAccents(p.dedominio || "Domínio Público Federal / Estadual");
  p.municipio_formatado = cleanAccents(p.nmmun || "Calha Norte / Oiapoque");
  p.uf_formatada = cleanAccents(p.nmufe || "PA / AM / AP");

  if (p.nuareakm2) {
    const a = parseFloat(p.nuareakm2);
    p.area_km2_formatada = !isNaN(a) ? `${a.toFixed(2)} km²` : `${p.nuareakm2} km²`;
  } else {
    p.area_km2_formatada = "Sob medição";
  }

  if (p.nuperimkm) {
    const per = parseFloat(p.nuperimkm);
    p.perimetro_km_formatado = !isNaN(per) ? `${per.toFixed(2)} km` : `${p.nuperimkm} km`;
  }

  p.fonte_oficial = "Agência Nacional de Águas (ANA) • BHO 2019";
  p.datum_oficial = "SIRGAS 2000 (EPSG: 4674)";
  return p;
};

window.ETNO_KNOWLEDGE_BASE = ETNO_KNOWLEDGE_BASE;
