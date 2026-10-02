import geopandas as gpd
import pyogrio
import json

tis = gpd.read_file("data/area_de_estudo.geojson", engine="pyogrio")
if tis.crs != "EPSG:4674":
    tis = tis.to_crs("EPSG:4674")

shp_path = r"C:\QGIS_camadas\Camadas\Vetores\hidrografia\hydrography_amazonia_legal.shp"
hydro = gpd.read_file(shp_path, engine="pyogrio")
if hydro.crs != "EPSG:4674":
    hydro = hydro.to_crs("EPSG:4674")

print("Total feições na Amazônia Legal:", len(hydro))

# Teste 1: Interseção direta (rios/massas d'água dentro ou tocando as 4 TIs)
direct_intersect = gpd.sjoin(hydro, tis[['geometry', 'Nome']], how='inner', predicate='intersects')
print(f"Interseção direta com as 4 TIs: {len(direct_intersect)} feições")

# Teste 2: Buffer de 0.05 graus (~5.5 km de conexão hidrográfica)
tis_buffer_005 = tis.copy()
tis_buffer_005['geometry'] = tis_buffer_005.geometry.buffer(0.05)
buf_intersect_005 = gpd.sjoin(hydro, tis_buffer_005[['geometry', 'Nome']], how='inner', predicate='intersects')
print(f"Com buffer 0.05 graus (~5km): {len(buf_intersect_005)} feições")

# Teste 3: Buffer de 0.02 graus (~2.2 km)
tis_buffer_002 = tis.copy()
tis_buffer_002['geometry'] = tis_buffer_002.geometry.buffer(0.02)
buf_intersect_002 = gpd.sjoin(hydro, tis_buffer_002[['geometry', 'Nome']], how='inner', predicate='intersects')
print(f"Com buffer 0.02 graus (~2km): {len(buf_intersect_002)} feições")

# Vamos ver o tamanho do geojson resultante
hydro_filtered = hydro.iloc[buf_intersect_002.index.unique()].copy()
print("Feições únicas selecionadas (buffer 0.02):", len(hydro_filtered))

# Verificar tamanho dos dados e campos
print("Campos disponíveis:", hydro_filtered.columns.tolist())
print("Área total km² dos rios selecionados:", hydro_filtered['area_km'].sum())
