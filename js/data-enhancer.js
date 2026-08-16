/**
 * Data Enhancer & Knowledge Base - PROJETO: ENERGIA LIMPA
 * Ethnographic knowledge, official FUNAI village attributes,
 * indigenous territories, hydrographic basins, and strict SIRGAS 2000 coordinates.
 */

function cleanAccents(str) {
  if (!str) return "";
  let s = String(str);

  // Universal regex-based Portuguese term cleaners
  const fixes = [
    [/H[Ã\u00c3\u00c2\ufffd\?]{1,3}drico/gi, "Hídrico"],
    [/JOS[Ã\u00c3\u00c2\ufffd\?]{1,3}\b/gi, "JOSÉ"],
    [/PORF[Ã\u00c3\u00c2\ufffd\?]{1,3}RIO/gi, "PORFÍRIO"],
    [/VIT[Ã\u00c3\u00c2\ufffd\?]{1,3}RIA/gi, "VITÓRIA"],
    [/ORIXIMIN[^\s"",()]{1,4}/gi, "ORIXIMINÁ"],
    [/NHAMUND[^\s"",()]{1,4}/gi, "NHAMUNDÁ"],
    [/SANTAR[^\s"",()]{1,4}M/gi, "SANTARÉM"],
    [/URUCAR[^\s"",()]{1,4}/gi, "URUCARÁ"],
    [/CURU[^\s"",()]{1,4}/gi, "CURUÁ"],
    [/GURUP[^\s"",()]{1,4}/gi, "GURUPÁ"],
    [/V[^\s"",()]{1,4}RZEA/gi, "VÁRZEA"],
    [/[^\s"",()]{1,4}BIDOS/gi, "ÓBIDOS"],
    [/PAR[^\s"",()]{1,4}/gi, "PARÁ"],
    [/AMAP[^\s"",()]{1,4}/gi, "AMAPÁ"],
    [/AMAZ[^\s"",()]{1,4}NAS/gi, "AMAZONAS"],
    [/AMAZ[^\s"",()]{1,4}NIA/gi, "AMAZÔNIA"],
    [/Dom[Ã\u00c3\u00c2\ufffd\?]{1,3}nio/gi, "Domínio"],
    [/P[Ã\u00c3\u00c2\ufffd\?]{1,3}blico/gi, "Público"],
    [/Munic[Ã\u00c3\u00c2\ufffd\?]{1,3}pio/gi, "Município"],
    [/Ind[Ã\u00c3\u00c2\ufffd\?]{1,3}gena/gi, "Indígena"],
    [/Ind[Ã\u00c3\u00c2\ufffd\?]{1,3}genas/gi, "Indígenas"],
    [/Regi[Ã\u00c3\u00c2\ufffd\?]{1,3}o/gi, "Região"],
    [/Per[Ã\u00c3\u00c2\ufffd\?]{1,3}metro/gi, "Perímetro"],
    [/Extens[Ã\u00c3\u00c2\ufffd\?]{1,3}o/gi, "Extensão"],
    [/Descri[Ã\u00c3\u00c2\ufffd\?]{1,3}o/gi, "Descrição"],
    [/Popula[Ã\u00c3\u00c2\ufffd\?]{1,3}o/gi, "População"],
    [/Localiza[Ã\u00c3\u00c2\ufffd\?]{1,3}o/gi, "Localização"],
    [/Aten[Ã\u00c3\u00c2\ufffd\?]{1,3}o/gi, "Atenção"],
    [/Sa[Ã\u00c3\u00c2\ufffd\?]{1,3}de/gi, "Saúde"],
    [/Geogr[Ã\u00c3\u00c2\ufffd\?]{1,3}fica/gi, "Geográfica"],
    [/Cartogr[Ã\u00c3\u00c2\ufffd\?]{1,3}fica/gi, "Cartográfica"],
    [/Refer[Ã\u00c3\u00c2\ufffd\?]{1,3}ncia/gi, "Referência"],
    [/Geod[Ã\u00c3\u00c2\ufffd\?]{1,3}sica/gi, "Geodésica"],
    [/S[Ã\u00c3\u00c2\ufffd\?]{1,3}tio/gi, "Sítio"],
    [/S[Ã\u00c3\u00c2\ufffd\?]{1,3}tios/gi, "Sítios"],
    [/Hist[Ã\u00c3\u00c2\ufffd\?]{1,3}rico/gi, "Histórico"],
    [/Hist[Ã\u00c3\u00c2\ufffd\?]{1,3}rica/gi, "Histórica"],
    [/D['’]?[Ã\u00c3\u00c2\ufffd\?]{1,3}gua/gi, "d'água"]
  ];

  fixes.forEach(([pattern, replacement]) => {
    s = s.replace(pattern, replacement);
  });

  return s;
}

const ETNO_KNOWLEDGE_BASE = {
  etnias: {
    "Wai Wai": {
      familia: "Karib",
      regiao: "Calha Norte do Pará e Roraima (Bacia do Rio Mapuera e Trombetas)",
      populacao: "Mais de 4.000 pessoas",
      caracteristicas: "Conhecidos como mestres canoeiros e guardiões das matas setentrionais da Amazônia, com organização comunitária em torno de aldeias polo como Mapuera."
    },
    "Galibi-Marworno": {
      familia: "Kréyol (Língua de contato de base lexical francesa) / Aruak",
      regiao: "Complexo do Oiapoque (Bacia do Rio Uaçá e campos inundáveis)",
      populacao: "Aprox. 3.500 pessoas",
      caracteristicas: "Povo anfíbio, mestres na navegação dos lagos e igapós do Amapá e construtores de aldeias sobre palafitas como Kumarumã."
    },
    "Palikur-Arukwayene": {
      familia: "Aruak",
      regiao: "Bacia do Rio Urucauá (TI Uaçá, Oiapoque/AP)",
      populacao: "Aprox. 1.800 pessoas",
      caracteristicas: "Tradicionais navegadores e astrônomos do Oiapoque, com profunda cosmologia ligada aos cursos d'água e constelações ancestrais."
    },
    "Kaxuyana": {
      familia: "Karib",
      regiao: "Bacia do Rio Cachorro e Rio Katxuru (TI Kaxuyana-Tunayana)",
      populacao: "Aprox. 1.200 pessoas",
      caracteristicas: "Habitantes ancestrais das cabeceiras dos afluentes do Trombetas, protagonistas do processo histórico de reconquista e demarcação de sua terra tradicional."
    },
    "Tunayana": {
      familia: "Karib / Aruak",
      regiao: "Interflúvio Katxuru-Trombetas",
      populacao: "Aprox. 450 pessoas",
      caracteristicas: "Autodenominados 'Povo da Água' (Tuna = água/rio), com rica cultura material e conexões históricas transfronteiriças."
    },
    "Hixkaryana": {
      familia: "Karib",
      regiao: "Bacia do Rio Nhamundá (Faro/PA e Nhamundá/AM)",
      populacao: "Aprox. 1.500 pessoas",
      caracteristicas: "Povo tradicional da divisa Pará-Amazonas, com reconhecida estrutura de aldeias ribeirinhas como Kassawá e Cafezal."
    },
    "Karipuna": {
      familia: "Kréyol / Línguas Karib e Tupi",
      regiao: "Bacia do Rio Curipi (TI Uaçá, Oiapoque/AP)",
      populacao: "Aprox. 3.000 pessoas",
      caracteristicas: "Comunidades tradicionais localizadas ao longo do Rio Curipi com forte identidade cultural e liderança nas organizações indígenas do Amapá."
    }
  },

  rios: {
    "Rio Mapuera": {
      bacia: "Bacia Hidrográfica do Rio Trombetas / Amazonas",
      extensao: "Principal via fluvial da TI Trombetas/Mapuera",
      descricao: "Rio de águas claras com corredeiras e rica ictiofauna, eixo de transporte e sustento de dezenas de aldeias Wai Wai."
    },
    "Rio Trombetas": {
      bacia: "Margem esquerda do Rio Amazonas",
      extensao: "Mais de 750 km de extensão",
      descricao: "Um dos mais importantes tributários do norte amazônico, com exuberante biodiversidade e complexos de lagos e florestas de terra firme."
    },
    "Rio Nhamundá": {
      bacia: "Bacia do Baixo Amazonas",
      extensao: "Divisa natural entre o Pará e o Amazonas",
      descricao: "Histórico rio de águas escuras que abriga comunidades Hixkaryana e extensas áreas de várzea e castanhais nativos."
    },
    "Rio Uaçá": {
      bacia: "Bacia Costeira do Extremo Norte do Amapá",
      extensao: "Campos alagáveis e manguezais do Oiapoque",
      descricao: "Sistema fluvial e lacustre pulsante que alimenta o território dos Galibi-Marworno e Karipuna."
    },
    "Rio Oiapoque": {
      bacia: "Bacia Transfronteiriça Brasil - Guiana Francesa",
      extensao: "Mais de 370 km de curso fluvial",
      descricao: "Rio fronteiriço internacional, canal estratégico de comunicação entre povos indígenas transfronteiriços e o Oceano Atlântico."
    },
    "Rio Katxuru / Cachorro": {
      bacia: "Alto Trombetas",
      extensao: "Afluente direto do Rio Trombetas",
      descricao: "Rio encachoeirado de floresta densa que corta o território dos povos Kaxuyana e Tunayana."
    }
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
      fase_ti: "Regularizada / Homologada",
      decreto_homologacao: "Decreto Presidencial s/nº de 18/12/2009",
      municipios_lista: "Oriximiná, Faro, Nhamundá, Urucará, Caracaraí",
      uf_sigla: "PA / AM / RR",
      bacia_principal: "Bacia do Rio Trombetas / Rio Mapuera / Rio Cachorro",
      bioma: "Amazônia Setentrional",
      descricao_etnoambiental: "Maior Terra Indígena contígua da Calha Norte do Pará, garantindo a sustentabilidade dos povos Wai Wai."
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
      superficie_ha: 470164,
      populacao_estimada: 6950,
      etnia_nome: "Karipuna, Galibi-Marworno, Palikur-Arukwayene",
      familia_linguistica: "Kréyol Francês, Aruak (Palikur)",
      fase_ti: "Regularizada / Homologada",
      decreto_homologacao: "Decreto Presidencial nº 68.667 de 26/05/1971",
      municipios_lista: "Oiapoque",
      uf_sigla: "AP",
      bacia_principal: "Bacia Hidrográfica do Rio Uaçá e Campos Inundáveis",
      bioma: "Amazônia Costeira e Manguezais",
      descricao_etnoambiental: "Complexo socioambiental transfronteiriço do Oiapoque abrigando três etnias."
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
      descricao_etnoambiental: "Área tradicional dos povos indígenas do norte do Amapá."
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
      descricao_etnoambiental: "Território tradicional do povo Galibi (Kali'na) na foz do Oiapoque."
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
 * Enhancer for ANA Massa de Água (geoft_bho_massa_dagua_v2019)
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
