import geopandas as gpd
import pyogrio
import json
import os

print("=== 1. Carregando Terras Indigenas ===")
tis = gpd.read_file("data/area_de_estudo.geojson", engine="pyogrio")
if tis.crs != "EPSG:4674":
    tis = tis.to_crs("EPSG:4674")

print("=== 2. Carregando Shapefile de Hidrografia ===")
shp_path = r"C:\QGIS_camadas\Camadas\Vetores\hidrografia\hydrography_amazonia_legal.shp"
hydro = gpd.read_file(shp_path, engine="pyogrio")
if hydro.crs != "EPSG:4674":
    hydro = hydro.to_crs("EPSG:4674")

print(f"Total de feições originais: {len(hydro)}")

# 3. Buffer de conexão de 0.03 graus (~3.3 km)
tis_buf = tis.copy()
tis_buf['geometry'] = tis.geometry.buffer(0.03)

# 4. Interseção espacial (sjoin)
joined = gpd.sjoin(hydro, tis_buf[['geometry', 'terrai_nom', 'uf_sigla']], how='inner', predicate='intersects')
unique_indices = joined.index.unique()
filtered = hydro.loc[unique_indices].copy()

# Mapear conexão com TI
ti_map = joined.groupby(joined.index)['terrai_nom'].apply(lambda s: " / ".join(sorted(set(s)))).to_dict()
filtered['ti_conexao'] = filtered.index.map(ti_map)

# 5. Formatar propriedades para compatibilidade total com o WebGIS
formatted_rows = []
for idx, (original_idx, row) in enumerate(filtered.iterrows(), start=1):
    state = row.get('state') or 'PA'
    ti_conn = row.get('ti_conexao') or 'Terra Indígena'
    area_km2 = float(row.get('area_km') or 0.0)
    
    # Nome expressivo com base na TI conectada e dimensão
    if "Ua" in ti_conn:
        nome = f"Recurso Hídrico Uaçá / Oiapoque ({state})"
        mun = "Oiapoque"
    elif "Trombetas" in ti_conn and "Mapuera" in ti_conn:
        nome = f"Calha Hídrica Rio Trombetas / Mapuera ({state})"
        mun = "Oriximiná / Faro"
    elif "Nhamund" in ti_conn:
        nome = f"Bacia Hídrica Rio Nhamundá ({state})"
        mun = "Nhamundá / Faro"
    elif "Kaxuyana" in ti_conn:
        nome = f"Curso Hídrico Katxuru / Cachorro ({state})"
        mun = "Oriximiná"
    else:
        nome = f"Recurso Hídrico Conectado - {ti_conn} ({state})"
        mun = "Calha Norte / Amazônia"

    formatted_rows.append({
        'gid': idx,
        'nmoriginal': nome,
        'detipomda': 'Massa d\'Água / Rio Conectado',
        'dedominio': 'Domínio Público da União',
        'nmmun': mun,
        'nmufe': state,
        'nuareakm2': round(area_km2, 4) if area_km2 > 0 else 0.05,
        'ti_conexao': ti_conn,
        'datum': 'SIRGAS 2000 (EPSG:4674)',
        'geometry': row['geometry'].simplify(0.00008, preserve_topology=True)
    })

final_gdf = gpd.GeoDataFrame(formatted_rows, crs="EPSG:4674")

print(f"Total de feições conectadas e filtradas: {len(final_gdf)}")
print("Distribuição por UF:")
print(final_gdf['nmufe'].value_counts())

# 6. Salvar em data/massa_de_agua.geojson
out_file = "data/massa_de_agua.geojson"
final_gdf.to_file(out_file, driver="GeoJSON")

sz_mb = os.path.getsize(out_file) / (1024 * 1024)
print(f"Arquivo '{out_file}' gravado com sucesso! Tamanho: {sz_mb:.2f} MB")
