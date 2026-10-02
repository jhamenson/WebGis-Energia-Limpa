import geopandas as gpd
import pyogrio
import json
from shapely.geometry import box

print("=== Carregando TIs e Aldeias ===")
tis = gpd.read_file("data/area_de_estudo.geojson", engine="pyogrio")
aldeias = gpd.read_file("data/Pontos_aldeias.geojson", engine="pyogrio")

print(f"TIs carregadas: {len(tis)}")
print(f"Aldeias carregadas: {len(aldeias)}")

# Garantir CRS EPSG:4674 (SIRGAS 2000)
if tis.crs != "EPSG:4674":
    tis = tis.to_crs("EPSG:4674")
if aldeias.crs != "EPSG:4674":
    aldeias = aldeias.to_crs("EPSG:4674")

shp_path = r"C:\QGIS_camadas\Camadas\Vetores\hidrografia\hydrography_amazonia_legal.shp"
print("\n=== Lendo shapefile de hidrografia ===")
hydro = gpd.read_file(shp_path, engine="pyogrio")
if hydro.crs != "EPSG:4674":
    hydro = hydro.to_crs("EPSG:4674")

print(f"Total de polígonos no shapefile original: {len(hydro)}")

# 1. Bounding box unificado com margem de segurança
minx, miny, maxx, maxy = tis.total_bounds
print(f"Extent TIs: ({minx}, {miny}) até ({maxx}, {maxy})")

# Criamos buffer de 0.03 graus (~3.3 km) ao redor de cada TI
tis_buffered = tis.copy()
tis_buffered['geometry'] = tis.geometry.buffer(0.03)

# Realizamos o sjoin para selecionar apenas os rios/lagos que intersectam as TIs (ou buffer de conexão imediata)
joined = gpd.sjoin(hydro, tis_buffered[['geometry', 'terrai_nom', 'uf_sigla']], how='inner', predicate='intersects')

unique_indices = joined.index.unique()
filtered_hydro = hydro.loc[unique_indices].copy()

# Atribui o nome da TI de conexão para cada corpo hídrico
ti_mapping = joined.groupby(joined.index)['terrai_nom'].apply(lambda x: " / ".join(sorted(set(x)))).to_dict()
filtered_hydro['ti_conexao'] = filtered_hydro.index.map(ti_mapping)

print(f"\nPolígonos de água conectados às TIs: {len(filtered_hydro)}")
print("Distribuição por TI conectada:")
print(filtered_hydro['ti_conexao'].value_counts())

# Simplificação suave de coordenadas (mantendo alta precisão topológica mas otimizando para WebGIS)
print("\nOtimizando geometrias para WebGIS...")
# 0.0001 graus ~= 11 metros de precisão
filtered_hydro['geometry'] = filtered_hydro.geometry.simplify(0.0001, preserve_topology=True)

# Limpeza de colunas para o WebGIS
cols_to_keep = ['fid', 'state', 'main_class', 'class_name', 'year', 'area_km', 'ti_conexao', 'geometry']
available_cols = [c for c in cols_to_keep if c in filtered_hydro.columns]
filtered_hydro = filtered_hydro[available_cols]

output_geojson = "scratch/filtered_hydrography_test.geojson"
filtered_hydro.to_file(output_geojson, driver="GeoJSON")

import os
file_size_mb = os.path.getsize(output_geojson) / (1024 * 1024)
print(f"\nArquivo de teste gerado com sucesso!")
print(f"Tamanho: {file_size_mb:.2f} MB")
print(f"Total feições salvas: {len(filtered_hydro)}")
