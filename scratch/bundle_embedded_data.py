import json
import os

print("=== Gerando js/embedded-data.js ===")

data_dir = "data"
js_out = "js/embedded-data.js"

with open(os.path.join(data_dir, "area_de_estudo.geojson"), "r", encoding="utf-8") as f:
    ti_data = json.load(f)

with open(os.path.join(data_dir, "Pontos_aldeias.geojson"), "r", encoding="utf-8") as f:
    aldeias_data = json.load(f)

with open(os.path.join(data_dir, "massa_de_agua.geojson"), "r", encoding="utf-8") as f:
    water_data = json.load(f)

embedded = {
    "terrasIndigenas": ti_data,
    "aldeias": aldeias_data,
    "massaDeAgua": water_data
}

with open(js_out, "w", encoding="utf-8") as f:
    f.write("/**\n")
    f.write(" * =============================================================================\n")
    f.write(" * [PT-BR] PACOTE DE DADOS GEOESPACIAIS EMBUTIDOS (100% OFFLINE & CORS-FREE)\n")
    f.write(" * [EN] EMBEDDED GEOSPATIAL DATASETS (100% OFFLINE & CORS-FREE)\n")
    f.write(" * =============================================================================\n")
    f.write(" * Projeto: Energia Limpa, Vida Sustentável\n")
    f.write(" * Elaboração feita por: Jhamenson Nascimento\n")
    f.write(" * Referência Geodésica: SIRGAS 2000 (EPSG:4674)\n")
    f.write(" * =============================================================================\n")
    f.write(" */\n\n")
    f.write("window.EMBEDDED_DATA = ")
    json.dump(embedded, f, ensure_ascii=False, separators=(',', ':'))
    f.write(";\n")

size_mb = os.path.getsize(js_out) / (1024 * 1024)
print(f"js/embedded-data.js gerado com sucesso! Tamanho: {size_mb:.2f} MB")
